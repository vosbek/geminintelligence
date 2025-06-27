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
    def __init__(self, model: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"):
        aws_region = os.getenv("AWS_REGION", "us-west-2")
        logging.info(f"Initializing Strands Agent (AWS region set to: {aws_region})")
        super().__init__(model=model)
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

    def _create_prompt(self, tool_record: dict, scraped_content: dict) -> str:
        # Create a detailed prompt for the LLM
        prompt = f"""
You are an expert AI tool analyst. Your task is to analyze the provided raw data about an AI developer tool and extract structured information based on the user's desired output format.

**Tool Information:**
- Name: {tool_record['name']}
- Website: {tool_record['website_url']}
- Category: {tool_record.get('category', 'N/A')}

**Raw Data Collected:**
```json
{json.dumps(scraped_content, indent=2)}
```

Based on all the information provided, please populate the following JSON structure. Only include information you can confidently extract from the text. Do not make up information.
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
            
        # Fetch News Data
        raw_data_payload['news_data'] = self.news_aggregator(tool_name=tool_record['name'])

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
