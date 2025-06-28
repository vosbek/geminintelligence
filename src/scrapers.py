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
    def web_scraper(self, url: str, page_options: dict = None, stealth: bool = False) -> dict:
        """
        Scrapes a given URL using the Firecrawl service.
        :param url: The URL to scrape.
        :param page_options: Additional options for Firecrawl's scrape_url, like `waitFor`.
        :param stealth: Enables stealth mode for sites with advanced anti-bot protection.
        :return: A dictionary containing the scraped content and metadata.
        """
        logging.info(f"Scraping URL via Firecrawl: {url} (Stealth: {stealth})")
        if not self.firecrawl_api_key:
            logging.error("FIRECRAWL_API_KEY not found in environment variables.")
            return {"error": "API key not configured."}
        
        try:
            # Prepare scrape parameters, starting with defaults.
            scrape_params = {
                'only_main_content': True,
            }

            if stealth:
                scrape_params['stealth'] = True

            # Add any custom page_options provided by the caller.
            if page_options:
                scrape_params.update(page_options)

            # Ensure headers with a User-Agent are always present.
            if 'headers' not in scrape_params:
                scrape_params['headers'] = {}
            scrape_params['headers'].setdefault(
                'User-Agent', 
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
            )

            # Use the Firecrawl SDK to scrape the URL, unpacking the parameters.
            # Parameters like 'waitFor' and 'headers' are passed as top-level arguments.
            scrape_result = self.firecrawl_app.scrape_url(url, **scrape_params)

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

        headers = {
            'Authorization': f'token {self.github_api_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
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
            
            response = requests.get(api_url, headers=headers, timeout=15)
            if response.status_code == 404:
                logging.warning(f"Repository not found at {api_url}")
                return {"error": "Repository not found"}
            elif response.status_code == 403:
                logging.warning(f"Rate limited or access forbidden for {api_url}")
                return {"error": "API rate limit exceeded or access forbidden"}
            response.raise_for_status()
            data = response.json()
            
            # Get additional information
            result = {
                "owner": data.get('owner', {}).get('login'),
                "repo_name": data.get('name'),
                "full_name": data.get('full_name'),
                "description": data.get('description'),
                "stars": data.get('stargazers_count', 0),
                "forks": data.get('forks_count', 0),
                "watchers": data.get('watchers_count', 0),
                "open_issues": data.get('open_issues_count', 0),
                "last_commit_date": data.get('pushed_at'),
                "created_at": data.get('created_at'),
                "updated_at": data.get('updated_at'),
                "language": data.get('language'),
                "topics": data.get('topics', []),
                "license": data.get('license', {}).get('name') if data.get('license') else None,
                "size": data.get('size'),  # in KB
                "default_branch": data.get('default_branch'),
                "has_issues": data.get('has_issues'),
                "has_wiki": data.get('has_wiki'),
                "has_pages": data.get('has_pages'),
                "archived": data.get('archived'),
                "disabled": data.get('disabled'),
                "homepage": data.get('homepage'),
                "clone_url": data.get('clone_url'),
                "ssh_url": data.get('ssh_url')
            }
            
            # Get additional metrics like contributors and releases
            try:
                # Get contributors count
                contributors_url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
                contributors_response = requests.get(contributors_url, headers=headers, timeout=10)
                if contributors_response.status_code == 200:
                    contributors = contributors_response.json()
                    result["contributors_count"] = len(contributors)
                    result["top_contributors"] = [c.get('login') for c in contributors[:5]]
                
                # Get releases
                releases_url = f"https://api.github.com/repos/{owner}/{repo}/releases"
                releases_response = requests.get(releases_url, headers=headers, timeout=10)
                if releases_response.status_code == 200:
                    releases = releases_response.json()
                    result["releases_count"] = len(releases)
                    if releases:
                        latest_release = releases[0]
                        result["latest_release"] = {
                            "tag_name": latest_release.get('tag_name'),
                            "name": latest_release.get('name'),
                            "published_at": latest_release.get('published_at'),
                            "download_count": sum(asset.get('download_count', 0) for asset in latest_release.get('assets', []))
                        }
                
                # Get commit activity (last 52 weeks)
                commit_activity_url = f"https://api.github.com/repos/{owner}/{repo}/stats/commit_activity"
                activity_response = requests.get(commit_activity_url, headers=headers, timeout=10)
                if activity_response.status_code == 200:
                    activity_data = activity_response.json()
                    if activity_data:
                        total_commits_last_year = sum(week.get('total', 0) for week in activity_data)
                        result["commits_last_year"] = total_commits_last_year
                        
            except Exception as additional_error:
                logging.warning(f"Could not get additional GitHub metrics: {additional_error}")
            
            return result
            
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
                    if sub_name == 'ArtificialInteligence':
                        sub_name = 'artificialinteligence'

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
    def techcrunch_funding_scraper(self, company_name: str) -> dict:
        """
        Scrapes TechCrunch for funding information about a company.
        :param company_name: The name of the company to search for.
        :return: A dictionary containing funding information.
        """
        logging.info(f"Scraping TechCrunch for funding info on {company_name}")
        try:
            search_url = f"https://techcrunch.com/?s={company_name.replace(' ', '+')}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')
            
            funding_articles = []
            articles = soup.find_all('article', class_='post-block')[:5]  # Get first 5 articles
            
            for article in articles:
                title_elem = article.find('h2', class_='post-block__title')
                link_elem = article.find('a')
                
                if title_elem and link_elem:
                    title = title_elem.get_text(strip=True)
                    link = link_elem.get('href')
                    
                    # Look for funding keywords
                    funding_keywords = ['funding', 'raises', 'series', 'investment', 'valuation', 'million', 'billion']
                    if any(keyword in title.lower() for keyword in funding_keywords):
                        funding_articles.append({
                            'title': title,
                            'url': link,
                            'source': 'techcrunch'
                        })
            
            return {
                'funding_articles': funding_articles,
                'articles_found': len(funding_articles),
                'source': 'techcrunch'
            }
            
        except Exception as e:
            logging.error(f"Failed to scrape TechCrunch for {company_name}: {e}")
            return {"error": str(e)}

    @tool()
    def venturebeat_funding_scraper(self, company_name: str) -> dict:
        """
        Scrapes VentureBeat for funding information about a company.
        :param company_name: The name of the company to search for.
        :return: A dictionary containing funding information.
        """
        logging.info(f"Scraping VentureBeat for funding info on {company_name}")
        try:
            search_url = f"https://venturebeat.com/?s={company_name.replace(' ', '+')}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')
            
            funding_articles = []
            articles = soup.find_all('article')[:5]  # Get first 5 articles
            
            for article in articles:
                title_elem = article.find('h2') or article.find('h3')
                link_elem = article.find('a')
                
                if title_elem and link_elem:
                    title = title_elem.get_text(strip=True)
                    link = link_elem.get('href')
                    
                    # Look for funding keywords
                    funding_keywords = ['funding', 'raises', 'series', 'investment', 'valuation', 'million', 'billion']
                    if any(keyword in title.lower() for keyword in funding_keywords):
                        funding_articles.append({
                            'title': title,
                            'url': link,
                            'source': 'venturebeat'
                        })
            
            return {
                'funding_articles': funding_articles,
                'articles_found': len(funding_articles),
                'source': 'venturebeat'
            }
            
        except Exception as e:
            logging.error(f"Failed to scrape VentureBeat for {company_name}: {e}")
            return {"error": str(e)}

    @tool()
    def angellist_scraper(self, company_name: str) -> dict:
        """
        Scrapes AngelList/Wellfound for company information.
        :param company_name: The name of the company to search for.
        :return: A dictionary containing company information.
        """
        logging.info(f"Scraping AngelList for {company_name}")
        try:
            # Search on Wellfound (formerly AngelList)
            search_url = f"https://wellfound.com/company/{company_name.lower().replace(' ', '-')}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=15)
            
            if response.status_code == 404:
                # Try alternative search format
                search_url = f"https://wellfound.com/companies/{company_name.lower().replace(' ', '-')}"
                response = requests.get(search_url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.content, 'html.parser')
                
                company_info = {}
                
                # Try to extract company size
                size_elem = soup.find(text=lambda text: text and 'employees' in text.lower())
                if size_elem:
                    company_info['employee_range'] = size_elem.strip()
                
                # Try to extract funding stage
                stage_elem = soup.find(text=lambda text: text and any(stage in text.lower() for stage in ['seed', 'series', 'pre-seed']))
                if stage_elem:
                    company_info['funding_stage'] = stage_elem.strip()
                
                return {
                    'company_info': company_info,
                    'profile_url': search_url,
                    'source': 'angellist',
                    'profile_found': True
                }
            else:
                return {
                    'company_info': {},
                    'source': 'angellist',
                    'profile_found': False,
                    'error': f'Profile not found (HTTP {response.status_code})'
                }
                
        except Exception as e:
            logging.error(f"Failed to scrape AngelList for {company_name}: {e}")
            return {"error": str(e)}

    @tool()
    def private_company_financial_data(self, company_name: str, stock_symbol: str = None) -> dict:
        """
        Comprehensive financial data collection for private companies using free sources.
        :param company_name: The name of the company to research.
        :param stock_symbol: Stock symbol if publicly traded (will use Alpha Vantage if provided).
        :return: A dictionary containing comprehensive financial information.
        """
        logging.info(f"Collecting financial data for {company_name}")
        
        # If publicly traded, use existing stock data fetcher
        if stock_symbol:
            return self.stock_data_fetcher(stock_symbol)
        
        # For private companies, aggregate data from multiple sources
        financial_data = {
            "company_name": company_name,
            "is_public": False,
            "stock_price": None,
            "market_cap": "Private Company",
            "funding_info": {
                "techcrunch_articles": [],
                "venturebeat_articles": [],
                "angellist_profile": {}
            },
            "data_sources": []
        }
        
        try:
            # Scrape TechCrunch for funding information
            tc_data = self.techcrunch_funding_scraper(company_name)
            if not tc_data.get("error"):
                financial_data["funding_info"]["techcrunch_articles"] = tc_data.get("funding_articles", [])
                financial_data["data_sources"].append("techcrunch")
                
                # Extract funding info from article titles
                funding_amounts = []
                for article in tc_data.get("funding_articles", []):
                    title = article.get("title", "").lower()
                    # Simple regex to find funding amounts
                    import re
                    amounts = re.findall(r'\$(\d+(?:\.\d+)?)\s*(million|billion|m|b)', title)
                    for amount, unit in amounts:
                        multiplier = 1000000 if unit.startswith('m') else 1000000000
                        funding_amounts.append(float(amount) * multiplier)
                
                if funding_amounts:
                    financial_data["estimated_latest_funding"] = f"${max(funding_amounts):,.0f}"
            
            # Scrape VentureBeat for funding information
            vb_data = self.venturebeat_funding_scraper(company_name)
            if not vb_data.get("error"):
                financial_data["funding_info"]["venturebeat_articles"] = vb_data.get("funding_articles", [])
                financial_data["data_sources"].append("venturebeat")
            
            # Scrape AngelList for company profile
            al_data = self.angellist_scraper(company_name)
            if not al_data.get("error"):
                financial_data["funding_info"]["angellist_profile"] = al_data.get("company_info", {})
                if al_data.get("profile_found"):
                    financial_data["data_sources"].append("angellist")
                    financial_data["angellist_url"] = al_data.get("profile_url")
            
            # Determine company stage and funding status
            total_articles = len(financial_data["funding_info"]["techcrunch_articles"]) + len(financial_data["funding_info"]["venturebeat_articles"])
            
            if total_articles > 0:
                financial_data["funding_status"] = "Funded (articles found)"
                financial_data["news_coverage"] = f"{total_articles} funding-related articles"
            else:
                financial_data["funding_status"] = "Unknown (no funding articles found)"
                financial_data["news_coverage"] = "Limited coverage"
            
            # Add Angel List stage info if available
            al_profile = financial_data["funding_info"]["angellist_profile"]
            if al_profile.get("funding_stage"):
                financial_data["company_stage"] = al_profile["funding_stage"]
            if al_profile.get("employee_range"):
                financial_data["employee_estimate"] = al_profile["employee_range"]
            
            financial_data["source"] = "private_company_aggregator"
            financial_data["last_updated"] = "2025-06-27"
            
            return financial_data
            
        except Exception as e:
            logging.error(f"Failed to collect private company financial data for {company_name}: {e}")
            return {
                "error": str(e),
                "company_name": company_name,
                "is_public": False,
                "source": "private_company_aggregator"
            }

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
        Searches ProductHunt for products related to a specific tool using multiple search strategies.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from ProductHunt.
        """
        logging.info(f"Searching ProductHunt for: {tool_name}")
        
        if not self.producthunt_api_token:
            logging.warning("No ProductHunt API token provided. Skipping.")
            return {"error": "ProductHunt API token not provided."}

        headers = {
            "Authorization": f"Bearer {self.producthunt_api_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        all_products = []
        
        # Strategy: Search in relevant topics and filter results locally
        topics_to_search = ["developer-tools", "artificial-intelligence", "productivity", "tech", "api-tools"]
        search_variations = list(set([ # Use set to avoid duplicate searches
            tool_name,
            tool_name.lower(),
            tool_name.replace(" ", ""),
            tool_name.replace("-", " "),
            tool_name.split()[0] if " " in tool_name else tool_name
        ]))

        for topic in topics_to_search:
            try:
                topic_query = """
                query PostsByTopic($topic: String!, $first: Int!) {
                  posts(topic: $topic, first: $first) {
                    edges {
                      node {
                        id
                        name
                        tagline
                        description
                        url
                        website
                        commentsCount
                        votesCount
                        createdAt
                        featuredAt
                        reviewsCount
                        reviewsRating
                      }
                    }
                  }
                }
                """
                
                variables = {"topic": topic, "first": 50}
                response = requests.post(
                    "https://api.producthunt.com/v2/api/graphql",
                    json={"query": topic_query, "variables": variables},
                    headers=headers,
                    timeout=20
                )
                response.raise_for_status()
                data = response.json()

                if "errors" in data:
                    logging.warning(f"ProductHunt API returned errors for topic '{topic}': {data['errors']}")
                    continue

                posts_data = data.get("data", {}).get("posts", {})
                for edge in posts_data.get("edges", []):
                    node = edge.get("node", {})
                    if node:
                        name = node.get("name", "").lower()
                        tagline = node.get("tagline", "").lower()
                        
                        # More flexible matching for topic search
                        for search_term in search_variations:
                            if (search_term in name or search_term in tagline):
                                all_products.append(node)
                                break # Avoid adding the same product multiple times

            except (requests.RequestException, ValueError) as e:
                logging.warning(f"Failed ProductHunt topic search for '{topic}': {e}")
                continue

        # Deduplicate results based on product ID
        unique_products = {}
        for product in all_products:
            product_id = product.get("id")
            if product_id and product_id not in unique_products:
                unique_products[product_id] = product

        # Sort by votes count (descending) and limit results
        sorted_products = sorted(
            unique_products.values(), 
            key=lambda x: x.get("votesCount", 0), 
            reverse=True
        )[:10]

        logging.info(f"Found {len(sorted_products)} ProductHunt results for {tool_name}")

        return {
            "products_found": len(sorted_products),
            "search_results": sorted_products,
            "search_strategies_used": ["topic_search"]
        }

    @tool()
    def devto_searcher(self, tool_name: str) -> dict:
        """
        Searches Dev.to for articles mentioning a specific tool using the public API.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing search results from Dev.to.
        """
        logging.info(f"Searching Dev.to for: {tool_name}")
        
        # Dev.to has multiple search strategies
        relevant_articles = []
        
        try:
            # Strategy 1: Search by tags
            tag_searches = [
                tool_name.lower(),
                f"{tool_name.lower()}-editor" if "editor" not in tool_name.lower() else None,
                f"{tool_name.lower()}-ai" if "ai" not in tool_name.lower() else None,
            ]
            
            for tag in tag_searches:
                if tag:
                    try:
                        tag_url = f"https://dev.to/api/articles?tag={tag}&per_page=20"
                        tag_response = requests.get(tag_url, timeout=10)
                        if tag_response.status_code == 200:
                            tag_articles = tag_response.json()
                            for article in tag_articles:
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
                                    "organization": article.get("organization", {}).get("name") if article.get("organization") else None,
                                    "found_via": f"tag: {tag}"
                                })
                    except Exception as tag_error:
                        logging.debug(f"Tag search failed for {tag}: {tag_error}")
            
            # Strategy 2: Search general articles and filter
            general_params = {
                "tag": "programming,webdev,ai,development,coding",
                "per_page": 50,
                "state": "fresh"
            }
            
            general_response = requests.get("https://dev.to/api/articles", params=general_params, timeout=15)
            if general_response.status_code == 200:
                articles = general_response.json()
                
                tool_name_lower = tool_name.lower()
                for article in articles:
                    title = article.get("title", "").lower()
                    description = article.get("description", "").lower()
                    tags = [tag.lower() for tag in article.get("tag_list", [])]
                    
                    # More flexible matching
                    if (tool_name_lower in title or 
                        tool_name_lower in description or 
                        tool_name_lower in tags or
                        any(tool_name_lower in tag for tag in tags)):
                        
                        # Check if we already have this article
                        article_url = article.get("url")
                        if not any(a.get("url") == article_url for a in relevant_articles):
                            relevant_articles.append({
                                "title": article.get("title"),
                                "url": article_url,
                                "description": article.get("description"),
                                "published_at": article.get("published_at"),
                                "positive_reactions_count": article.get("positive_reactions_count", 0),
                                "comments_count": article.get("comments_count", 0),
                                "reading_time_minutes": article.get("reading_time_minutes", 0),
                                "tags": article.get("tag_list", []),
                                "user": article.get("user", {}).get("name", "Unknown"),
                                "organization": article.get("organization", {}).get("name") if article.get("organization") else None,
                                "found_via": "general search"
                            })
            
            # Strategy 3: Search for variations of the tool name
            tool_variations = [
                tool_name,
                tool_name.replace(" ", ""),
                tool_name.replace(" ", "-"),
                f"{tool_name} AI",
                f"{tool_name} editor",
                f"{tool_name} tool"
            ]
            
            for variation in tool_variations:
                if variation.lower() != tool_name.lower():
                    try:
                        # Use the search endpoint if available
                        search_params = {
                            "per_page": 20,
                            "state": "fresh"
                        }
                        search_url = f"https://dev.to/api/articles?tag={variation.lower().replace(' ', '')}"
                        search_response = requests.get(search_url, timeout=10)
                        if search_response.status_code == 200:
                            search_articles = search_response.json()
                            for article in search_articles:
                                article_url = article.get("url")
                                if not any(a.get("url") == article_url for a in relevant_articles):
                                    relevant_articles.append({
                                        "title": article.get("title"),
                                        "url": article_url,
                                        "description": article.get("description"),
                                        "published_at": article.get("published_at"),
                                        "positive_reactions_count": article.get("positive_reactions_count", 0),
                                        "comments_count": article.get("comments_count", 0),
                                        "reading_time_minutes": article.get("reading_time_minutes", 0),
                                        "tags": article.get("tag_list", []),
                                        "user": article.get("user", {}).get("name", "Unknown"),
                                        "organization": article.get("organization", {}).get("name") if article.get("organization") else None,
                                        "found_via": f"variation: {variation}"
                                    })
                    except Exception as var_error:
                        logging.debug(f"Variation search failed for {variation}: {var_error}")
            
            # Sort by reactions and limit results
            relevant_articles.sort(key=lambda x: x.get('positive_reactions_count', 0), reverse=True)
            
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
        
        # Use the public NPM registry search API
        base_url = "https://registry.npmjs.org/-/v1/search"
        
        params = {
            "text": tool_name,
            "size": 20,
            "from": 0
        }
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
            }
            response = requests.get(base_url, params=params, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            packages = []
            relevant_packages = []
            
            for obj in data.get("objects", []):
                package = obj.get("package", {})
                package_name = package.get("name", "")
                
                # Apply relevance filtering similar to PyPI
                tool_name_lower = tool_name.lower()
                description = package.get("description", "").lower()
                keywords = [k.lower() for k in package.get("keywords", [])]
                
                # Check if package is relevant to the tool
                is_relevant = (
                    tool_name_lower in package_name.lower() or
                    tool_name_lower in description or
                    any(tool_name_lower in keyword for keyword in keywords) or
                    any(term in description for term in ["ai", "editor", "code", "development"]) or
                    any(term in keywords for term in ["ai", "editor", "code", "development"])
                )
                
                if is_relevant:
                    # Get detailed package info for relevant packages
                    try:
                        detail_response = requests.get(f"https://registry.npmjs.org/{package_name}", timeout=10)
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            latest_version = package.get("version")
                            
                            # Get download stats
                            downloads_url = f"https://api.npmjs.org/downloads/point/last-week/{package_name}"
                            weekly_downloads = None
                            try:
                                downloads_response = requests.get(downloads_url, timeout=5)
                                if downloads_response.status_code == 200:
                                    weekly_downloads = downloads_response.json().get("downloads")
                            except:
                                pass  # Downloads API might be down, continue without it
                            
                            package_info = {
                                "name": package_name,
                                "version": latest_version,
                                "description": package.get("description"),
                                "keywords": package.get("keywords", []),
                                "npm_url": f"https://www.npmjs.com/package/{package_name}",
                                "homepage": package.get("links", {}).get("homepage"),
                                "repository": package.get("links", {}).get("repository"),
                                "weekly_downloads": weekly_downloads,
                                "license": package.get("license"),
                                "last_publish": package.get("date"),
                                "author": package.get("author", {}).get("name") if package.get("author") else None,
                                "maintainers_count": len(package.get("maintainers", [])),
                                "score": obj.get("score", {}),
                                "relevance_score": self._calculate_npm_relevance_score(tool_name, package)
                            }
                            relevant_packages.append(package_info)
                    except Exception as detail_error:
                        logging.warning(f"Could not get detailed info for {package_name}: {detail_error}")
                        continue
            
            # Sort by relevance score
            relevant_packages.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
            
            return {
                "packages": relevant_packages[:10],  # Limit to top 10 most relevant
                "total_packages": len(relevant_packages)
            }
        except (requests.RequestException, ValueError, KeyError) as e:
            logging.error(f"Failed to search NPM for {tool_name}: {e}")
            return {"error": str(e)}

    def _calculate_npm_relevance_score(self, tool_name: str, package_info: dict) -> float:
        """Calculate a relevance score for an NPM package based on the tool name."""
        score = 0.0
        tool_name_lower = tool_name.lower()
        
        name = package_info.get("name", "").lower()
        description = package_info.get("description", "").lower()
        keywords = [k.lower() for k in package_info.get("keywords", [])]
        
        # Exact name match gets highest score
        if name == tool_name_lower:
            score += 10.0
        elif tool_name_lower in name:
            score += 5.0
            
        # Description mentions
        if tool_name_lower in description:
            score += 3.0
            
        # Keyword matches
        for keyword in keywords:
            if tool_name_lower in keyword:
                score += 2.0
                
        # Bonus for relevant terms
        relevant_terms = ["ai", "editor", "ide", "code", "development", "cli", "tool"]
        for term in relevant_terms:
            if term in description or term in keywords:
                score += 0.5
                
        return score

    @tool()
    def pypi_searcher(self, tool_name: str) -> dict:
        """
        Searches PyPI for packages related to a specific tool.
        :param tool_name: The name of the tool to search for.
        :return: A dictionary containing package information from PyPI.
        """
        logging.info(f"Searching PyPI for: {tool_name}")
        
        # Create more intelligent search terms based on the tool name
        # Avoid generic names that could match unrelated packages
        tool_name_lower = tool_name.lower()
        
        # For specific tools, use more targeted search patterns
        if tool_name_lower == "zed":
            potential_packages = ["zed-editor", "zed-python", "pyzed"]
        elif tool_name_lower == "cursor":
            potential_packages = ["cursor-ai", "cursor-editor", "cursor-python", "pycursor"]
        elif tool_name_lower == "augment":
            potential_packages = ["augment-ai", "augmentcode", "augment-code", "augment-python"]
        elif tool_name_lower == "replit":
            potential_packages = ["replit", "replit-python", "repl-python"]
        else:
            # Generic patterns for other tools
            potential_packages = [
                tool_name_lower,
                tool_name_lower.replace(" ", "-"),
                tool_name_lower.replace(" ", "_"),
                f"{tool_name_lower}-ai",
                f"{tool_name_lower}-python",
                f"{tool_name_lower}-api",
                f"{tool_name_lower}-sdk",
                f"{tool_name_lower}-client",
                f"py{tool_name_lower}",
                f"python-{tool_name_lower}"
            ]
        
        packages = []
        relevant_packages = []
        
        for package_name in potential_packages:
            try:
                detail_response = requests.get(f"https://pypi.org/pypi/{package_name}/json", timeout=10)
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    info = detail_data.get("info", {})
                    
                    # Check relevance by examining description and summary
                    summary = info.get("summary", "").lower()
                    description = info.get("description", "").lower()
                    
                    # Filter out clearly unrelated packages
                    is_relevant = (
                        tool_name_lower in summary or
                        tool_name_lower in description or
                        any(keyword in summary for keyword in [tool_name_lower, "ai", "editor", "code"]) or
                        any(keyword in description[:200] for keyword in [tool_name_lower, "ai", "editor", "code"])
                    )
                    
                    if is_relevant or package_name == tool_name_lower:
                        # Get download stats (approximate using recent releases)
                        releases = detail_data.get("releases", {})
                        latest_version = info.get("version")
                        
                        package_info = {
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
                            "release_count": len(releases),
                            "relevance_score": self._calculate_relevance_score(tool_name, info)
                        }
                        relevant_packages.append(package_info)
                    else:
                        logging.debug(f"Package {package_name} deemed not relevant to {tool_name}")
                        
            except Exception as detail_error:
                logging.debug(f"Package {package_name} not found on PyPI: {detail_error}")
                continue
        
        # Sort by relevance score and limit results
        relevant_packages.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        return {
            "packages": relevant_packages[:10],  # Limit to top 10 most relevant
            "total_packages": len(relevant_packages)
        }

    def _calculate_relevance_score(self, tool_name: str, package_info: dict) -> float:
        """Calculate a relevance score for a package based on the tool name."""
        score = 0.0
        tool_name_lower = tool_name.lower()
        
        name = package_info.get("name", "").lower()
        summary = package_info.get("summary", "").lower()
        description = package_info.get("description", "").lower()
        
        # Exact name match gets highest score
        if name == tool_name_lower:
            score += 10.0
        elif tool_name_lower in name:
            score += 5.0
            
        # Summary mentions
        if tool_name_lower in summary:
            score += 3.0
            
        # Description mentions (first 200 chars only to avoid false positives)
        if tool_name_lower in description[:200]:
            score += 2.0
            
        # Bonus for AI/developer tool related terms
        ai_terms = ["ai", "artificial intelligence", "machine learning", "editor", "ide", "code", "development"]
        for term in ai_terms:
            if term in summary or term in description[:200]:
                score += 0.5
                
        return score

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