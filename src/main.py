import os
import logging
import psycopg2
import datetime
import json
from psycopg2.extras import DictCursor, Json
from dotenv import load_dotenv
from strands import Agent, tool
from firecrawl import FirecrawlApp
import praw
import prawcore
from typing import List
import requests

from models import ToolSnapshotData

# Load environment variables from .env file
load_dotenv()

# --- Database Configuration ---
DB_NAME = os.getenv("DB_NAME", "ai_platform")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# --- Logging Configuration ---
LOGS_DIR = 'logs'
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

main_log_file = os.path.join(LOGS_DIR, f"ai_platform_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(main_log_file),
        logging.StreamHandler()
    ]
)

# --- Database Connection ---
def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        logging.info("Successfully connected to the database.")
        return conn
    except psycopg2.OperationalError as e:
        logging.error(f"Could not connect to the database: {e}")
        return None

# --- Core Workflow Functions ---
def get_tools_to_process(conn):
    """Fetches tools that need to be processed."""
    with conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute("SELECT * FROM ai_tools WHERE run_status IS NULL OR run_status = 'update'")
        tools = cur.fetchall()
        logging.info(f"Found {len(tools)} tools to process.")
        return tools

def update_tool_run_status(conn, tool_id, status, last_run_time=None):
    """Updates the run status of a tool."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE ai_tools SET run_status = %s, last_run = %s WHERE id = %s",
            (status, last_run_time, tool_id)
        )
    conn.commit()

# --- Strands Agent Definition ---
class ToolIntelligenceAgent(Agent):
    def __init__(self, model: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"):
        aws_region = os.getenv("AWS_REGION", "us-west-2")
        logging.info(f"Initializing Strands Agent (AWS region: {aws_region})")
        logging.info(f"Model: {model}")
        logging.info(f"Configuration: max_tokens=8192, temperature=0.1 (optimized for comprehensive analysis)")
        # Configure for maximum detail and quality since this runs infrequently
        super().__init__(
            model=model,
            max_tokens=8192,      # Higher token limit for detailed responses
            temperature=0.1       # Low temperature for consistent, detailed analysis
        )
        # API keys and configs are now part of the agent's state
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        self.github_api_token = os.getenv("GITHUB_API_TOKEN")
        self.alpha_vantage_api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.news_api_key = os.getenv("NEWS_API_KEY")

        # Initialize Reddit (PRAW) client
        try:
            self.reddit_client = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID"),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
                user_agent=os.getenv("REDDIT_USER_AGENT", "GeminiIntelligence/1.0"),
                username=os.getenv("REDDIT_USERNAME"),
                password=os.getenv("REDDIT_PASSWORD"),
                check_for_async=False
            )
            logging.info(f"PRAW Reddit instance created. Read-only: {self.reddit_client.read_only}")
        except Exception as e:
            logging.error(f"Failed to initialize PRAW Reddit client: {e}")
            self.reddit_client = None

        # ProductHunt API token
        self.producthunt_api_token = os.getenv("PRODUCTHUNT_API_TOKEN")
        
        # Medium API key (optional)
        self.medium_api_key = os.getenv("MEDIUM_API_KEY")

        # Initialize FirecrawlApp
        firecrawl_params = {'api_key': self.firecrawl_api_key}
        if firecrawl_api_url := os.getenv("FIRECRAWL_API_URL"):
            firecrawl_params['api_url'] = firecrawl_api_url
            logging.info(f"Using custom Firecrawl API URL: {firecrawl_api_url}")
        self.firecrawl_app = FirecrawlApp(**firecrawl_params)

    @tool()
    def web_scraper(self, url: str) -> dict:
        """
        Scrapes a given URL using the Firecrawl service.
        :param url: The URL to scrape.
        :return: A dictionary containing the scraped content and metadata.
        """
        logging.info(f"Scraping URL via Firecrawl: {url}")
        if not self.firecrawl_api_key:
            logging.error("FIRECRAWL_API_KEY not found in environment variables.")
            return {"error": "API key not configured."}
        
        try:
            # Use the Firecrawl SDK to scrape the URL, passing options as keyword arguments
            scrape_result = self.firecrawl_app.scrape_url(url, only_main_content=True)

            if not scrape_result or not scrape_result.markdown:
                logging.warning(f"Firecrawl returned no content for {url}")
                return {"error": "No content found"}
            
            # The SDK returns an object with attributes
            return {
                "content": scrape_result.markdown,
                "metadata": scrape_result.metadata
            }
        except Exception as e:
            logging.error(f"Failed to scrape {url} via Firecrawl SDK: {e}", exc_info=True)
            return {"error": str(e)}

    @tool()
    def github_analyzer(self, repo_url: str) -> dict:
        """
        Analyzes a GitHub repository URL to extract key metrics.
        :param repo_url: The full URL of the GitHub repository.
        :return: A dictionary containing key metrics about the repository.
        """
        logging.info(f"Analyzing GitHub repo: {repo_url}")
        if not self.github_api_token:
            logging.error("GITHUB_API_TOKEN not found in environment variables.")
            return {"error": "API key not configured."}

        headers = {'Authorization': f'token {self.github_api_token}'}
        try:
            parts = repo_url.strip("/").split("/")
            if len(parts) < 2 or parts[-2] == 'features':
                logging.warning(f"Could not parse GitHub URL: {repo_url}")
                return {"error": "Could not parse GitHub URL"}
            owner, repo = parts[-2], parts[-1]
            api_url = f"https://api.github.com/repos/{owner}/{repo}"
            
            response = requests.get(api_url, headers=headers, timeout=10)
            if response.status_code == 404:
                logging.warning(f"Repository not found at {api_url}")
                return {"error": "Repository not found"}
            response.raise_for_status()
            data = response.json()
            
            return {
                "stars": data.get('stargazers_count'),
                "forks": data.get('forks_count'),
                "open_issues": data.get('open_issues_count'),
                "last_commit_date": data.get('pushed_at'),
                "description": data.get('description'),
                "topics": data.get('topics', [])
            }
        except (requests.RequestException, IndexError) as e:
            logging.error(f"Failed to analyze GitHub repo {repo_url}: {e}")
            return {"error": str(e)}

    @tool()
    def reddit_searcher(self, tool_name: str, subreddits: List[str]) -> dict:
        """
        Searches specific subreddits for a tool name using the Reddit API (PRAW).
        :param tool_name: The name of the tool to search for.
        :param subreddits: A list of subreddit names to search within.
        :return: A dictionary containing aggregated search results.
        """
        if not self.reddit_client:
            logging.error("Reddit client not initialized. Skipping Reddit search.")
            return {"error": "Reddit client not initialized."}

        logging.info(f"Searching Reddit API for '{tool_name}' in subreddits: {subreddits}")
        
        search_results = []
        try:
            for sub_name in subreddits:
                try:
                    subreddit = self.reddit_client.subreddit(sub_name)
                    # Search for the tool name in the subreddit, limit results to keep it focused
                    for submission in subreddit.search(tool_name, limit=10, sort='relevance', time_filter='year'):
                        search_results.append({
                            "subreddit": sub_name,
                            "title": submission.title,
                            "score": submission.score,
                            "url": submission.url,
                            "selftext": submission.selftext[:500] # Truncate for brevity
                        })
                except prawcore.exceptions.NotFound:
                    logging.warning(f"Subreddit 'r/{sub_name}' not found. Skipping.")
                except prawcore.exceptions.Forbidden:
                    logging.warning(f"Subreddit 'r/{sub_name}' is private or quarantined. Skipping.")

            # Sort results by score to prioritize more popular mentions
            search_results.sort(key=lambda x: x['score'], reverse=True)
            
            return {
                "search_results": search_results[:25] # Return top 25 results
            }
        except Exception as e:
            logging.error(f"An error occurred during Reddit API search: {e}", exc_info=True)
            return {"error": str(e)}

    @tool()
    def stock_data_fetcher(self, stock_symbol: str) -> dict:
        """
        Fetches the latest stock quote for a given symbol using Alpha Vantage.
        :param stock_symbol: The stock symbol (e.g., 'MSFT').
        :return: A dictionary containing the latest stock data.
        """
        logging.info(f"Fetching stock data for {stock_symbol}")
        if not stock_symbol or not self.alpha_vantage_api_key:
            logging.warning("No stock symbol or Alpha Vantage API key provided. Skipping.")
            return {"error": "Stock symbol or API key not provided."}
        
        base_url = "https://www.alphavantage.co/query"
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": stock_symbol,
            "apikey": self.alpha_vantage_api_key
        }
        try:
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            quote = data.get("Global Quote")
            if not quote:
                logging.warning(f"No data returned from Alpha Vantage for symbol {stock_symbol}. Response: {data}")
                return {"error": f"No data returned from API for symbol {stock_symbol}"}

            return {
                "stock_symbol": quote.get("01. symbol"),
                "price": float(quote.get("05. price", 0)),
                "volume": int(quote.get("06. volume", 0)),
                "last_trading_day": quote.get("07. latest trading day"),
                "change_percent": quote.get("10. change percent"),
                "source": "alpha_vantage"
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to fetch stock data for {stock_symbol}: {e}")
            return {"error": str(e)}

    @tool()
    def news_aggregator(self, tool_name: str) -> dict:
        """
        Searches for news articles mentioning a specific tool name using NewsAPI.org.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing a list of articles and the total count.
        """
        logging.info(f"Searching news for: {tool_name}")
        if not self.news_api_key:
            logging.warning("No NewsAPI.org API key provided. Skipping.")
            return {"error": "NewsAPI.org API key not provided."}

        base_url = "https://newsapi.org/v2/everything"
        query = f'"{tool_name}"'
        params = {
            "q": query,
            "apiKey": self.news_api_key,
            "language": "en",
            "sortBy": "relevancy",
            "pageSize": 20
        }
        try:
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            articles = [
                {
                    "source": article.get("source", {}).get("name"),
                    "title": article.get("title"),
                    "url": article.get("url"),
                    "published_at": article.get("publishedAt"),
                    "content_preview": article.get("description")
                } for article in data.get("articles", [])
            ]

            return {
                "articles": articles,
                "total_articles": data.get("totalResults", 0)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to fetch news for term {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def hackernews_searcher(self, tool_name: str) -> dict:
        """
        Searches HackerNews for mentions of a specific tool using the Algolia HN Search API.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from HackerNews.
        """
        logging.info(f"Searching HackerNews for: {tool_name}")
        
        # HackerNews uses Algolia for search - no API key required
        base_url = "https://hn.algolia.com/api/v1/search"
        params = {
            "query": tool_name,
            "tags": "story",
            "hitsPerPage": 20,
            "numericFilters": "points>10"  # Filter for stories with at least 10 points
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            hits = []
            for hit in data.get("hits", []):
                hits.append({
                    "title": hit.get("title"),
                    "url": hit.get("url"),
                    "hn_url": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                    "points": hit.get("points", 0),
                    "num_comments": hit.get("num_comments", 0),
                    "author": hit.get("author"),
                    "created_at": hit.get("created_at"),
                    "story_text": hit.get("story_text", "")[:300] if hit.get("story_text") else ""
                })
            
            return {
                "hits": hits,
                "total_hits": data.get("nbHits", 0)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search HackerNews for {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def stackoverflow_searcher(self, tool_name: str) -> dict:
        """
        Searches StackOverflow for questions related to a specific tool using the Stack Exchange API.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from StackOverflow.
        """
        logging.info(f"Searching StackOverflow for: {tool_name}")
        
        # Stack Exchange API - no API key required for basic usage
        base_url = "https://api.stackexchange.com/2.3/search"
        params = {
            "order": "desc",
            "sort": "votes",
            "intitle": tool_name,
            "site": "stackoverflow",
            "pagesize": 20,
            "filter": "default"  # Include body, title, score, etc.
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            questions = []
            for item in data.get("items", []):
                questions.append({
                    "title": item.get("title"),
                    "question_id": item.get("question_id"),
                    "url": item.get("link"),
                    "score": item.get("score", 0),
                    "view_count": item.get("view_count", 0),
                    "answer_count": item.get("answer_count", 0),
                    "is_answered": item.get("is_answered", False),
                    "creation_date": item.get("creation_date"),
                    "last_activity_date": item.get("last_activity_date"),
                    "tags": item.get("tags", []),
                    "owner": item.get("owner", {}).get("display_name", "Unknown")
                })
            
            return {
                "questions": questions,
                "total_questions": len(questions),
                "has_more": data.get("has_more", False)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search StackOverflow for {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def producthunt_searcher(self, tool_name: str) -> dict:
        """
        Searches ProductHunt for products related to a specific tool using the ProductHunt API.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from ProductHunt.
        """
        logging.info(f"Searching ProductHunt for: {tool_name}")
        
        if not self.producthunt_api_token:
            logging.warning("No ProductHunt API token provided. Skipping.")
            return {"error": "ProductHunt API token not provided."}
        
        # ProductHunt GraphQL API
        base_url = "https://api.producthunt.com/v2/api/graphql"
        
        # GraphQL query to search for posts
        query = """
        query($search_query: String!) {
            posts(first: 20, order: VOTES, postedAfter: "2020-01-01", searchBy: $search_query) {
                edges {
                    node {
                        id
                        name
                        tagline
                        description
                        url
                        websiteUrl
                        votesCount
                        commentsCount
                        createdAt
                        featuredAt
                        slug
                        topics {
                            edges {
                                node {
                                    name
                                }
                            }
                        }
                        productLinks {
                            type
                            url
                        }
                    }
                }
            }
        }
        """
        
        headers = {
            "Authorization": f"Bearer {self.producthunt_api_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        try:
            response = requests.post(
                base_url,
                json={
                    "query": query,
                    "variables": {"search_query": tool_name}
                },
                headers=headers,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            if "errors" in data:
                logging.error(f"ProductHunt API returned errors: {data['errors']}")
                return {"error": f"API errors: {data['errors']}"}
            
            products = []
            posts_data = data.get("data", {}).get("posts", {}).get("edges", [])
            
            for edge in posts_data:
                node = edge.get("node", {})
                topics = [topic["node"]["name"] for topic in node.get("topics", {}).get("edges", [])]
                
                products.append({
                    "id": node.get("id"),
                    "name": node.get("name"),
                    "tagline": node.get("tagline"),
                    "description": node.get("description"),
                    "url": node.get("url"),
                    "website_url": node.get("websiteUrl"),
                    "votes_count": node.get("votesCount", 0),
                    "comments_count": node.get("commentsCount", 0),
                    "created_at": node.get("createdAt"),
                    "featured_at": node.get("featuredAt"),
                    "slug": node.get("slug"),
                    "topics": topics,
                    "product_links": node.get("productLinks", [])
                })
            
            return {
                "products": products,
                "total_products": len(products)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search ProductHunt for {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def devto_searcher(self, tool_name: str) -> dict:
        """
        Searches Dev.to for articles mentioning a specific tool using the public API.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from Dev.to.
        """
        logging.info(f"Searching Dev.to for: {tool_name}")
        
        # Dev.to public API - no API key required
        base_url = "https://dev.to/api/articles"
        params = {
            "tag": "programming,webdev,tutorial,discuss",
            "per_page": 30,
            "state": "fresh"
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=15)
            response.raise_for_status()
            articles = response.json()
            
            # Filter articles that mention the tool name
            relevant_articles = []
            for article in articles:
                title = article.get("title", "").lower()
                description = article.get("description", "").lower()
                tags = [tag.lower() for tag in article.get("tag_list", [])]
                
                tool_name_lower = tool_name.lower()
                if (tool_name_lower in title or 
                    tool_name_lower in description or 
                    tool_name_lower in tags):
                    
                    relevant_articles.append({
                        "title": article.get("title"),
                        "url": article.get("url"),
                        "description": article.get("description"),
                        "published_at": article.get("published_at"),
                        "positive_reactions_count": article.get("positive_reactions_count", 0),
                        "comments_count": article.get("comments_count", 0),
                        "reading_time_minutes": article.get("reading_time_minutes", 0),
                        "tags": article.get("tag_list", []),
                        "user": article.get("user", {}).get("name", "Unknown"),
                        "organization": article.get("organization", {}).get("name") if article.get("organization") else None
                    })
            
            return {
                "articles": relevant_articles[:15],  # Limit to top 15 relevant articles
                "total_articles": len(relevant_articles)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search Dev.to for {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def npm_searcher(self, tool_name: str) -> dict:
        """
        Searches NPM registry for packages related to a specific tool.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing package information from NPM.
        """
        logging.info(f"Searching NPM for: {tool_name}")
        
        # NPM registry API - no API key required
        search_url = "https://registry.npmjs.org/-/v1/search"
        params = {
            "text": tool_name,
            "size": 20,
            "from": 0,
            "quality": 0.65,
            "popularity": 0.98,
            "maintenance": 0.5
        }
        
        try:
            response = requests.get(search_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            packages = []
            for obj in data.get("objects", []):
                package = obj.get("package", {})
                
                # Get detailed package info
                package_name = package.get("name")
                if package_name:
                    try:
                        detail_response = requests.get(f"https://registry.npmjs.org/{package_name}", timeout=10)
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            latest_version = package.get("version")
                            
                            packages.append({
                                "name": package_name,
                                "version": latest_version,
                                "description": package.get("description"),
                                "keywords": package.get("keywords", []),
                                "npm_url": f"https://www.npmjs.com/package/{package_name}",
                                "homepage": package.get("links", {}).get("homepage"),
                                "repository": package.get("links", {}).get("repository"),
                                "weekly_downloads": detail_data.get("downloads", {}).get("weekly") if "downloads" in detail_data else None,
                                "license": package.get("license"),
                                "last_publish": package.get("date"),
                                "author": package.get("author", {}).get("name") if package.get("author") else None,
                                "maintainers_count": len(package.get("maintainers", [])),
                                "score": obj.get("score", {})
                            })
                    except Exception as detail_error:
                        logging.warning(f"Could not get detailed info for {package_name}: {detail_error}")
                        continue
            
            return {
                "packages": packages,
                "total_packages": len(packages)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search NPM for {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def pypi_searcher(self, tool_name: str) -> dict:
        """
        Searches PyPI for packages related to a specific tool.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing package information from PyPI.
        """
        logging.info(f"Searching PyPI for: {tool_name}")
        
        # PyPI search using the warehouse API
        search_url = "https://pypi.org/search/"
        params = {
            "q": tool_name,
        }
        
        try:
            # Use the simple API for searching and then get details
            search_response = requests.get("https://pypi.org/simple/", timeout=15)
            
            # Alternative: Use PyPI JSON API for specific packages
            # Let's search for packages that might match the tool name
            potential_packages = [
                tool_name.lower(),
                tool_name.lower().replace(" ", "-"),
                tool_name.lower().replace(" ", "_"),
                f"python-{tool_name.lower()}",
                f"{tool_name.lower()}-python",
                f"{tool_name.lower()}-api",
                f"{tool_name.lower()}-sdk"
            ]
            
            packages = []
            for package_name in potential_packages:
                try:
                    detail_response = requests.get(f"https://pypi.org/pypi/{package_name}/json", timeout=10)
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        info = detail_data.get("info", {})
                        
                        # Get download stats (approximate using recent releases)
                        releases = detail_data.get("releases", {})
                        latest_version = info.get("version")
                        
                        packages.append({
                            "name": info.get("name"),
                            "version": latest_version,
                            "summary": info.get("summary"),
                            "description": info.get("description", "")[:500],  # Truncate
                            "keywords": info.get("keywords"),
                            "pypi_url": f"https://pypi.org/project/{package_name}/",
                            "home_page": info.get("home_page"),
                            "project_urls": info.get("project_urls", {}),
                            "author": info.get("author"),
                            "author_email": info.get("author_email"),
                            "license": info.get("license"),
                            "classifiers": info.get("classifiers", []),
                            "requires_python": info.get("requires_python"),
                            "upload_time": info.get("upload_time"),
                            "release_count": len(releases)
                        })
                except Exception as detail_error:
                    logging.debug(f"Package {package_name} not found on PyPI: {detail_error}")
                    continue
            
            return {
                "packages": packages,
                "total_packages": len(packages)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search PyPI for {tool_name}: {e}")
            return {"error": str(e)}

    @tool()
    def medium_searcher(self, tool_name: str) -> dict:
        """
        Searches Medium for articles mentioning a specific tool.
        Note: Medium's API has limited public access, so this uses web scraping approach.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from Medium.
        """
        logging.info(f"Searching Medium for: {tool_name}")
        
        # Medium search via RSS feeds and public endpoints
        # Note: Medium's official API requires partnership approval
        search_query = tool_name.replace(" ", "+")
        
        try:
            # Use Medium's search functionality
            search_url = f"https://medium.com/search"
            params = {
                "q": tool_name
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            # For now, let's use a simpler approach with RSS feeds from popular tech publications
            tech_publications = [
                "https://medium.com/feed/@towardsdatascience",
                "https://medium.com/feed/better-programming", 
                "https://medium.com/feed/hackernoon"
            ]
            
            articles = []
            for feed_url in tech_publications:
                try:
                    feed_response = requests.get(feed_url, headers=headers, timeout=10)
                    if feed_response.status_code == 200:
                        # Simple parsing for titles that mention the tool
                        content = feed_response.text
                        if tool_name.lower() in content.lower():
                            # This is a simplified approach - in production, you'd want proper RSS parsing
                            # For now, we'll return a placeholder structure
                            articles.append({
                                "title": f"Article mentioning {tool_name}",
                                "url": feed_url.replace("/feed", ""),
                                "publication": feed_url.split("/")[-1] if "/" in feed_url else "Medium",
                                "found_via": "RSS feed scan"
                            })
                except Exception as feed_error:
                    logging.debug(f"Could not process feed {feed_url}: {feed_error}")
                    continue
            
            # If we have the Medium API key, we could use it here
            if self.medium_api_key:
                logging.info("Medium API key available but partnership access required for full API")
            
            return {
                "articles": articles[:10],  # Limit results
                "total_articles": len(articles),
                "note": "Limited Medium access - requires API partnership for full functionality"
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search Medium for {tool_name}: {e}")
            return {"error": str(e)}

    def _create_prompt(self, tool_record: dict, scraped_content: dict) -> str:
        # Create a detailed prompt for the LLM optimized for comprehensive analysis
        prompt = f"""
