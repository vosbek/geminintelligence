# AI Intelligence Platform - Data Import Instructions

## ⚠️ UPGRADE NOTICE: Enhanced Company Intelligence Features Added

This export contains data from the **enhanced system** with new company intelligence capabilities.
If upgrading from a previous version, see the **Upgrade Instructions** section below.

## Files Exported

1. **intelligence_analysis.json** - Complete analysis-ready dataset
   - All tools and their snapshots
   - Summary statistics  
   - Raw data from all **17 sources** (5 new company intelligence sources added)
   - Processing status information

2. **ai_tools.json** - Tool configuration data
   - Tool definitions and metadata
   - Processing status and timestamps

3. **tool_snapshots.json** - All snapshot data
   - Complete raw and processed data with **enhanced company fields**
   - Timestamps and processing status

4. **raw_data_samples.json** - Sample data from each source
   - 3 examples per data source
   - **NEW**: Company intelligence data samples from LinkedIn, About pages, AngelList, etc.

## 🚀 Upgrade Instructions (From Previous Version)

### Step 1: Update Codebase
Pull the latest code changes that include:
- Enhanced data models with new company fields
- 5 new FREE company intelligence scrapers
- Updated main processing pipeline

### Step 2: Environment Variables (Optional - All New Sources Are FREE)
No new paid API keys required! All company intelligence uses free public data.

### Step 3: Database Migration
The enhanced system uses the same database schema with JSON fields, so **no database migration needed**.
Import will work with existing data structure.

### Step 4: Validate Enhanced Features
After import, test the new company intelligence data:

```python
# Check for new company intelligence fields
latest_snapshot = data['tools']['Cursor']['snapshots'][0]
company_info = latest_snapshot['company_info']

# New fields to validate:
print("Employee Count:", company_info.get('employee_count'))
print("Employee Source:", company_info.get('employee_count_source'))
print("Strategic Partnerships:", company_info.get('strategic_partnerships'))
print("Company Stage:", company_info.get('company_stage'))
print("Headquarters:", company_info.get('headquarters_location'))

# Check new raw data sources:
raw_data = latest_snapshot['raw_data']
new_sources = [
    'linkedin_company_data',
    'company_about_data', 
    'angellist_data',
    'enhanced_news_data',
    'glassdoor_data'
]

for source in new_sources:
    if source in raw_data:
        print(f"✅ {source}: Available")
    else:
        print(f"❌ {source}: Missing")
```

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
