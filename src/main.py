import os
import logging
import psycopg2
import datetime
import json
from psycopg2.extras import DictCursor, Json
from dotenv import load_dotenv
from strands_agents import Agent
from strands_agents.models import ChatMessage, Delta, FinalAnswer
from typing import List

from models import ToolSnapshotData
from tools import WebScraperTool, GitHubAnalyzerTool, RedditSearcherTool, StockDataFetcherTool, NewsAggregatorTool

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
        super().__init__(
            model=model,
            tools=[
                WebScraperTool(),
                GitHubAnalyzerTool(),
                RedditSearcherTool(),
                StockDataFetcherTool(),
                NewsAggregatorTool()
            ]
        )

    def _create_prompt(self, tool_record: dict, scraped_content: dict) -> List[ChatMessage]:
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
"""
        return [ChatMessage(role="user", content=prompt)]

    def run(self, tool_record: dict) -> ToolSnapshotData:
        logging.info(f"--- Starting Strands Agent for: {tool_record['name']} ---")
        
        raw_data_payload = {}
        
        # Scrape primary website
        if tool_record.get('website_url'):
            raw_data_payload['primary_website'] = self.tools['WebScraper'](url=tool_record['website_url'])

        # Analyze GitHub repo
        if tool_record.get('github_url'):
            raw_data_payload['github_data'] = self.tools['GitHubAnalyzer'](repo_url=tool_record['github_url'])

        # Scrape Reddit
        raw_data_payload['reddit_data'] = self.tools['RedditSearcher'](tool_name=tool_record['name'])

        # Fetch Stock Data
        if tool_record.get('stock_symbol'):
            raw_data_payload['stock_data'] = self.tools['StockDataFetcher'](stock_symbol=tool_record['stock_symbol'])
            
        # Fetch News Data
        raw_data_payload['news_data'] = self.tools['NewsAggregator'](tool_name=tool_record['name'])

        # Use the LLM to process the raw data
        prompt = self._create_prompt(tool_record, raw_data_payload)
        
        # The Strands SDK's `invoke` method will handle the LLM call
        # and structured data extraction if the model supports it (like Claude 3.5 Sonnet).
        response: ToolSnapshotData = self.invoke(prompt, output_model=ToolSnapshotData)
        
        logging.info(f"--- Finished Strands Agent for: {tool_record['name']} ---")
        return response, raw_data_payload


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
