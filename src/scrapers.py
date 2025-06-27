"""
Data scrapers for AI tool intelligence collection.

This module contains all the individual scraper tools that collect data
from various sources for AI tool analysis.
"""
import os
import logging
import requests
import praw
import prawcore
from typing import List
from strands import tool
from firecrawl import FirecrawlApp


class ScraperMixin:
    """Mixin class containing all scraper tools for the ToolIntelligenceAgent."""
    
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
            # Improved URL parsing
            if not repo_url or "github.com" not in repo_url:
                return {"error": "Invalid GitHub URL"}
                
            parts = repo_url.strip("/").split("/")
            if len(parts) < 5: # e.g. https://github.com/owner/repo
                logging.warning(f"Could not parse GitHub URL: {repo_url}")
                return {"error": "URL does not appear to be a valid repository link"}

            owner, repo = parts[-2], parts[-1]
            if owner == 'features' or owner == 'topics':
                 logging.warning(f"Skipping non-repository GitHub URL: {repo_url}")
                 return {"error": "URL points to a GitHub feature or topic, not a repository"}

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
                    # Corrected the case of the subreddit name
                    if sub_name == 'ArtificialIntelligence':
                        sub_name = 'artificialintelligence'

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

        # Corrected GraphQL query to fetch posts by a topic and then filter.
        # ProductHunt's v2 API does not support direct text search on posts.
        # We will fetch posts from relevant topics and filter by name.
        graphql_query = """
        query Posts($topic: String!) {
          posts(topic: $topic, first: 50) {
            edges {
              node {
                id
                name
                tagline
                url
                website
                commentsCount
                votesCount
                createdAt
              }
            }
          }
        }
        """

        all_posts = []
        # Search in a few relevant topics
        for topic in ["tech", "developer-tools", "artificial-intelligence"]:
            try:
                variables = {"topic": topic}
                headers = {
                    "Authorization": f"Bearer {self.producthunt_api_token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
                response = requests.post(
                    "https://api.producthunt.com/v2/api/graphql",
                    json={"query": graphql_query, "variables": variables},
                    headers=headers,
                    timeout=20
                )
                response.raise_for_status()
                data = response.json()

                if "errors" in data:
                    # Log the error but don't stop; try the next topic
                    logging.warning(f"ProductHunt API returned errors for topic '{topic}': {data['errors']}")
                    continue

                if posts_data := data.get("data", {}).get("posts"):
                    for edge in posts_data.get("edges", []):
                        if node := edge.get("node"):
                            all_posts.append(node)

            except (requests.RequestException, ValueError) as e:
                logging.error(f"Failed to search ProductHunt for topic {topic}: {e}")
                # Don't let a single topic failure stop the whole search
                continue
        
        # Now, filter the collected posts by the tool_name
        search_results = [
            post for post in all_posts 
            if tool_name.lower() in post.get("name", "").lower()
        ]

        # Deduplicate results based on post ID
        unique_results = {post['id']: post for post in search_results}.values()

        return {
            "search_results": list(unique_results)[:20] # Return top 20 unique matches
        }

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
        Searches the NPM registry for a given package name.
        :param tool_name: The name of the package to search for.
        :return: A dictionary containing search results.
        """
        logging.info(f"Searching NPM for: {tool_name}")
        
        # Use the internal NPM registry and correct endpoint
        base_url = "https://art.nwie.net/artifactory/api/npm/npm/-/v1/search"
        
        params = {
            "text": tool_name,
            "size": 20,
            "from": 0,
            "quality": 0.65,
            "popularity": 0.98,
            "maintenance": 0.5
        }
        
        try:
            # Added verify=False to handle internal, self-signed SSL certs
            response = requests.get(base_url, params=params, timeout=15, verify=False)
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

    def _make_request(self, url: str, headers: dict = None, params: dict = None) -> requests.Response:
        """Centralized request-making method."""
        # ... existing code ...