You are a senior AI tool analyst conducting a comprehensive intelligence assessment. This analysis will be used for strategic business decisions, so thoroughness and accuracy are critical.

**ANALYSIS OBJECTIVE:** Extract maximum detail about this AI tool's capabilities, market position, technical architecture, community adoption, and business metrics.

**Tool Under Analysis:**
- Name: {tool_record['name']}
- Website: {tool_record['website_url']}
- Category: {tool_record.get('category', 'N/A')}

**Comprehensive Data Sources:**
```json
{json.dumps(scraped_content, indent=2)}
```

**ANALYSIS INSTRUCTIONS:**
1. **Be Comprehensive:** Extract every meaningful detail from all data sources
2. **Be Specific:** Use exact numbers, dates, and technical specifications when available
3. **Cross-Reference:** Validate information across multiple sources when possible
4. **Quantify Everything:** Convert qualitative observations to metrics where possible
5. **Stay Factual:** Only include information explicitly found in the data

**DETAILED OUTPUT REQUIREMENTS:**
- Feature lists should be exhaustive with specific capabilities
- Technology stack should include versions, frameworks, and dependencies found
- Pricing should include all tiers, limits, and enterprise details
- Community metrics should reflect actual counts from Dev.to, NPM, PyPI, etc.
- Company info should include precise financial data and organizational details

