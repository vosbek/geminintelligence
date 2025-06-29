# AI Intelligence Platform - Troubleshooting Guide

## Quick Diagnosis

Run the automated test script first:
```bash
./fresh_install_test.sh
```

This will identify most common issues automatically.

---

## Database Issues

### PostgreSQL Not Running

**Symptoms**: 
- `Connection refused` errors
- `ECONNREFUSED` messages
- Web interface shows database connection errors

**Solutions**:
```bash
# Check PostgreSQL status
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Enable auto-start on boot
sudo systemctl enable postgresql

# Check if PostgreSQL is listening
ss -tuln | grep 5432
```

### Database Connection Refused

**Symptoms**:
- `psql: FATAL: password authentication failed`
- `role "postgres" does not exist`

**Solutions**:
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'dota';
\q

# Create database if missing
sudo -u postgres createdb ai_database

# Test connection
psql -h localhost -U postgres -d ai_database
```

### Missing Tables

**Symptoms**:
- `relation "ai_tools" does not exist`
- `table "tool_snapshots" does not exist`

**Solutions**:
```bash
# Apply latest schema
sudo -u postgres psql ai_database < database/schema.sql

# Check tables exist
sudo -u postgres psql ai_database -c '\dt'

# Import initial data
python3 import_full_data.py
```

### Schema Version Mismatch

**Symptoms**:
- `column "review_status" does not exist`
- `column "quality_score" does not exist`

**Solutions**:
```bash
# Check current schema version
sudo -u postgres psql ai_database -c '\d tool_snapshots'

# Apply missing columns manually
sudo -u postgres psql ai_database << EOF
ALTER TABLE tool_snapshots ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending_review';
ALTER TABLE tool_snapshots ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 3;
ALTER TABLE tool_snapshots ADD COLUMN IF NOT EXISTS changes_detected BOOLEAN DEFAULT FALSE;
EOF
```

---

## Web Application Issues

### Next.js Build Failures

**Symptoms**:
- TypeScript compilation errors
- Missing dependencies
- Build process fails

**Solutions**:
```bash
# Clear Next.js cache
cd web-implementation
rm -rf .next node_modules package-lock.json

# Reinstall dependencies
npm install

# Fix TypeScript errors
npm run lint

# Force build with detailed output
npm run build -- --debug
```

### Slow Page Loading (60+ seconds)

**Symptoms**:
- Long wait times in development mode
- "Compiling..." messages
- First-time page loads very slow

**Solutions**:
```bash
# Use production build for fast local use
cd web-implementation
npm run build
npm run start

# Development mode is inherently slow for large codebases
# Only use npm run dev for active development
```

### Environment Variables Not Loading

**Symptoms**:
- Database connection fails despite correct credentials
- `undefined` values in environment variables

**Solutions**:
```bash
# Check .env.local exists
ls -la web-implementation/.env.local

# Verify format (no spaces around =)
cat web-implementation/.env.local

# Correct format:
cat > web-implementation/.env.local << EOF
POSTGRES_HOST=localhost
POSTGRES_DB=ai_database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dota
POSTGRES_PORT=5432
UPLOAD_DIR=./public/uploads
EOF

# Restart Next.js after changes
```

### File Upload Errors

**Symptoms**:
- "Cannot save file" errors
- Permission denied on uploads
- 413 Request Entity Too Large

**Solutions**:
```bash
# Create uploads directory with correct permissions
mkdir -p web-implementation/public/uploads
chmod 755 web-implementation/public/uploads

# Check disk space
df -h

# Increase upload limits in next.config.js
cat > web-implementation/next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
EOF
```

---

## Scraper Integration Issues

### Scraper Commands Not Found

**Symptoms**:
- "No such file or directory: src/main.py"
- "Module not found" errors
- Web interface shows scraper errors

**Solutions**:
```bash
# Verify scraper structure
ls -la src/main.py

# Test scraper manually
python3 -m src.main --help

# Check Python path
which python3
python3 --version

# Install missing dependencies
pip3 install -r requirements.txt
```

### Scraper Not Updating Database

**Symptoms**:
- Tools stuck in "update" status
- No new snapshots created
- Status never changes from "running"

**Solutions**:
```bash
# Check scraper database connection
python3 -c "
import psycopg2
conn = psycopg2.connect(host='localhost', database='ai_database', user='postgres', password='dota')
print('Database connection OK')
conn.close()
"

# Monitor scraper execution
cd web-implementation
tail -f ../scraper.log &
curl -X POST http://localhost:3000/api/snapshots/run-tool/1

# Check database updates manually
sudo -u postgres psql ai_database -c "
SELECT id, name, run_status, last_run 
FROM ai_tools 
ORDER BY last_run DESC NULLS LAST 
LIMIT 5;
"
```

### Command Line Arguments Not Working

**Symptoms**:
- Scraper ignores --tool-id flag
- --all-tools doesn't work
- Help command fails

**Solutions**:
```python
# Ensure your src/main.py has proper argument parsing
import argparse

def main():
    parser = argparse.ArgumentParser(description='AI Tools Intelligence Scraper')
    parser.add_argument('--all-tools', action='store_true', help='Run for all tools')
    parser.add_argument('--tool-id', type=int, help='Run for specific tool ID')
    
    args = parser.parse_args()
    
    if args.all_tools:
        # Handle all tools
        pass
    elif args.tool_id:
        # Handle specific tool
        pass
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

---

## Network and Port Issues

### Port 3000 Already in Use

**Symptoms**:
- "EADDRINUSE: address already in use :::3000"
- Cannot start Next.js server

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000
ss -tuln | grep 3000

# Kill process
kill -9 <PID>

# Use different port
cd web-implementation
npm run dev -- -p 3001

