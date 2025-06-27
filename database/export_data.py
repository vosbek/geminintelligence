#!/usr/bin/env python3
"""
AI Intelligence Platform - Database Export Script

This script exports all intelligence data from the PostgreSQL database
into JSON format optimized for analysis and data transfer between machines.

Usage:
    python database/export_data.py [--output-dir ./exports] [--format json|csv|both]

Requirements:
    - PostgreSQL database with data
    - .env file configured with database credentials
    - Python dependencies installed (psycopg2, pandas)
"""

import os
import sys
import json
import datetime
import argparse
from pathlib import Path

# Add src directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import psycopg2
from psycopg2.extras import RealDictCursor
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

def export_table_data(conn, table_name, output_dir):
    """Export all data from a specific table."""
    print(f"📊 Exporting {table_name}...")
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {table_name}")
        rows = cur.fetchall()
        
        # Convert to list of dictionaries for JSON serialization
        data = []
        for row in rows:
            row_dict = dict(row)
            # Convert datetime objects to ISO strings
            for key, value in row_dict.items():
                if isinstance(value, datetime.datetime):
                    row_dict[key] = value.isoformat()
                elif isinstance(value, datetime.date):
                    row_dict[key] = value.isoformat()
            data.append(row_dict)
        
        # Write to JSON file
        output_file = output_dir / f"{table_name}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"   💾 Exported {len(data)} records to {output_file}")
        return len(data)

def export_structured_analysis(conn, output_dir):
    """Export a comprehensive analysis-ready dataset."""
    print("🔍 Creating structured analysis dataset...")
    
    query = """
    SELECT 
        t.id as tool_id,
        t.name,
        t.website_url,
        t.github_url,
        t.category,
        t.status,
        t.run_status,
        t.last_run,
        s.id as snapshot_id,
        s.snapshot_date,
        s.basic_info,
        s.technical_details,
        s.company_info,
        s.community_metrics,
        s.raw_data,
        s.processing_status,
        s.created_at as snapshot_created_at
    FROM ai_tools t
    LEFT JOIN tool_snapshots s ON t.id = s.tool_id
    ORDER BY t.name, s.snapshot_date DESC
    """
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query)
        rows = cur.fetchall()
        
        # Process data for analysis
        analysis_data = {
            "export_info": {
                "timestamp": datetime.datetime.now().isoformat(),
                "total_tools": 0,
                "total_snapshots": 0,
                "data_sources_available": []
            },
            "tools": {},
            "summary_stats": {}
        }
        
        tools_processed = set()
        snapshots_count = 0
        data_sources = set()
        
        for row in rows:
            tool_name = row['name']
            tool_id = row['tool_id']
            
            # Initialize tool entry if first time seeing it
            if tool_name not in analysis_data["tools"]:
                analysis_data["tools"][tool_name] = {
                    "tool_info": {
                        "id": tool_id,
                        "name": tool_name,
                        "website_url": row['website_url'],
                        "github_url": row['github_url'],
                        "category": row['category'],
                        "status": row['status'],
                        "run_status": row['run_status'],
                        "last_run": row['last_run'].isoformat() if row['last_run'] else None
                    },
                    "snapshots": []
                }
                tools_processed.add(tool_name)
            
            # Add snapshot data if it exists
            if row['snapshot_id']:
                snapshot_data = {
                    "snapshot_id": row['snapshot_id'],
                    "snapshot_date": row['snapshot_date'].isoformat() if row['snapshot_date'] else None,
                    "processing_status": row['processing_status'],
                    "basic_info": row['basic_info'],
                    "technical_details": row['technical_details'],
                    "company_info": row['company_info'],
                    "community_metrics": row['community_metrics'],
                    "raw_data": row['raw_data']
                }
                
                # Track data sources from raw_data
                if row['raw_data']:
                    for source in row['raw_data'].keys():
                        data_sources.add(source)
                
                analysis_data["tools"][tool_name]["snapshots"].append(snapshot_data)
                snapshots_count += 1
        
        # Update summary statistics
        analysis_data["export_info"]["total_tools"] = len(tools_processed)
        analysis_data["export_info"]["total_snapshots"] = snapshots_count
        analysis_data["export_info"]["data_sources_available"] = sorted(list(data_sources))
        
        # Generate summary statistics
        analysis_data["summary_stats"] = {
            "tools_with_data": sum(1 for tool in analysis_data["tools"].values() if tool["snapshots"]),
            "tools_without_data": sum(1 for tool in analysis_data["tools"].values() if not tool["snapshots"]),
            "avg_snapshots_per_tool": snapshots_count / len(tools_processed) if tools_processed else 0,
            "data_sources_count": len(data_sources),
            "processing_status_breakdown": {}
        }
        
        # Processing status breakdown
        status_counts = {}
        for tool in analysis_data["tools"].values():
            for snapshot in tool["snapshots"]:
                status = snapshot["processing_status"]
                status_counts[status] = status_counts.get(status, 0) + 1
        analysis_data["summary_stats"]["processing_status_breakdown"] = status_counts
        
        # Write analysis file
        output_file = output_dir / "intelligence_analysis.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"   📈 Analysis dataset created: {output_file}")
        print(f"   📊 {len(tools_processed)} tools, {snapshots_count} snapshots, {len(data_sources)} data sources")
        
        return analysis_data

