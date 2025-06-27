import os
import logging
import datetime
import json
from psycopg2.extras import Json
from dotenv import load_dotenv
from strands import Agent, tool
from firecrawl import FirecrawlApp
import praw
import prawcore
from typing import List

from models import ToolSnapshotData
from database import get_db_connection, get_tools_to_process, update_tool_run_status
from scrapers import ScraperMixin
from strands.models import BedrockModel

# Load environment variables from .env file
load_dotenv()

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

# # --- Core Workflow Functions ---
# def get_tools_to_process(conn):
#     """Fetches tools that need to be processed."""
#     with conn.cursor(cursor_factory=DictCursor) as cur:
#         cur.execute("SELECT * FROM ai_tools WHERE run_status IS NULL OR run_status = 'update'")
#         tools = cur.fetchall()
#         logging.info(f"Found {len(tools)} tools to process.")
#         return tools

# def update_tool_run_status(conn, tool_id, status, last_run_time=None):
#     """Updates the run status of a tool."""
#     with conn.cursor() as cur:
#         cur.execute(
#             "UPDATE ai_tools SET run_status = %s, last_run = %s WHERE id = %s",
#             (status, last_run_time, tool_id)
#         )
#     conn.commit()

# --- Strands Agent Definition ---
class ToolIntelligenceAgent(Agent, ScraperMixin):
    def __init__(self, model: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"):
        aws_region = os.getenv("AWS_REGION", "us-east-1")
        logging.info(f"Initializing Strands Agent (AWS region: {aws_region})")
        logging.info(f"Model: {model}")
        
        # Configure the model with specific parameters
        bedrock_model = BedrockModel(
            model_id=model,
            region_name=aws_region,
            model_kwargs={
                "max_tokens": 8192,
                "temperature": 0.1,
            }
        )
        
        # Initialize the parent Agent with the configured model
        super().__init__(model=bedrock_model)

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

    def _create_prompt(self, tool_record: dict, raw_data_payload: dict) -> str:
        """Create a detailed prompt for the LLM optimized for comprehensive analysis."""
        # Basic tool information
        prompt_lines = [
            f"Please provide a detailed analysis of the AI tool: '{tool_record['name']}'.",
            "## Key Information:",
            f"- Description: {tool_record.get('description', 'N/A')}",
            f"- Category: {tool_record.get('category', 'N/A')}",
        ]

        # Add URLs to the prompt
        if tool_record.get('urls'):
            prompt_lines.append("- URLs:")
            for url_info in tool_record['urls']:
                prompt_lines.append(f"  - {url_info['url_type'].capitalize()}: {url_info['url']}")

        if tool_record.get('github_url'):
            prompt_lines.append(f"- GitHub: {tool_record['github_url']}")
        if tool_record.get('stock_symbol'):
            prompt_lines.append(f"- Stock Symbol: {tool_record['stock_symbol']}")

        # Add ALL collected raw data sources
        prompt_lines.append("\n## Comprehensive Data Analysis:")
        prompt_lines.append("Analyze all the following data sources to extract intelligence:")
        
        # Include all raw data in the prompt
        for source_name, source_data in raw_data_payload.items():
            prompt_lines.append(f"\n### {source_name.replace('_', ' ').title()}:")
            if source_data:
                prompt_lines.append(f"```json\n{json.dumps(source_data, indent=2)}\n```")
            else:
                prompt_lines.append("No data available for this source.")

        # Add JSON schema and instructions
        schema_example = {
            "basic_info": {
                "description": "A summary of the tool's purpose and features",
                "category_classification": "AI_IDE, CODE_COMPLETION, etc."
            },
            "technical_details": {
                "feature_list": ["feature1", "feature2"],
                "technology_stack": ["Python", "React"],
                "pricing_model": {"free": "description", "paid": "description"},
                "enterprise_capabilities": "enterprise features",
                "security_features": ["security1", "security2"],
                "integration_capabilities": ["integration1"],
                "scalability_features": ["scale1"],
                "compliance_certifications": ["cert1"],
                "comparable_tools": ["tool1", "tool2"],
                "unique_differentiators": ["diff1"],
                "pros_and_cons": {"pros": ["pro1"], "cons": ["con1"]},
                "market_positioning": "market position",
                "update_frequency": "frequency",
                "version_history": ["v1.0", "v2.0"],
                "roadmap_information": "roadmap info"
            },
            "company_info": {
                "stock_price": 123.45,
                "market_cap": "1B",
                "news_mentions": 50,
                "annual_recurring_revenue": "100M",
                "funding_rounds": [{"round": "Series A", "amount": "10M"}],
                "valuation": "500M",
                "employee_count": 100,
                "founding_date": "2020-01-01",
                "key_executives": ["CEO Name"],
                "parent_company": "Parent Corp",
                "major_investors": ["Investor1"]
            },
            "community_metrics": {
                "github_stars": 1000,
                "github_forks": 100,
                "github_last_commit_date": "2025-01-01",
                "reddit_mentions": 50,
                "reddit_sentiment_score": 0.7,
                "hacker_news_mentions_count": 10,
                "stackoverflow_questions_count": 25,
                "producthunt_ranking": 5,
                "devto_articles_count": 15,
                "npm_packages_count": 3,
                "npm_weekly_downloads": 1000,
                "pypi_packages_count": 2,
                "medium_articles_count": 8,
                "list_of_companies_using_tool": ["Company1"],
                "case_studies": ["Case study 1"],
                "testimonials": ["Testimonial 1"]
            }
        }

        prompt_lines.extend([
            "\n**ANALYSIS OBJECTIVE:** Extract maximum detail about this AI tool's capabilities, market position, technical architecture, community adoption, and business metrics.",
            "**ANALYSIS INSTRUCTIONS:**",
            "1. **Be Comprehensive:** Extract every meaningful detail from all data sources",
            "2. **Be Specific:** Use exact numbers, dates, and technical specifications when available",
            "3. **Cross-Reference:** Validate information across multiple sources when possible",
            "4. **Quantify Everything:** Convert qualitative observations to metrics where possible",
            "5. **Stay Factual:** Only include information explicitly found in the data",
            "**DETAILED OUTPUT REQUIREMENTS:**",
            "- Feature lists should be exhaustive with specific capabilities",
            "- Technology stack should include versions, frameworks, and dependencies found",
            "- Pricing should include all tiers, limits, and enterprise details",
            "- Community metrics should reflect actual counts from Dev.to, NPM, PyPI, etc.",
            "- Company info should include precise financial data and organizational details",
            "**CRITICAL REQUIREMENTS:**",
            "1. Replace ALL placeholder values with actual data from the sources",
            "2. Use exact numbers, not approximations",
            "3. Include comprehensive lists - don't truncate for brevity",
            "4. Cross-reference data between sources for accuracy",
            "5. Extract maximum intelligence from all 11+ data sources provided",
            "6. This analysis runs infrequently, so be thorough and detailed",
            f"\n**REQUIRED JSON OUTPUT FORMAT:**\n```json\n{json.dumps(schema_example, indent=2)}\n```",
            "\nIMPORTANT: You must return ONLY a valid JSON object matching the exact structure above. Do not include any text before or after the JSON. Use null for missing values, never leave fields undefined."
        ])
        return "\n".join(prompt_lines)

    def run(self, tool_record: dict) -> ToolSnapshotData:
        """
        Gathers intelligence on a single AI tool and returns a structured snapshot.
        This function now handles multiple URLs for each tool.
        """
        logging.info(f"Starting intelligence gathering for tool: {tool_record['name']} (ID: {tool_record['id']})")
        
        raw_data_payload = {}
        
        # Scrape all associated URLs
        scraped_content_list = []
        if tool_record.get('urls'):
            logging.info(f"Found {len(tool_record['urls'])} URLs to scrape for {tool_record['name']}.")
            for url_info in tool_record['urls']:
                url = url_info.get('url')
                url_type = url_info.get('url_type', 'unknown')
                if url:
                    scraped_data = self.web_scraper(url=url)
                    scraped_data['url'] = url  # Add URL to the result for context
                    scraped_data['url_type'] = url_type # Add URL type for context
                    scraped_content_list.append(scraped_data)
        else:
            logging.warning(f"No URLs found for tool: {tool_record['name']}")

        raw_data_payload['scraped_content'] = scraped_content_list

        # --- GitHub Analysis ---
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

        # --- Company Intelligence Collection ---
        # Extract company name from tool record or derive from tool name
        company_name = tool_record.get('company_name', tool_record['name'])
        
        # LinkedIn company scraping for employee counts
        raw_data_payload['linkedin_company_data'] = self.linkedin_company_scraper(
            company_name=company_name,
            website_url=tool_record.get('website_url')
        )
        
        # Company About page scraping  
        if tool_record.get('website_url'):
            raw_data_payload['company_about_data'] = self.company_about_page_scraper(
                website_url=tool_record['website_url']
            )
        
        # AngelList/Wellfound startup information
        raw_data_payload['angellist_data'] = self.angellist_company_scraper(
            company_name=company_name
        )
        
        # Enhanced news scraping with funding/partnership extraction
        raw_data_payload['enhanced_news_data'] = self.enhanced_news_scraper(
            tool_name=tool_record['name'],
            company_name=company_name
        )
        
        # Glassdoor company information
        raw_data_payload['glassdoor_data'] = self.glassdoor_company_scraper(
            company_name=company_name
        )

        # --- AI-Powered Analysis ---
        logging.info("Sending data to Strands AI for analysis...")
        main_prompt = self._create_prompt(tool_record, raw_data_payload)
        
        # Make the agent instance callable to handle the LLM call
        try:
            agent_result = self(main_prompt) # Get the raw AgentResult object
            
            # Add verbose logging for the agent's response
            logging.info(f"Agent raw response object type: {type(agent_result)}")
            logging.info(f"Agent raw response received successfully")

            if not agent_result:
                logging.error("Agent returned an empty response.")
                return None, raw_data_payload

            # Convert the AgentResult to a string, which contains the JSON
            agent_response_text = str(agent_result)
            logging.info(f"Agent response text length: {len(agent_response_text)}")
            
            # Log first 500 characters of response for debugging
            logging.info(f"Agent response preview: {agent_response_text[:500]}...")

            # Find the start and end of the JSON object in the response string
            start_index = agent_response_text.find('{')
            end_index = agent_response_text.rfind('}') + 1
            
            if start_index == -1 or end_index == 0:
                logging.error("Could not find a JSON object in the agent's response.")
                logging.error(f"Full response was: {agent_response_text}")
                return None, raw_data_payload

            json_string = agent_response_text[start_index:end_index]
            logging.info(f"Extracted JSON string length: {len(json_string)}")
            
            # Parse the extracted JSON string into the Pydantic model
            parsed_json = json.loads(json_string)
            logging.info("JSON parsing successful")
            
            structured_data = ToolSnapshotData.model_validate(parsed_json)
            logging.info("Pydantic model validation successful")

        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"Failed to parse JSON from agent response: {e}")
            logging.error(f"Malformed response string was: {agent_response_text}")
            return None, raw_data_payload
        except Exception as e:
            logging.error(f"Unexpected error during LLM processing: {e}", exc_info=True)
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