# Or permanently change port
echo "PORT=3001" >> .env.local
```

### Cannot Access from Browser

**Symptoms**:
- "This site can't be reached"
- Connection timeouts
- Browser shows connection refused

**Solutions**:
```bash
# Check if server is running
curl http://localhost:3000
wget -q --spider http://localhost:3000

# Check firewall (WSL specific)
# No firewall configuration needed for localhost

# Verify Next.js is binding to correct interface
netstat -tuln | grep 3000

# If using WSL, access via localhost, not WSL IP
```

---

## Performance Issues

### High Memory Usage

**Symptoms**:
- System becomes unresponsive
- Next.js process using excessive memory
- Build process fails with out-of-memory

**Solutions**:
```bash
# Check memory usage
free -h
top -p $(pgrep node)

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Slow Database Queries

**Symptoms**:
- Long loading times for tools list
- Timeouts on tool detail pages
- API responses very slow

**Solutions**:
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_status ON ai_tools(status);
CREATE INDEX IF NOT EXISTS idx_tool_snapshots_tool_id ON tool_snapshots(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_snapshots_date ON tool_snapshots(snapshot_date);

-- Analyze tables
ANALYZE ai_tools;
ANALYZE tool_snapshots;
```

---

## Data Issues

### No Tools Showing Up

**Symptoms**:
- Empty dashboard
- "No AI tools found" message
- Tools list is empty

**Solutions**:
```bash
# Check if tools exist in database
sudo -u postgres psql ai_database -c "SELECT COUNT(*) FROM ai_tools;"

# Check tool status
sudo -u postgres psql ai_database -c "SELECT status, COUNT(*) FROM ai_tools GROUP BY status;"

# Import sample data
python3 import_full_data.py

# Check data export files
ls -la database/exports/
```

### Missing Intelligence Data

**Symptoms**:
- Tools show but no details
- Empty snapshots
- Raw data sections empty

**Solutions**:
```bash
# Check snapshot data
sudo -u postgres psql ai_database -c "
SELECT tool_id, 
       CASE WHEN basic_info IS NOT NULL THEN 'YES' ELSE 'NO' END as has_basic_info,
       CASE WHEN raw_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_raw_data
FROM tool_snapshots;
"

# Import latest export data
ls database/exports/
python3 import_full_data.py

# Run scraper to generate new data
cd web-implementation
curl -X POST http://localhost:3000/api/snapshots/run-all
```

### Broken JSON Data

**Symptoms**:
- "Invalid JSON" errors
- Malformed data display
- Parse errors in browser console

**Solutions**:
```bash
# Validate JSON export files
python3 -c "
import json
with open('database/exports/tool_snapshots.json') as f:
    data = json.load(f)
    print(f'Valid JSON with {len(data)} records')
"

# Clean up database
sudo -u postgres psql ai_database -c "
UPDATE tool_snapshots 
SET raw_data = '{}' 
WHERE raw_data IS NULL OR raw_data = 'null'::jsonb;
"
```

---

## WSL-Specific Issues

### File Permission Problems

**Symptoms**:
- Permission denied errors
- Cannot create files
- Executable scripts don't run

**Solutions**:
```bash
# Fix execute permissions
chmod +x fresh_install_test.sh
chmod +x import_full_data.py

# Fix directory permissions
chmod -R 755 web-implementation/
chmod 755 database/

# Mount with proper permissions (add to /etc/wsl.conf)
sudo tee /etc/wsl.conf << EOF
[automount]
options = "metadata,umask=22,fmask=11"
EOF
```

### Path Issues

**Symptoms**:
- Commands not found
- Incorrect file paths
- Scripts fail to find files

**Solutions**:
```bash
# Use absolute paths
cd /mnt/c/devl/workspaces/gemini

# Check current directory
pwd
ls -la

# Update PATH if needed
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
```

---

## Emergency Recovery

### Complete Reset

If everything is broken:

```bash
# Stop all services
sudo service postgresql stop
pkill -f "next"
pkill -f "node"

# Restart PostgreSQL
sudo service postgresql start

# Reset database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ai_database;"
sudo -u postgres psql -c "CREATE DATABASE ai_database;"
sudo -u postgres psql ai_database < database/schema.sql

# Reset web application
cd web-implementation
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Re-import data
cd ..
python3 import_full_data.py

# Test everything
./fresh_install_test.sh
```

### Backup and Restore

```bash
# Create backup
sudo -u postgres pg_dump ai_database > backup_$(date +%Y%m%d).sql

# Restore from backup
sudo -u postgres psql -c "DROP DATABASE ai_database;"
sudo -u postgres psql -c "CREATE DATABASE ai_database;"
sudo -u postgres psql ai_database < backup_20250629.sql
```

---

## Getting Help

### Log Collection

```bash
# Collect all relevant logs
mkdir -p debug_logs
cp web-implementation/.env.local debug_logs/ 2>/dev/null || echo "No .env.local"
npm run dev > debug_logs/nextjs.log 2>&1 &
sleep 5
pkill -f "next dev"
sudo -u postgres psql ai_database -c "\dt" > debug_logs/tables.sql
sudo journalctl -u postgresql > debug_logs/postgresql.log
./fresh_install_test.sh > debug_logs/test_results.txt 2>&1

echo "Debug logs collected in debug_logs/"
```

### System Information

```bash
# Gather system info for support
echo "=== System Information ===" > system_info.txt
uname -a >> system_info.txt
lsb_release -a >> system_info.txt
node --version >> system_info.txt
npm --version >> system_info.txt
python3 --version >> system_info.txt
sudo service postgresql status >> system_info.txt
```

Remember: Most issues can be resolved by running `./fresh_install_test.sh` and following the specific error messages it provides.