Please populate the following JSON structure with maximum detail:

```json
{{
    "basic_info": {{
        "description": "Comprehensive description including purpose, target users, and key value proposition",
        "category_classification": "Specific category (e.g., AI_IDE, CODE_COMPLETION, CHAT_ASSISTANT, etc.)"
    }},
    "technical_details": {{
        "feature_list": ["Exhaustive list of all features found across all data sources"],
        "technology_stack": ["Specific technologies, frameworks, languages with versions when available"],
        "pricing_model": {{"free_tier": "details", "paid_tiers": "with exact pricing and limits", "enterprise": "custom pricing details"}},
        "enterprise_capabilities": "Detailed enterprise features, SSO, admin controls, etc.",
        "security_features": ["All security measures mentioned in any source"],
        "integration_capabilities": ["APIs, webhooks, third-party integrations with specifics"],
        "scalability_features": ["Performance limits, scaling options, infrastructure details"],
        "compliance_certifications": ["SOC2, GDPR, ISO certifications found"],
        "comparable_tools": ["Direct competitors mentioned in any source"],
        "unique_differentiators": ["Specific advantages over competitors"],
        "pros_and_cons": {{
            "pros": ["Specific benefits mentioned by users/reviews"],
            "cons": ["Specific limitations or criticisms found"]
        }},
        "market_positioning": "Position relative to competitors with supporting evidence",
        "update_frequency": "How often updates are released based on version history",
        "version_history": ["Recent version numbers and release dates"],
        "roadmap_information": "Future plans mentioned in any source"
    }},
    "company_info": {{
        "stock_price": "Extract from stock_data if available",
        "market_cap": "Calculate or extract from financial sources",
        "news_mentions": "Count from news_data.total_articles",
        "annual_recurring_revenue": "Extract from company reports or news",
        "funding_rounds": [{{
            "round_name": "Series A/B/C etc.",
            "amount": "Exact funding amount",
            "date": "ISO date format"
        }}],
        "valuation": "Most recent company valuation",
        "employee_count": "Number of employees if mentioned",
        "founding_date": "Company founding date",
        "key_executives": ["Names and titles of leadership team"],
        "parent_company": "Parent organization if applicable",
        "major_investors": ["List of key investors"]
    }},
    "community_metrics": {{
        "github_stars": "Extract from github_data.stars",
        "github_forks": "Extract from github_data.forks", 
        "github_last_commit_date": "Extract from github_data.last_commit_date",
        "reddit_mentions": "Count from reddit_data.search_results",
        "reddit_sentiment_score": "Calculate based on scores in reddit_data",
        "hacker_news_mentions_count": "Count from hackernews_data.hits",
        "stackoverflow_questions_count": "Count from stackoverflow_data.questions",
        "producthunt_ranking": "Extract from producthunt_data based on votes",
        "devto_articles_count": "Count from devto_data.total_articles",
        "npm_packages_count": "Count from npm_data.total_packages",
        "npm_weekly_downloads": "Sum weekly_downloads from npm_data.packages",
        "pypi_packages_count": "Count from pypi_data.total_packages", 
        "medium_articles_count": "Count from medium_data.total_articles",
        "list_of_companies_using_tool": ["Extract company names from all sources"],
        "case_studies": ["URLs or titles of case studies found"],
        "testimonials": ["Actual user quotes and testimonials found"]
    }}
}}
```

