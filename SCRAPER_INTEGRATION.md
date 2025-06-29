# Scraper Integration Requirements

## Overview

The web interface integrates directly with the Python scraper system to provide real-time control over intelligence gathering. This document outlines the requirements for proper integration.

## Python Scraper Requirements

### Command-Line Interface

Your Python scraper must support these command patterns:

```bash
# Weekly run (all tools)
python3 -m src.main --all-tools

# Single tool refresh  
python3 -m src.main --tool-id <tool_id>

# Help/usage information
python3 -m src.main --help
```

### Example Implementation

```python
# src/main.py example structure
import argparse
import sys
from your_scraper_module import scrape_tool, scrape_all_tools

def main():
    parser = argparse.ArgumentParser(description='AI Tools Intelligence Scraper')
    
    # Add command line arguments
    parser.add_argument('--all-tools', action='store_true', 
                       help='Run scraper for all active tools')
    parser.add_argument('--tool-id', type=int, 
                       help='Run scraper for specific tool ID')
    
    args = parser.parse_args()
    
    if args.all_tools:
        print("Starting weekly intelligence run for all tools...")
        scrape_all_tools()
    elif args.tool_id:
        print(f"Starting scraper for tool ID: {args.tool_id}")
        scrape_tool(args.tool_id)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## Database Integration

### Tool Status Updates

The scraper must update the `ai_tools` table `run_status` field:

```sql
-- When starting scraper
UPDATE ai_tools SET run_status = 'update', last_run = CURRENT_TIMESTAMP WHERE id = ?;

-- When successfully completed
UPDATE ai_tools SET run_status = 'processed', last_run = CURRENT_TIMESTAMP WHERE id = ?;

-- When error occurs
UPDATE ai_tools SET run_status = 'error', last_run = CURRENT_TIMESTAMP WHERE id = ?;
```

### Snapshot Creation

Create entries in `tool_snapshots` table:

```sql
INSERT INTO tool_snapshots (
    tool_id, snapshot_date, basic_info, technical_details,
    company_info, community_metrics, raw_data, processing_status,
    review_status, ready_for_publication, quality_score, changes_detected
) VALUES (
    ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 'completed', 
    'pending_review', false, 3, false
);
```

### Change Detection

If implementing change detection, update the `changes_detected` field:

```sql
-- Compare with previous snapshot and set changes_detected
UPDATE tool_snapshots 
SET changes_detected = true 
WHERE id = ? AND (previous snapshot differs significantly);
```

## Web Interface API Endpoints

### Start Weekly Run

**Endpoint**: `POST /api/snapshots/run-all`

**Triggers**: `python3 -m src.main --all-tools`

**Expected Response**:
```json
{
  "success": true,
  "message": "Started weekly run for 150 tools",
  "toolsCount": 150
}
```

### Refresh Single Tool

**Endpoint**: `POST /api/snapshots/run-tool/[id]`

**Triggers**: `python3 -m src.main --tool-id [id]`

**Expected Response**:
```json
{
  "success": true,
  "message": "Started refresh for Tool Name",
  "toolId": 123,
  "toolName": "Tool Name"
}
```

### Add New Tool

**Endpoint**: `POST /api/tools/add-and-run`

**Process**:
1. Inserts new tool into `ai_tools` table
2. Triggers `python3 -m src.main --tool-id [new_id]`

**Expected Response**:
```json
{
  "success": true,
  "message": "Added Tool Name and started intelligence gathering",
  "toolId": 456,
  "toolName": "Tool Name"
}
```

### Status Check

**Endpoint**: `GET /api/snapshots/status`

**Returns**:
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "progress": {
      "total": 150,
      "running": 5,
      "completed": 140,
      "errors": 5,
      "percentage": 93
    },
    "tools": [...],
    "recentSnapshots": [...]
  }
}
```

## Error Handling

### Scraper Error Management

