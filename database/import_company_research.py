import os
import json
import logging
import psycopg2
from psycopg2.extras import Json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Database configuration - same as in the main application
DB_NAME = os.getenv("DB_NAME", "ai_database")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

def get_connection():
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

def get_tool_id(cursor, tool_name):
    """Fetches the tool ID for a given tool name."""
    cursor.execute("SELECT id FROM ai_tools WHERE name = %s", (tool_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    logging.warning(f"Tool not found: {tool_name}")
    return None

def upsert_company_info(cursor, tool_id, company_info):
    """Inserts or updates the company info in the curated_tool_data table."""
    section_name = 'company_info'
    insert_query = """
        INSERT INTO curated_tool_data (tool_id, section_name, curated_content)
        VALUES (%s, %s, %s)
        ON CONFLICT (tool_id, section_name) DO UPDATE SET
            curated_content = EXCLUDED.curated_content,
            updated_at = CURRENT_TIMESTAMP;
    """
    try:
        cursor.execute(insert_query, (tool_id, section_name, Json(company_info)))
        logging.info(f"Upserted company info for tool_id: {tool_id}")
    except Exception as e:
        logging.error(f"Failed to upsert company info for tool_id {tool_id}: {e}")
        raise

def main():
    """Main function to import company research data."""
    conn = get_connection()
    if not conn:
        return

    # The script is in /database, so the json is in the parent directory
    json_file_path = os.path.join(os.path.dirname(__file__), '..', 'research_company.json')

    try:
        with open(json_file_path, 'r') as f:
            research_data = json.load(f)
    except FileNotFoundError:
        logging.error(f"Research file not found at: {json_file_path}")
        return
    except json.JSONDecodeError:
        logging.error(f"Error decoding JSON from: {json_file_path}")
        return

    with conn.cursor() as cursor:
        try:
            for item in research_data:
                tool_name = item.get("tool_name")
                company_info = item.get("company_info")

                if not tool_name or not company_info:
                    logging.warning(f"Skipping invalid item: {item}")
                    continue

                tool_id = get_tool_id(cursor, tool_name)
                if tool_id:
                    upsert_company_info(cursor, tool_id, company_info)
            
            conn.commit()
            logging.info("Successfully imported all company research data.")
        
        except Exception as e:
            logging.error(f"An error occurred during import: {e}")
            conn.rollback()
        finally:
            conn.close()
            logging.info("Database connection closed.")

if __name__ == "__main__":
    main() 