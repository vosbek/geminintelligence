import os
import json
import logging
import psycopg2
from psycopg2.extras import DictCursor

# --- Database Configuration ---
# To run this script, ensure the following environment variables are set:
# DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
DB_NAME = os.getenv("DB_NAME", "ai_database")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

def fetch_all_data(conn):
    """
    Fetches all tools and their related data from the database and structures it.
    
    The final JSON object will be a list of tools, where each tool has its
    details and nested lists for URLs, snapshots, screenshots, etc.
    """
    if not conn:
        return None

    with conn.cursor(cursor_factory=DictCursor) as cur:
        logging.info("Fetching all tools from ai_tools table...")
        cur.execute("SELECT * FROM ai_tools ORDER BY id")
        tools = cur.fetchall()
        
        all_tools_data = []

        for tool in tools:
            tool_data = dict(tool)
            tool_id = tool['id']
            logging.info(f"Processing tool: {tool['name']} (ID: {tool_id})")

            # Fetch related data for the current tool
            cur.execute("SELECT * FROM tool_urls WHERE tool_id = %s", (tool_id,))
            tool_data['urls'] = [dict(row) for row in cur.fetchall()]

            cur.execute("SELECT * FROM tool_snapshots WHERE tool_id = %s ORDER BY snapshot_date DESC", (tool_id,))
            snapshots = cur.fetchall()
            tool_data['snapshots'] = []
            for snapshot in snapshots:
                snapshot_data = dict(snapshot)
                snapshot_id = snapshot['id']
                
                cur.execute("SELECT * FROM curated_snapshots WHERE snapshot_id = %s", (snapshot_id,))
                curated = cur.fetchone()
                snapshot_data['curated_data'] = dict(curated) if curated else None

                cur.execute("SELECT * FROM snapshot_changes WHERE snapshot_id = %s", (snapshot_id,))
                snapshot_data['changes'] = [dict(row) for row in cur.fetchall()]
                tool_data['snapshots'].append(snapshot_data)

            cur.execute("SELECT * FROM tool_screenshots WHERE tool_id = %s", (tool_id,))
            tool_data['screenshots'] = [dict(row) for row in cur.fetchall()]

            cur.execute("SELECT * FROM curated_tool_data WHERE tool_id = %s", (tool_id,))
            tool_data['curated_sections'] = [dict(row) for row in cur.fetchall()]

            cur.execute("SELECT * FROM enterprise_positioning WHERE tool_id = %s", (tool_id,))
            enterprise = cur.fetchone()
            tool_data['enterprise_positioning'] = dict(enterprise) if enterprise else None
            
            all_tools_data.append(tool_data)
            
    return all_tools_data


def main():
    """
    Main function to export curated data to a JSON file.
    """
    logging.info("Starting data export process...")
    
    conn = get_db_connection()
    if not conn:
        logging.error("Failed to get database connection. Aborting export.")
        return

    try:
        all_data = fetch_all_data(conn)
        
        if all_data is not None:
            output_filename = 'curated_export.json'
            logging.info(f"Writing all tool data to {output_filename}...")
            
            # Custom JSON serializer to handle data types like datetime
            def default_serializer(o):
                if isinstance(o, (datetime.date, datetime.datetime)):
                    return o.isoformat()
                raise TypeError(f"Object of type {o.__class__.__name__} is not JSON serializable")

            with open(output_filename, 'w') as f:
                json.dump(all_data, f, indent=4, default=str) # Using str as a simple serializer for datetimes etc.

            logging.info(f"Successfully exported data for {len(all_data)} tools to {output_filename}.")
        else:
            logging.warning("No data was fetched from the database.")
            
    except Exception as e:
        logging.error(f"An error occurred during the export process: {e}")
    finally:
        if conn:
            conn.close()
            logging.info("Database connection closed.")

if __name__ == "__main__":
    # Add a simple import for datetime inside main() to fix the NameError
    import datetime
    main() 