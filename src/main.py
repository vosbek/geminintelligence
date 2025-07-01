import os
import logging
import datetime
import json
import re
from psycopg2.extras import Json
from dotenv import load_dotenv
from strands import Agent, tool
from firecrawl import FirecrawlApp
import praw
import prawcore
from typing import List

from models import ToolSnapshotData
from database import Database
from scrapers import ScraperMixin
from strands.models import BedrockModel
import strands

# Load environment variables from .env file
load_dotenv()

# --- Logging Configuration ---
# This will be moved into main for clarity

# --- Strands Agent Definition ---
def chunk_text(text, chunk_size=8000, overlap=400):
    """Splits text into overlapping chunks with more conservative sizing to avoid context overflow."""
    if not isinstance(text, str):
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

class ToolIntelligenceAgent(ScraperMixin):
    def __init__(self, db: Database, model: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"):
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
        
        # The ToolIntelligenceAgent contains an Agent instance, and provides the tools for it.
        # The tools are the methods from ScraperMixin decorated with @tool.
        self.agent = Agent(
            model=bedrock_model,
            tools=[self] # Pass the instance of this class, which has the tool methods.
        )

        # API keys and configs are now part of the agent's state, accessible to the scraper methods
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        self.github_api_token = os.getenv("GITHUB_API_TOKEN")
        self.alpha_vantage_api_key = os.getenv("ALPHA_VANTAGE_API_KEY", "XC3SOW4NY57QT9EG")
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

        # YouTube API key (optional)
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY")

        # Initialize FirecrawlApp
        firecrawl_params = {'api_key': self.firecrawl_api_key}
        if firecrawl_api_url := os.getenv("FIRECRAWL_API_URL"):
            firecrawl_params['api_url'] = firecrawl_api_url
            logging.info(f"Using custom Firecrawl API URL: {firecrawl_api_url}")
        self.firecrawl_app = FirecrawlApp(**firecrawl_params)

        self.db = db

    def _summarize_content(self, content: str, context: str) -> str:
        """Uses the agent to summarize a large block of text."""
        if not content or not isinstance(content, str) or len(content) < 500:
            return content  # Return short content as is

        logging.info(f"Summarizing content for context: {context} (length: {len(content)})")
        try:
            summary_prompt = f"""
            Please summarize the following text in the context of gathering intelligence for an AI tool.
            Focus on key features, technologies, user sentiment, and company information.
            
            Context: {context}
            
            Text to summarize:
            ---
            {content[:15000]} 
            ---
            """
            summary = self.agent(summary_prompt, system_message="You are a text summarization expert.")
            logging.info("Content summarized successfully.")
            return str(summary)
        except Exception as e:
            logging.error(f"Could not summarize content for {context}: {e}")
            return content[:1500] # Fallback to truncated content

    def _get_tool_urls(self, tool_info):
        """Extracts and cleans URLs from tool info."""
        urls = [
            tool_info.get('website_url'), 
            tool_info.get('documentation_url'), 
            tool_info.get('blog_url'),
            tool_info.get('changelog_url')
        ]
        return [url for url in urls if url and url.strip()]

    def _analyze_chunk_with_retry(self, chunk_prompt: str, chunk_info: str, max_retries: int = 3) -> str:
        """
        Analyzes a chunk with automatic retry using progressively smaller chunks on context overflow.
        """
        for attempt in range(max_retries):
            try:
                logging.info(f"Attempting chunk analysis (attempt {attempt + 1}/{max_retries}): {chunk_info}")
                result = self.agent(chunk_prompt)
                return str(result)
            except Exception as e:
                error_str = str(e).lower()
                if 'context window' in error_str or 'overflow' in error_str or 'too large' in error_str:
                    logging.warning(f"Context window overflow on attempt {attempt + 1} for {chunk_info}")
                    if attempt < max_retries - 1:
                        # Try to reduce the chunk size for next attempt
                        logging.info(f"Will retry with smaller chunk size...")
                        continue
                    else:
                        logging.error(f"Failed to analyze chunk after {max_retries} attempts: {chunk_info}")
                        return ""
                else:
                    # Different error, don't retry
                    logging.error(f"Non-overflow error analyzing chunk {chunk_info}: {e}")
                    return ""
        return ""

    def _process_tool(self, tool_info: dict):
        """Gathers intelligence for a single tool and generates a snapshot."""
        logging.info(f"Starting intelligence gathering for tool: {tool_info['name']} (ID: {tool_info['id']})")
        
        # --- 1. Data Gathering ---
        # Gather all data sources first, same as before.
        urls = self._get_tool_urls(tool_info)
        all_scraped_text = ""
        for url in urls:
            try:
                scraped_data = self.web_scraper(url, stealth=False)
                if scraped_data and "content" in scraped_data and scraped_data["content"]:
                    all_scraped_text += f"\\n\\n--- Scraped Content from {url} ---\\n{scraped_data['content']}"
            except Exception as e:
                logging.error(f"Error scraping {url}: {e}", exc_info=True)

        # --- Community Metrics Data Collection ---
        github_data = self.github_analyzer(tool_info['github_url']) if tool_info.get('github_url') else None
        reddit_data = self.reddit_searcher(tool_info['name'], ['AI_Agents', 'mcp', 'ClaudeAI', 'ChatGPTCoding', 'cursor', 'ArtificialInteligence', 'PromptEngineering'])
        news_data = self.news_aggregator(tool_info['name'])
        
        # Add all missing community metric scrapers
        hackernews_data = self.hackernews_searcher(tool_info['name'])
        stackoverflow_data = self.stackoverflow_searcher(tool_info['name'])
        youtube_data = self.youtube_searcher(tool_info['name'])
        producthunt_data = self.producthunt_searcher(tool_info['name'])
        devto_data = self.devto_searcher(tool_info['name'])
        npm_data = self.npm_searcher(tool_info['name'])
        pypi_data = self.pypi_searcher(tool_info['name'])
        medium_data = self.medium_searcher(tool_info['name'])

        # This is the complete raw data that we will save at the end.
        full_raw_data_payload = {
            "scraped_content": all_scraped_text, 
            "github_data": github_data,
            "reddit_data": reddit_data, 
            "news_data": news_data,
            "hackernews_data": hackernews_data,
            "stackoverflow_data": stackoverflow_data,
            "youtube_data": youtube_data,
            "producthunt_data": producthunt_data,
            "devto_data": devto_data,
            "npm_data": npm_data,
            "pypi_data": pypi_data,
            "medium_data": medium_data
        }

        # --- 2. Direct Community Metrics Extraction ---
        # Extract concrete metrics directly from scraper results
        community_metrics_direct = {}
        
        # GitHub metrics
        if github_data and not github_data.get('error'):
            community_metrics_direct['github_stars'] = github_data.get('stars')
            community_metrics_direct['github_forks'] = github_data.get('forks')
            community_metrics_direct['github_last_commit_date'] = github_data.get('last_commit_date')
        
        # Reddit metrics
        if reddit_data and not reddit_data.get('error'):
            community_metrics_direct['reddit_mentions'] = reddit_data.get('total_posts', 0)
            community_metrics_direct['reddit_sentiment_score'] = reddit_data.get('average_sentiment')
        
        # Other metrics from scrapers
        if hackernews_data and not hackernews_data.get('error'):
            community_metrics_direct['hacker_news_mentions_count'] = hackernews_data.get('total_mentions', 0)
        
        if stackoverflow_data and not stackoverflow_data.get('error'):
            community_metrics_direct['stackoverflow_questions_count'] = stackoverflow_data.get('total_questions', 0)
        
        if youtube_data and not youtube_data.get('error'):
            community_metrics_direct['youtube_mention_count'] = youtube_data.get('total_videos', 0)
            community_metrics_direct['youtube_tutorial_count'] = youtube_data.get('tutorial_count', 0)
            community_metrics_direct['youtube_sentiment'] = youtube_data.get('average_sentiment')
            if youtube_data.get('top_videos'):
                community_metrics_direct['youtube_top_videos'] = youtube_data['top_videos']
        
        if producthunt_data and not producthunt_data.get('error'):
            community_metrics_direct['producthunt_ranking'] = producthunt_data.get('ranking')
        
        if devto_data and not devto_data.get('error'):
            community_metrics_direct['devto_articles_count'] = devto_data.get('total_articles', 0)
        
        if npm_data and not npm_data.get('error'):
            community_metrics_direct['npm_packages_count'] = len(npm_data.get('packages', []))
            community_metrics_direct['npm_weekly_downloads'] = npm_data.get('total_weekly_downloads', 0)
        
        if pypi_data and not pypi_data.get('error'):
            community_metrics_direct['pypi_packages_count'] = len(pypi_data.get('packages', []))
        
        if medium_data and not medium_data.get('error'):
            community_metrics_direct['medium_articles_count'] = medium_data.get('total_articles', 0)

        logging.info(f"Direct community metrics extracted: {len([k for k, v in community_metrics_direct.items() if v is not None])} fields populated")

        # --- 3. Isolated Chunk Analysis ---
        # Instead of one huge prompt, we analyze each large data source individually.
        partial_analyses = []
        base_info = {
            "tool_name": tool_info['name'], 
            "description": tool_info.get('description'),
            "direct_community_metrics": community_metrics_direct  # Include direct metrics as context
        }

        # Define the large data sources to be processed individually.
        large_data_sources = {
            "scraped_website": all_scraped_text,
            "github_readme": github_data.get('readme') if github_data else None,
            "reddit_posts": json.dumps(reddit_data, default=str) if reddit_data else None,
            "news_articles": json.dumps(news_data, default=str) if news_data else None,
            "hackernews_data": json.dumps(hackernews_data, default=str) if hackernews_data else None,
            "stackoverflow_data": json.dumps(stackoverflow_data, default=str) if stackoverflow_data else None,
            "youtube_data": json.dumps(youtube_data, default=str) if youtube_data else None,
            "producthunt_data": json.dumps(producthunt_data, default=str) if producthunt_data else None,
            "devto_data": json.dumps(devto_data, default=str) if devto_data else None,
            "npm_data": json.dumps(npm_data, default=str) if npm_data else None,
            "pypi_data": json.dumps(pypi_data, default=str) if pypi_data else None,
            "medium_data": json.dumps(medium_data, default=str) if medium_data else None
        }

        for source_name, source_content in large_data_sources.items():
            if not source_content:
                continue
            
            # Use progressive chunk sizing starting with default, then smaller on overflow
            initial_chunks = chunk_text(str(source_content))
            logging.info(f"Processing source '{source_name}' in {len(initial_chunks)} chunk(s).")

            for i, chunk in enumerate(initial_chunks):
                chunk_info = f"chunk {i+1}/{len(initial_chunks)} from source: {source_name}"
                
                # Try analysis with progressively smaller chunks on overflow
                chunk_sizes_to_try = [len(chunk), len(chunk)//2, len(chunk)//4]
                success = False
                
                for attempt, max_chunk_size in enumerate(chunk_sizes_to_try):
                    if max_chunk_size < 1000:  # Don't go below 1000 chars
                        break
                        
                    # Split chunk if needed
                    current_chunk = chunk[:max_chunk_size] if len(chunk) > max_chunk_size else chunk
                    
                    # Payload contains ONLY the essential context and the specific data chunk.
                    chunk_payload = {
                        "context_info": base_info,
                        "data_source_name": source_name,
                        "data_chunk": current_chunk
                    }
                    
                    chunk_prompt = self._create_full_prompt(tool_info['name'], chunk_payload, is_partial=True)
                    
                    # Use retry method for analysis
                    partial_result = self._analyze_chunk_with_retry(chunk_prompt, chunk_info, max_retries=2)
                    
                    if partial_result:
                        extracted_json = self._extract_json(partial_result)
                        if extracted_json:
                            partial_analyses.append(extracted_json)
                            success = True
                            if attempt > 0:
                                logging.info(f"Successfully analyzed {chunk_info} with reduced chunk size ({max_chunk_size} chars)")
                            break
                        else:
                            logging.warning(f"No JSON extracted from {chunk_info}")
                    
                if not success:
                    logging.warning(f"Failed to analyze {chunk_info} after trying multiple chunk sizes")

        # --- 4. Synthesis ---
        # The synthesis step now merges the clean, partial analyses.
        if not partial_analyses:
            logging.error(f"No partial analyses were generated for {tool_info['name']}. However, saving direct community metrics.")
            
            # Even if AI analysis failed, save the direct community metrics we extracted
            fallback_data = ToolSnapshotData(
                community_metrics=community_metrics_direct,
                basic_info={"description": tool_info.get('description'), "category_classification": tool_info.get('category')},
                technical_details={},
                company_info={}
            )
            
            logging.info(f"Saving fallback snapshot with direct metrics for {tool_info['name']}")
            self.db.create_snapshot(tool_info['id'], fallback_data.model_dump(), full_raw_data_payload)
            self.db.update_tool_run_status(tool_info['id'], 'partial_success', 'Direct metrics saved, AI analysis failed due to credentials.')
            return

        logging.info(f"Synthesizing {len(partial_analyses)} partial analyses...")
        synthesis_prompt = self._create_synthesis_prompt(tool_info['name'], partial_analyses)
        
        try:
            agent_response = self.agent(synthesis_prompt)
            logging.info("Agent raw response received successfully from synthesis.")
            
            json_string = self._extract_json(str(agent_response))
            if not json_string:
                raise ValueError("Could not extract JSON from synthesized agent response.")

            validated_data = ToolSnapshotData.model_validate_json(json_string)
            logging.info("Pydantic model validation successful after synthesis.")
            
            # Merge direct community metrics back into the validated data
            # The AI synthesis may have overwritten the direct metrics with None values
            if hasattr(validated_data, 'community_metrics') and validated_data.community_metrics:
                ai_community_metrics = validated_data.community_metrics.copy()
                
                # Preserve direct metrics by merging them back in
                for key, value in community_metrics_direct.items():
                    if value is not None:  # Only overwrite if we have actual data
                        ai_community_metrics[key] = value
                        
                validated_data.community_metrics = ai_community_metrics
                logging.info(f"Merged {len([k for k, v in community_metrics_direct.items() if v is not None])} direct metrics back into synthesis result")
        
        except Exception as e:
            logging.error(f"Agent did not return structured data for {tool_info['name']} after synthesis. Error: {e}", exc_info=True)
            self.db.update_tool_run_status(tool_info['id'], 'failed', str(e))
            return

        # --- 5. Database Update ---
        # The full, original raw data is saved along with the clean, structured data.
        logging.info(f"--- Finished processing for: {tool_info['name']} ---")
        self.db.create_snapshot(tool_info['id'], validated_data.model_dump(), full_raw_data_payload)
        self.db.update_tool_run_status(tool_info['id'], 'success')
        logging.info(f"Successfully created snapshot and processed {tool_info['name']}.")

    def _create_synthesis_prompt(self, tool_name: str, partial_json_strings: list) -> str:
        """Creates the prompt to synthesize partial JSON analyses."""
        
        partials_str = "\\n\\n".join(filter(None, partial_json_strings))

        return f"""
        You are an expert data synthesizer. You have been provided with several partial JSON analysis snippets about the AI tool '{tool_name}'. 
        These snippets were generated by analyzing chunks of a larger document. Your task is to:
        1.  Carefully review all the partial JSON objects.
        2.  Merge them into a single, complete, and coherent JSON object.
        3.  De-duplicate any repeated information. For lists like 'feature_list' or 'testimonials', merge them and remove identical entries. For numeric fields like 'github_stars', take the most frequently occurring value or the most plausible one if there are discrepancies.
        4.  Ensure the final JSON object strictly adheres to the provided schema. Do not add any fields that are not in the schema. All list fields must be lists, even if empty.
        
        Partial JSON snippets to synthesize:
        {partials_str}

        Return ONLY the final, synthesized JSON object, enclosed in ```json ... ```.
        """

    def _create_compact_schema(self) -> dict:
        """Creates a compact JSON schema for partial analysis to reduce context window usage."""
        return {
            "type": "object",
            "properties": {
                "basic_info": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "category_classification": {"type": "string"}
                    }
                },
                "technical_details": {
                    "type": "object", 
                    "properties": {
                        "feature_list": {"type": "array", "items": {"type": "string"}},
                        "technology_stack": {"type": "array", "items": {"type": "string"}},
                        "supported_languages": {"type": "array", "items": {"type": "string"}},
                        "pricing_model": {"type": "object"}
                    }
                },
                "company_info": {
                    "type": "object",
                    "properties": {
                        "company_website": {"type": "string"},
                        "funding_rounds": {"type": "array"},
                        "employee_count": {"type": "integer"},
                        "key_executives": {"type": "array", "items": {"type": "string"}}
                    }
                },
                "community_metrics": {
                    "type": "object",
                    "properties": {
                        "github_stars": {"type": "integer"},
                        "github_forks": {"type": "integer"},
                        "testimonials": {"type": "array", "items": {"type": "string"}},
                        "list_of_companies_using_tool": {"type": "array", "items": {"type": "string"}}
                    }
                }
            }
        }

    def _create_full_prompt(self, tool_name: str, data_payload: dict, is_partial: bool = False) -> str:
        """Creates a prompt for the agent, adapting for full or partial (chunked) data."""
        
        if is_partial:
            # This is the new, isolated chunk processing logic
            context_info = data_payload.get('context_info', {})
            source_name = data_payload.get('data_source_name', 'Unknown Source')
            data_chunk = data_payload.get('data_chunk', '')
            
            # Use compact schema for partial analysis
            schema = self._create_compact_schema()
            
            prompt_intro = f"""
Analyze this data from '{source_name}' about the AI tool '{tool_name}'. 
Extract any relevant information you can find. Focus on key features, metrics, and company details.
If information is not available, use null or empty arrays."""
            
            # Truncate data chunk to ensure we don't exceed context window
            data_str = data_chunk[:12000]  # Conservative limit

            return f"""
            {prompt_intro}
            
            **Data to Analyze:**
            ```
            {data_str}
            ```

            **Instructions:**
            Extract information and return as JSON. Use null for missing data.
            Response must be valid JSON enclosed in ```json ... ```.

            **Schema (extract what you can):**
            ```json
            {json.dumps(schema, indent=1)}
            ```
            """
        else:
            # This is the original logic for smaller, non-chunked tools
            prompt_intro = f"Analyze the following information about the AI tool '{tool_name}' and generate a comprehensive JSON object based on the provided schema."
            raw_data_str = json.dumps(data_payload, indent=2, default=str)

            return f"""
            {prompt_intro}
            
            **Tool Name:** {tool_name}

            **Raw Data:**
            ```json
            {raw_data_str}
            ```

            **Instructions:**
            Please populate all fields in the following JSON schema.
            If information for a field is not available, use `null` for optional fields, or an empty list `[]` for list fields.
            Your response MUST be a single JSON object enclosed in ```json ... ```.
            
            **JSON Schema:**
            ```json
            {json.dumps(ToolSnapshotData.model_json_schema(), indent=2)}
            ```
            """

    def _extract_json(self, text: str) -> str:
        """Extracts the first JSON object from a string."""
        # Regex to find JSON wrapped in ```json ... ```
        match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            return match.group(1)
        
        # Fallback for raw JSON without backticks, finding the first '{' to the last '}'
        try:
            start = text.index('{')
            end = text.rindex('}') + 1
            return text[start:end]
        except ValueError:
            logging.warning("Could not find a JSON object in the response text.")
            return ""

# --- Main Execution Logic ---
def main():
    """Main function to run the intelligence gathering process."""
    # --- Logging Configuration ---
    LOGS_DIR = 'logs'
    if not os.path.exists(LOGS_DIR):
        os.makedirs(LOGS_DIR)

    log_file_name = os.path.join(LOGS_DIR, f"ai_platform_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file_name),
            logging.StreamHandler()
        ]
    )

    logging.info("=================================================")
    logging.info("AI Intelligence Platform - Weekly Run Initializing")
    logging.info("=================================================")

    db = None  # Initialize db to None
    try:
        db = Database()
        if not db.conn:
            logging.error("Failed to establish database connection. Exiting.")
            return

        agent = ToolIntelligenceAgent(db=db)

        tools_to_process = db.get_tools_to_process()
        logging.info(f"Found {len(tools_to_process)} tools to process.")

        for tool in tools_to_process:
            agent._process_tool(tool)

    except Exception as e:
        logging.error(f"An unexpected error occurred during the main run: {e}", exc_info=True)
    finally:
        if db and db.conn:
            db.close()
        logging.info("AI Intelligence Platform run finished.")

if __name__ == "__main__":
    main()
