#!/usr/bin/env python3
"""
Import the complete rich intelligence data from JSON exports
This replaces the minimal data with the full dataset
"""

import json
import psycopg2
from psycopg2.extras import Json
import os

def get_db_connection():
    """Connect to PostgreSQL using environment variables"""
    return psycopg2.connect(
        host="localhost",
        database="ai_database", 
        user="postgres",
        password="dota",
        port="5432"
    )

def clear_existing_data(conn):
    """Clear the minimal existing data"""
    print("🧹 Clearing existing minimal data...")
    with conn.cursor() as cur:
        # Clear snapshots and related data
        cur.execute("DELETE FROM snapshot_changes")
        cur.execute("DELETE FROM tool_snapshots WHERE tool_id = 1")
        cur.execute("DELETE FROM curated_snapshots WHERE snapshot_id = 1") 
    conn.commit()
    print("✅ Cleared existing data")

def import_tool_snapshots(conn):
    """Import the full rich tool_snapshots.json data"""
    print("📥 Importing full tool_snapshots.json...")
    
    with open('./database/exports/tool_snapshots.json', 'r', encoding='utf-8') as f:
        snapshots = json.load(f)
    
    print(f"📊 Found {len(snapshots)} snapshot records to import")
    
    with conn.cursor() as cur:
        for snapshot in snapshots:
            cur.execute("""
                INSERT INTO tool_snapshots (
                    tool_id, snapshot_date, basic_info, technical_details,
                    company_info, community_metrics, raw_data, processing_status,
                    review_status, ready_for_publication, quality_score, changes_detected
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    basic_info = EXCLUDED.basic_info,
                    technical_details = EXCLUDED.technical_details,
                    company_info = EXCLUDED.company_info,
                    community_metrics = EXCLUDED.community_metrics,
                    raw_data = EXCLUDED.raw_data,
                    processing_status = EXCLUDED.processing_status,
                    review_status = EXCLUDED.review_status,
                    quality_score = EXCLUDED.quality_score,
                    changes_detected = EXCLUDED.changes_detected
            """, [
                snapshot['tool_id'],
                snapshot['snapshot_date'],
                Json(snapshot.get('basic_info', {})),
                Json(snapshot.get('technical_details', {})),
                Json(snapshot.get('company_info', {})),
                Json(snapshot.get('community_metrics', {})),
                Json(snapshot.get('raw_data', {})),
                snapshot.get('processing_status', 'completed'),
                'pending_review',  # All imported snapshots need review
                False,             # Not ready for publication until reviewed
                3,                 # Default quality score (1-5)
                False              # No changes detected for initial import
            ])
    
    conn.commit()
    print(f"✅ Imported {len(snapshots)} rich snapshot records")

def verify_import(conn):
    """Verify that all data was imported correctly"""
    print("🔍 Verifying import...")
    
    with conn.cursor() as cur:
        # Check record count
        cur.execute("SELECT COUNT(*) FROM tool_snapshots")
        count = cur.fetchone()[0]
        print(f"📊 Total snapshots: {count}")
        
        # Check data richness
        cur.execute("""
            SELECT 
                tool_id,
                CASE WHEN basic_info IS NOT NULL THEN 'YES' ELSE 'NO' END as has_basic_info,
                CASE WHEN technical_details IS NOT NULL THEN 'YES' ELSE 'NO' END as has_tech_details,
                CASE WHEN company_info IS NOT NULL THEN 'YES' ELSE 'NO' END as has_company_info,
                CASE WHEN community_metrics IS NOT NULL THEN 'YES' ELSE 'NO' END as has_community_metrics,
                CASE WHEN raw_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_raw_data,
                review_status,
                quality_score,
                changes_detected
            FROM tool_snapshots 
            WHERE tool_id = 1
        """)
        
        result = cur.fetchone()
        if result:
            print(f"📋 Data completeness for tool {result[0]}:")
            print(f"   Basic Info: {result[1]}")
            print(f"   Technical Details: {result[2]}")
            print(f"   Company Info: {result[3]}")
            print(f"   Community Metrics: {result[4]}")
            print(f"   Raw Data: {result[5]}")
            print(f"   Review Status: {result[6]}")
            print(f"   Quality Score: {result[7]}")
            print(f"   Changes Detected: {result[8]}")
        
        # Check data size 
        cur.execute("SELECT LENGTH(raw_data::text) as raw_data_size FROM tool_snapshots WHERE tool_id = 1")
        size_result = cur.fetchone()
        if size_result:
            print(f"📏 Raw data size: {size_result[0]:,} characters")

def main():
    print("🚀 Importing Full Rich Intelligence Data")
    print("=" * 50)
    
    try:
        conn = get_db_connection()
        print("✅ Connected to database")
        
        # Step 1: Clear existing minimal data
        clear_existing_data(conn)
        
        # Step 2: Import full rich data
        import_tool_snapshots(conn)
        
        # Step 3: Verify import
        verify_import(conn)
        
        print("\n" + "=" * 50)
        print("🎉 Import completed successfully!")
        print("🌟 Your web app now has access to the full rich dataset!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        if 'conn' in locals():
            conn.close()
    
    return 0

if __name__ == "__main__":
    exit(main())