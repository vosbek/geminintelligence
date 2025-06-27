#!/usr/bin/env python3
"""
AI Intelligence Platform - Database Import Script

This script imports exported intelligence data back into a PostgreSQL database.
Useful for transferring data between machines or restoring from backups.

Usage:
    python database/import_data.py --data-dir ./exports [--recreate-tables]

Requirements:
    - PostgreSQL database (can be empty)
    - .env file configured with database credentials
    - Exported data files from export_data.py
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Add src directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Establish database connection using environment variables."""
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "ai_platform"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
        print("✅ Successfully connected to database")
        return conn
    except psycopg2.Error as e:
        print(f"❌ Database connection failed: {e}")
        return None

def recreate_tables(conn):
    """Recreate database tables from schema."""
    schema_file = Path(__file__).parent / "schema.sql"
    
    if not schema_file.exists():
        print(f"⚠️  Schema file not found: {schema_file}")
        return False
    
    print("🔄 Recreating database tables...")
    
    try:
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        with conn.cursor() as cur:
            cur.execute(schema_sql)
        conn.commit()
        
        print("✅ Database tables recreated successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to recreate tables: {e}")
        return False

def import_table_data(conn, table_name, data_dir):
    """Import data into a specific table."""
    data_file = data_dir / f"{table_name}.json"
    
    if not data_file.exists():
        print(f"⚠️  Data file not found: {data_file}")
        return 0
    
    print(f"📥 Importing {table_name}...")
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print(f"   📭 No data to import for {table_name}")
            return 0
        
        # Determine table structure from first record
        if not data:
            return 0
        
        sample_record = data[0]
        columns = list(sample_record.keys())
        
        # Prepare INSERT statement
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        insert_sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
        
        # Clear existing data
        with conn.cursor() as cur:
            cur.execute(f"DELETE FROM {table_name}")
        
        # Insert data
        inserted_count = 0
        with conn.cursor() as cur:
            for record in data:
                # Convert JSONB fields back to Json objects
                values = []
                for col in columns:
                    value = record[col]
                    # Handle JSONB columns
                    if col in ['raw_data', 'basic_info', 'technical_details', 
                              'company_info', 'community_metrics', 'additional_urls', 
                              'screenshots', 'videos', 'configuration']:
                        values.append(Json(value) if value else None)
                    else:
                        values.append(value)
                
                cur.execute(insert_sql, values)
                inserted_count += 1
        
        conn.commit()
        print(f"   💾 Imported {inserted_count} records into {table_name}")
        return inserted_count
        
    except Exception as e:
        print(f"❌ Failed to import {table_name}: {e}")
        conn.rollback()
        return 0

def validate_import(conn, data_dir):
    """Validate that import was successful."""
    print("🔍 Validating import...")
    
    validation_results = {}
    
    # Check record counts
    tables = ["ai_tools", "tool_snapshots", "curated_snapshots", "data_sources"]
    
    for table in tables:
        data_file = data_dir / f"{table}.json"
        if data_file.exists():
            with open(data_file, 'r') as f:
                expected_count = len(json.load(f))
            
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                actual_count = cur.fetchone()[0]
            
            validation_results[table] = {
                "expected": expected_count,
                "actual": actual_count,
                "match": expected_count == actual_count
            }
            
            status = "✅" if expected_count == actual_count else "❌"
            print(f"   {status} {table}: {actual_count}/{expected_count}")
    
    # Check for tools with snapshots
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(DISTINCT t.id) 
            FROM ai_tools t 
            JOIN tool_snapshots s ON t.id = s.tool_id
        """)
        tools_with_data = cur.fetchone()[0]
    
    print(f"   📊 Tools with snapshot data: {tools_with_data}")
    
    return all(result["match"] for result in validation_results.values())

def main():
    parser = argparse.ArgumentParser(description="Import AI Intelligence Platform data")
    parser.add_argument("--data-dir", required=True,
                       help="Directory containing exported data files")
    parser.add_argument("--recreate-tables", action="store_true",
                       help="Recreate database tables before import")
    
    args = parser.parse_args()
    
    data_dir = Path(args.data_dir)
    if not data_dir.exists():
        print(f"❌ Data directory not found: {data_dir}")
        return 1
    
    print("📥 AI Intelligence Platform - Database Import")
    print("=" * 50)
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return 1
    
    try:
        # Recreate tables if requested
        if args.recreate_tables:
            if not recreate_tables(conn):
                return 1
        
        # Import data for each table
        tables = ["ai_tools", "tool_snapshots", "curated_snapshots", "data_sources"]
        total_imported = 0
        
        for table in tables:
            count = import_table_data(conn, table, data_dir)
            total_imported += count
        
        # Validate import
        if validate_import(conn, data_dir):
            print("\n" + "=" * 50)
            print("✅ Import completed successfully!")
            print(f"📊 Total records imported: {total_imported}")
            print("🔍 Validation: All record counts match")
        else:
            print("\n" + "=" * 50)
            print("⚠️  Import completed with validation warnings")
            print("🔍 Please check the validation results above")
        
        return 0
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return 1
    finally:
        conn.close()

if __name__ == "__main__":
    exit(main())