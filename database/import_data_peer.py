#!/usr/bin/env python3
"""
AI Intelligence Platform - Database Import Script (Peer Authentication)

This script imports exported intelligence data back into a PostgreSQL database using peer authentication.
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

def get_db_connection():
    """Establish database connection using peer authentication."""
    try:
        # Use peer authentication (no password needed when running as postgres user)
        conn = psycopg2.connect(
            dbname="ai_database",
            user="postgres",
            host="localhost",
            port="5432"
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

def main():
    data_dir = Path("./database/exports")
    
    print("📥 AI Intelligence Platform - Database Import (Peer Auth)")
    print("=" * 55)
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return 1
    
    try:
        # Recreate tables
        if not recreate_tables(conn):
            return 1
        
        # Import data for each table
        tables = ["ai_tools", "tool_snapshots", "curated_snapshots", "data_sources"]
        total_imported = 0
        
        for table in tables:
            count = import_table_data(conn, table, data_dir)
            total_imported += count
        
        print("\n" + "=" * 55)
        print("✅ Import completed successfully!")
        print(f"📊 Total records imported: {total_imported}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return 1
    finally:
        conn.close()

if __name__ == "__main__":
    exit(main())