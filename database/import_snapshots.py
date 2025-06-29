#!/usr/bin/env python3
"""Import tool snapshots JSON data into PostgreSQL"""

import json
import psycopg2
from psycopg2.extras import Json

def main():
    # Connect to database
    conn = psycopg2.connect(
        dbname="ai_database",
        user="postgres",
        host="localhost",
        port="5432"
    )
    
    print("📥 Importing tool snapshots data...")
    
    try:
        # Load the snapshot data
        with open('./database/exports/tool_snapshots.json', 'r') as f:
            snapshots = json.load(f)
        
        # Clear existing snapshot data for tool_id 1
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tool_snapshots WHERE tool_id = 1")
        
        # Insert the detailed snapshot data
        with conn.cursor() as cur:
            for snapshot in snapshots:
                cur.execute("""
                    INSERT INTO tool_snapshots (
                        tool_id, snapshot_date, basic_info, technical_details, 
                        company_info, community_metrics, raw_data, processing_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, [
                    snapshot['tool_id'],
                    snapshot['snapshot_date'],
                    Json(snapshot.get('basic_info', {})),
                    Json(snapshot.get('technical_details', {})),
                    Json(snapshot.get('company_info', {})),
                    Json(snapshot.get('community_metrics', {})),
                    Json(snapshot.get('raw_data', {})),
                    snapshot.get('processing_status', 'completed')
                ])
        
        conn.commit()
        print(f"✅ Successfully imported {len(snapshots)} snapshot records")
        
    except Exception as e:
        print(f"❌ Error importing snapshots: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()