def export_raw_data_samples(conn, output_dir):
    """Export sample raw data for each data source for inspection."""
    print("🔬 Exporting raw data samples...")
    
    query = """
    SELECT DISTINCT jsonb_object_keys(raw_data) as data_source
    FROM tool_snapshots 
    WHERE raw_data IS NOT NULL
    """
    
    with conn.cursor() as cur:
        cur.execute(query)
        data_sources = [row[0] for row in cur.fetchall()]
    
    samples = {}
    for source in data_sources:
        query = f"""
        SELECT 
            t.name as tool_name,
            s.snapshot_date,
            s.raw_data -> %s as source_data
        FROM tool_snapshots s
        JOIN ai_tools t ON s.tool_id = t.id
        WHERE s.raw_data -> %s IS NOT NULL
        ORDER BY s.snapshot_date DESC
        LIMIT 3
        """
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (source, source))
            rows = cur.fetchall()
            
            samples[source] = []
            for row in rows:
                samples[source].append({
                    "tool_name": row['tool_name'],
                    "snapshot_date": row['snapshot_date'].isoformat() if row['snapshot_date'] else None,
                    "sample_data": row['source_data']
                })
    
    output_file = output_dir / "raw_data_samples.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(samples, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"   🔬 Raw data samples exported: {output_file}")
    print(f"   📋 Data sources: {', '.join(data_sources)}")

def create_import_instructions(output_dir):
    """Create instructions for importing the data."""
    instructions = """# AI Intelligence Platform - Data Import Instructions

## Files Exported

1. **intelligence_analysis.json** - Complete analysis-ready dataset
   - All tools and their snapshots
   - Summary statistics  
   - Raw data from all 11 sources
   - Processing status information

2. **ai_tools.json** - Tool configuration data
   - Tool definitions and metadata
   - Processing status and timestamps

3. **tool_snapshots.json** - All snapshot data
   - Complete raw and processed data
   - Timestamps and processing status

4. **raw_data_samples.json** - Sample data from each source
   - 3 examples per data source
   - Useful for understanding data structure

## Recommended Analysis Workflow

### 1. Quick Overview
```python
import json
with open('intelligence_analysis.json', 'r') as f:
    data = json.load(f)

print(f"Total tools: {data['export_info']['total_tools']}")
print(f"Total snapshots: {data['export_info']['total_snapshots']}")
print(f"Data sources: {data['export_info']['data_sources_available']}")
```

### 2. Analyze Specific Tool
```python
tool_name = "Cursor"  # Replace with tool name
tool_data = data['tools'][tool_name]
latest_snapshot = tool_data['snapshots'][0]  # Most recent

# View community metrics
print(latest_snapshot['community_metrics'])

# View raw data sources
print(list(latest_snapshot['raw_data'].keys()))
```

### 3. Cross-Tool Analysis
```python
# Compare GitHub stars across tools
for tool_name, tool_data in data['tools'].items():
    if tool_data['snapshots']:
        latest = tool_data['snapshots'][0]
        github_stars = latest['community_metrics'].get('github_stars')
        if github_stars:
            print(f"{tool_name}: {github_stars} stars")
```

## Import to New Database (if needed)

Use the provided import_data.py script:
```bash
python database/import_data.py --data-dir ./exports
```

This will recreate the database structure and import all data.
"""
    
    instructions_file = output_dir / "IMPORT_INSTRUCTIONS.md"
    with open(instructions_file, 'w', encoding='utf-8') as f:
        f.write(instructions)
    
    print(f"   📄 Import instructions created: {instructions_file}")

def main():
    parser = argparse.ArgumentParser(description="Export AI Intelligence Platform data")
    parser.add_argument("--output-dir", default="./exports", 
                       help="Output directory for exported files")
    parser.add_argument("--format", choices=["json", "csv", "both"], default="json",
                       help="Export format")
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("🚀 AI Intelligence Platform - Database Export")
    print("=" * 50)
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return 1
    
    try:
        # Export raw table data
        tables = ["ai_tools", "tool_snapshots", "curated_snapshots", "data_sources"]
        total_records = 0
        
        for table in tables:
            try:
                count = export_table_data(conn, table, output_dir)
                total_records += count
            except psycopg2.Error as e:
                print(f"⚠️  Warning: Could not export {table}: {e}")
        
        # Export analysis-ready dataset
        analysis_data = export_structured_analysis(conn, output_dir)
        
        # Export raw data samples
        export_raw_data_samples(conn, output_dir)
        
        # Create import instructions
        create_import_instructions(output_dir)
        
        print("\n" + "=" * 50)
        print("✅ Export completed successfully!")
        print(f"📁 Output directory: {output_dir.absolute()}")
        print(f"📊 Total records exported: {total_records}")
        print(f"🔍 Analysis file: intelligence_analysis.json")
        print(f"📄 Instructions: IMPORT_INSTRUCTIONS.md")
        
        return 0
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        return 1
    finally:
        conn.close()

if __name__ == "__main__":
    exit(main())