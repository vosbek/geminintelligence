# database/debug_dump.py
import os
import json
import logging
import psycopg2
from psycopg2.extras import DictCursor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Database configuration
DB_NAME = os.getenv("DB_NAME", "ai_database")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'database_debug_dump.txt')

def get_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
        )
        logging.info("Successfully connected to the database.")
        return conn
    except psycopg2.OperationalError as e:
        logging.error(f"Could not connect to the database: {e}")
        return None

def main():
    """Connects to the DB, dumps key tables to a text file, and prints the content."""
    conn = get_connection()
    if not conn:
        return

    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor, open(OUTPUT_FILE, 'w') as f:
            
            f.write("=========================================\n")
            f.write("==========      AI TOOLS      ===========\n")
            f.write("=========================================\n\n")
            
            cursor.execute("SELECT id, name, category, company_name, run_status, last_run FROM ai_tools ORDER BY id;")
            tools = cursor.fetchall()
            for tool in tools:
                f.write(f"--- Tool ID: {tool['id']} ---\n")
                f.write(json.dumps(dict(tool), indent=2, default=str))
                f.write("\n\n")

            f.write("\n\n=========================================\n")
            f.write("========    TOOL SNAPSHOTS     ========\n")
            f.write("=========================================\n\n")

            cursor.execute("""
                SELECT 
                    id, tool_id, snapshot_date, processing_status, 
                    basic_info,
                    technical_details,
                    company_info,
                    community_metrics 
                FROM tool_snapshots 
                WHERE tool_id = 1
                LIMIT 1;
            """)
            snapshots = cursor.fetchall()
            for snapshot in snapshots:
                f.write(f"--- Snapshot for Tool ID: {snapshot['tool_id']} ---\n")
                f.write(json.dumps(dict(snapshot), indent=2, default=str))

        logging.info(f"Successfully dumped database state to {OUTPUT_FILE}")

        # Also print the file content to the console for immediate viewing
        with open(OUTPUT_FILE, 'r') as f:
            print(f.read())

    except Exception as e:
        logging.error(f"An error occurred: {e}")
    finally:
        conn.close()
        logging.info("Database connection closed.")

if __name__ == "__main__":
    main() 