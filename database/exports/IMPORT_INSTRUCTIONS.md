# AI Intelligence Platform - Data Import Instructions

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