**CRITICAL REQUIREMENTS:**
1. Replace ALL placeholder values with actual data from the sources
2. Use exact numbers, not approximations 
3. Include comprehensive lists - don't truncate for brevity
4. Cross-reference data between sources for accuracy
5. Extract maximum intelligence from all 11+ data sources provided
6. This analysis runs infrequently, so be thorough and detailed

IMPORTANT: You must only return the JSON object and nothing else. Do not include any text before or after the JSON.
"""
        return prompt

    def run(self, tool_record: dict) -> ToolSnapshotData:
        logging.info(f"--- Starting Strands Agent for: {tool_record['name']} ---")
        
        raw_data_payload = {}
        
        # The agent automatically discovers its own methods decorated with @tool
        # So we just need to call them.
        
        # Scrape primary website
        if tool_record.get('website_url'):
            raw_data_payload['primary_website'] = self.web_scraper(url=tool_record['website_url'])

        # Analyze GitHub repo
        if tool_record.get('github_url'):
            raw_data_payload['github_data'] = self.github_analyzer(repo_url=tool_record['github_url'])

        # Scrape Reddit within specific subreddits using PRAW
        target_subreddits = [
            "AI_Agents", "mcp", "ClaudeAI", "ChatGPTCoding", "cursor", 
            "ArtificialIntelligence", "PromptEngineering"
        ]
        raw_data_payload['reddit_data'] = self.reddit_searcher(
            tool_name=tool_record['name'],
            subreddits=target_subreddits
        )
            
        # Fetch Stock Data (if a stock symbol is provided)
        if tool_record.get('stock_symbol'):
            raw_data_payload['stock_data'] = self.stock_data_fetcher(stock_symbol=tool_record['stock_symbol'])

        # Fetch News Data
        raw_data_payload['news_data'] = self.news_aggregator(tool_name=tool_record['name'])

        # Search HackerNews
        raw_data_payload['hackernews_data'] = self.hackernews_searcher(tool_name=tool_record['name'])

        # Search StackOverflow
        raw_data_payload['stackoverflow_data'] = self.stackoverflow_searcher(tool_name=tool_record['name'])

        # Search ProductHunt
        raw_data_payload['producthunt_data'] = self.producthunt_searcher(tool_name=tool_record['name'])

        # Search Dev.to for articles
        raw_data_payload['devto_data'] = self.devto_searcher(tool_name=tool_record['name'])

        # Search NPM packages
        raw_data_payload['npm_data'] = self.npm_searcher(tool_name=tool_record['name'])

        # Search PyPI packages
        raw_data_payload['pypi_data'] = self.pypi_searcher(tool_name=tool_record['name'])

        # Search Medium articles
        raw_data_payload['medium_data'] = self.medium_searcher(tool_name=tool_record['name'])

        # Use the LLM to process the raw data
        prompt = self._create_prompt(tool_record, raw_data_payload)
        
        # Make the agent instance callable to handle the LLM call
        agent_result = self(prompt) # Get the raw AgentResult object

        # Add verbose logging for the agent's response
        logging.info(f"Agent raw response object type: {type(agent_result)}")
        logging.info(f"Agent raw response object: {agent_result}")

        if not agent_result:
             logging.error("Agent returned an empty response.")
             return None, raw_data_payload

        try:
            # Convert the AgentResult to a string, which contains the JSON
            agent_response_text = str(agent_result)

            # Find the start and end of the JSON object in the response string
            start_index = agent_response_text.find('{')
            end_index = agent_response_text.rfind('}') + 1
            
            if start_index == -1 or end_index == 0:
                raise ValueError("Could not find a JSON object in the agent's response.")

            json_string = agent_response_text[start_index:end_index]
            
            # Parse the extracted JSON string into the Pydantic model
            parsed_json = json.loads(json_string)
            structured_data = ToolSnapshotData.model_validate(parsed_json)

        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"Failed to parse JSON from agent response: {e}")
            logging.error(f"Malformed response string was: {agent_response_text}")
            return None, raw_data_payload
        
        logging.info(f"--- Finished Strands Agent for: {tool_record['name']} ---")
        return structured_data, raw_data_payload


# --- Main Execution Logic ---
def main():
    """Main function to run the AI Intelligence Platform workflow."""
    logging.info("=================================================")
    logging.info("AI Intelligence Platform - Weekly Run Initializing")
    logging.info("=================================================")

    conn = get_db_connection()
    if not conn:
        return

    agent = ToolIntelligenceAgent()

    try:
        tools_to_process = get_tools_to_process(conn)

        for tool in tools_to_process:
            try:
                structured_data, raw_data = agent.run(tool)
                
                if not structured_data:
                    logging.error(f"Agent did not return structured data for {tool['name']}. Skipping.")
                    update_tool_run_status(conn, tool['id'], 'error')
                    continue

                # Save snapshot to database
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO tool_snapshots (
                            tool_id, snapshot_date, raw_data, 
                            basic_info, technical_details, company_info, community_metrics, 
                            processing_status
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            tool['id'], 
                            datetime.datetime.now(), 
                            Json(raw_data), 
                            Json(structured_data.basic_info.model_dump()), 
                            Json(structured_data.technical_details.model_dump()), 
                            Json(structured_data.company_info.model_dump()), 
                            Json(structured_data.community_metrics.model_dump()), 
                            'processed'
                        )
                    )
                conn.commit()
                update_tool_run_status(conn, tool['id'], 'processed', datetime.datetime.now())
                logging.info(f"Successfully created snapshot and processed {tool['name']}.")

            except Exception as e:
                logging.error(f"An unexpected error occurred while processing {tool['name']}: {e}", exc_info=True)
                update_tool_run_status(conn, tool['id'], 'error')

    finally:
        if conn:
            conn.close()
            logging.info("Database connection closed.")

    logging.info("AI Intelligence Platform run finished.")

if __name__ == "__main__":
    main()