```python
def scrape_tool(tool_id):
    try:
        # Update status to running
        update_tool_status(tool_id, 'update')
        
        # Perform scraping
        result = perform_intelligence_gathering(tool_id)
        
        # Save results
        save_snapshot(tool_id, result)
        
        # Mark as completed
        update_tool_status(tool_id, 'processed')
        
    except Exception as e:
        # Log error
        logger.error(f"Scraping failed for tool {tool_id}: {e}")
        
        # Mark as error
        update_tool_status(tool_id, 'error')
        
        # Optionally save partial results
        save_error_snapshot(tool_id, str(e))
```

### Web Interface Error Handling

The web interface handles these error scenarios:

1. **Scraper command not found**: Shows error message
2. **Database connection issues**: Displays connection error
3. **Timeout errors**: Shows timeout message after 15 minutes
4. **Permission errors**: Shows file/directory permission issues

## Testing Integration

### Manual Testing

```bash
# Test scraper commands
cd /path/to/project
python3 -m src.main --help
python3 -m src.main --tool-id 1
python3 -m src.main --all-tools

# Test web API
cd web-implementation
npm run dev

# Test endpoints
curl -X POST http://localhost:3000/api/snapshots/run-tool/1
curl -X POST http://localhost:3000/api/snapshots/run-all
curl http://localhost:3000/api/snapshots/status
```

### Automated Testing

```bash
# Run the fresh installation test
./fresh_install_test.sh

# Test scraper integration specifically
npm run check-scrapers
```

## Deployment Checklist

### Scraper Requirements
- [ ] Python 3.x installed
- [ ] All scraper dependencies installed
- [ ] `src/main.py` exists and is executable
- [ ] Supports `--all-tools` and `--tool-id` flags
- [ ] Database credentials configured
- [ ] Updates `run_status` fields correctly

### Web Interface Requirements
- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Database connection working
- [ ] Production build successful (`npm run build`)
- [ ] Uploads directory writable

### Database Requirements
- [ ] PostgreSQL installed and running
- [ ] Database `ai_database` created
- [ ] Latest schema applied (includes snapshot management)
- [ ] Proper user permissions configured
- [ ] Test data imported

## Troubleshooting

### Common Issues

**"Command not found" errors**:
- Verify Python path: `which python3`
- Check if module exists: `ls src/main.py`
- Test import: `python3 -c "import src.main"`

**Database connection errors**:
- Check PostgreSQL service: `sudo service postgresql status`
- Verify credentials in `.env.local`
- Test connection: `psql -h localhost -U postgres -d ai_database`

**Permission errors**:
- Check directory permissions: `ls -la`
- Verify uploads directory: `ls -la public/uploads`
- Check scraper permissions: `ls -la src/`

**Timeout errors**:
- Increase timeout in API routes
- Check scraper performance
- Monitor system resources

### Logs and Debugging

**Web Interface Logs**:
```bash
# Development mode
npm run dev  # Logs to console

# Production mode  
npm run start  # Logs to console
```

**Scraper Logs**:
```python
# Add logging to your scraper
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
```

**Database Logs**:
```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Query logs
sudo -u postgres psql ai_database -c "SELECT * FROM pg_stat_activity;"
```

## Performance Considerations

### Concurrency

- Web interface supports multiple concurrent scraper processes
- Database handles concurrent reads/writes safely
- Consider rate limiting for API endpoints

### Monitoring

- Track scraper execution times
- Monitor database performance
- Watch for memory usage during large runs
- Set up alerts for failed scrapes

### Optimization

- Use database indexes for faster queries
- Implement caching for frequently accessed data
- Consider background job processing for large operations
- Monitor disk space for uploads and logs

## Security

### Access Control

- Web interface runs on localhost only (no external access)
- Database credentials in environment variables only
- File uploads restricted to specific directory
- No direct shell command injection (parameterized commands)

### Data Protection

- Intelligence data stored securely in database
- No sensitive information in logs
- Uploaded files sanitized and validated
- Regular database backups recommended