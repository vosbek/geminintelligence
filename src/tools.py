import os
import logging
import requests
from strands_agents_tools import Tool

class WebScraperTool(Tool):
    """
    A tool for scraping web pages using the Firecrawl MCP server.
    """
    def __init__(self, name="WebScraper"):
        super().__init__(name)
        self.api_key = os.getenv("FIRECRAWL_API_KEY")
        self.mcp_server_url = "http://localhost:7777/scrape"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def __call__(self, url: str) -> dict:
        """
        Scrapes a given URL using the Firecrawl MCP server.

        :param url: The URL to scrape.
        :return: A dictionary containing the scraped content and metadata.
        """
        logging.info(f"Scraping URL via Firecrawl MCP: {url}")
        if not self.api_key:
            logging.error("FIRECRAWL_API_KEY not found in environment variables.")
            return {"error": "API key not configured."}
            
        body = {"url": url}
        try:
            response = requests.post(self.mcp_server_url, json=body, headers=self.headers, timeout=180)
            response.raise_for_status()
            data = response.json()
            return {
                "content": data.get("markdown", data.get("content", "")),
                "metadata": data.get("metadata", {"url": url, "status_code": response.status_code})
            }
        except requests.RequestException as e:
            logging.error(f"Failed to scrape {url} via Firecrawl MCP: {e}")
            return {"error": str(e)}


class GitHubAnalyzerTool(Tool):
    """
    A tool to analyze GitHub repositories.
    """
    def __init__(self, name="GitHubAnalyzer"):
        super().__init__(name)
        self.token = os.getenv("GITHUB_API_TOKEN")
        self.headers = {'Authorization': f'token {self.token}'}

    def __call__(self, repo_url: str) -> dict:
        """
        Analyzes a GitHub repository URL to extract key metrics.

        :param repo_url: The full URL of the GitHub repository.
        :return: A dictionary containing key metrics about the repository.
        """
        logging.info(f"Analyzing GitHub repo: {repo_url}")
        if not self.token:
            logging.error("GITHUB_API_TOKEN not found in environment variables.")
            return {"error": "API key not configured."}

        try:
            parts = repo_url.strip("/").split("/")
            if len(parts) < 2 or parts[-2] == 'features':
                logging.warning(f"Could not parse GitHub URL: {repo_url}")
                return {"error": "Could not parse GitHub URL"}
            owner, repo = parts[-2], parts[-1]
            api_url = f"https://api.github.com/repos/{owner}/{repo}"
            
            response = requests.get(api_url, headers=self.headers, timeout=10)
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


class RedditSearcherTool(Tool):
    """
    A tool to search Reddit for tool mentions by scraping search results.
    """
    def __init__(self, name="RedditSearcher"):
        super().__init__(name)
        self.scraper = WebScraperTool()

    def __call__(self, tool_name: str) -> dict:
        """
        Searches Reddit for a tool name and returns the raw scraped content.

        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing the raw text content of the search results page.
        """
        logging.info(f"Searching Reddit for '{tool_name}' by scraping search result pages.")
        search_query = f'"{tool_name}"'
        search_url = f"https://www.reddit.com/search/?q={search_query}&type=link"
        
        logging.info(f"Scraping Reddit search URL: {search_url}")
        scraped_data = self.scraper(url=search_url)

        if not scraped_data or scraped_data.get('error'):
            logging.warning(f"Could not retrieve any content from Reddit search for '{tool_name}'")
            return scraped_data or {"error": "Failed to scrape Reddit."}
            
        return {
            "raw_search_page_content": scraped_data.get('content', ''),
        }


class StockDataFetcherTool(Tool):
    """
    A tool to fetch stock data for a company using Alpha Vantage.
    """
    def __init__(self, name="StockDataFetcher"):
        super().__init__(name)
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.base_url = "https://www.alphavantage.co/query"

    def __call__(self, stock_symbol: str) -> dict:
        """
        Fetches the latest stock quote for a given symbol.

        :param stock_symbol: The stock symbol (e.g., 'MSFT').
        :return: A dictionary containing the latest stock data.
        """
        logging.info(f"Fetching stock data for {stock_symbol}")
        if not stock_symbol or not self.api_key:
            logging.warning("No stock symbol or Alpha Vantage API key provided. Skipping.")
            return {"error": "Stock symbol or API key not provided."}
        
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": stock_symbol,
            "apikey": self.api_key
        }
        try:
            response = requests.get(self.base_url, params=params, timeout=15)
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


class NewsAggregatorTool(Tool):
    """
    A tool to aggregate news mentions using NewsAPI.org.
    """
    def __init__(self, name="NewsAggregator"):
        super().__init__(name)
        self.api_key = os.getenv("NEWS_API_KEY")
        self.base_url = "https://newsapi.org/v2/everything"

    def __call__(self, tool_name: str) -> dict:
        """
        Searches for news articles mentioning a specific tool name.

        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing a list of articles and the total count.
        """
        logging.info(f"Searching news for: {tool_name}")
        if not self.api_key:
            logging.warning("No NewsAPI.org API key provided. Skipping.")
            return {"error": "NewsAPI.org API key not provided."}

        query = f'"{tool_name}"'
        params = {
            "q": query,
            "apiKey": self.api_key,
            "language": "en",
            "sortBy": "relevancy",
            "pageSize": 20
        }
        try:
            response = requests.get(self.base_url, params=params, timeout=15)
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
