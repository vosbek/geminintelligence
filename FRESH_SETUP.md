# Fresh Machine Setup - Step by Step

**Complete setup instructions from git pull to working web application**

## Prerequisites Check

```bash
# Verify you have these installed
node --version    # Should be v18+ 
npm --version     # Should be 8+
python3 --version # Should be 3.8+
pip3 --version    # Should be 20+
psql --version    # Should be 12+

# If missing any, install them first:
# sudo apt update && sudo apt install -y nodejs npm python3 python3-pip postgresql postgresql-contrib

# Check if all required Python packages can be installed
python3 -c "import sys; print(f'Python {sys.version}')"
```

## Step 1: Get Latest Code

```bash
# Navigate to project directory
cd /path/to/your/project

# Pull latest changes
git fetch origin
git pull origin main

# Verify you have the web-implementation directory
ls -la web-implementation/
```

## Step 2: Database Setup (Clean Install)

```bash
# Start PostgreSQL service
sudo service postgresql start

# Connect as postgres user and clean/setup database
sudo -u postgres psql << 'EOF'
-- Drop existing database if it exists (CLEAN SLATE)
DROP DATABASE IF EXISTS ai_database;
DROP USER IF EXISTS ai_user;

-- Create fresh database and user
CREATE DATABASE ai_database;
CREATE USER ai_user WITH PASSWORD 'dota';
GRANT ALL PRIVILEGES ON DATABASE ai_database TO ai_user;

-- Connect to the new database
\c ai_database

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO ai_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_user;

-- Exit psql
\q
EOF

echo "✅ Database created successfully"
```

## Step 3: Apply Database Schema

```bash
# Apply the complete schema
sudo -u postgres psql ai_database < database/schema.sql

# Verify tables were created
sudo -u postgres psql ai_database -c "\dt"

# You should see tables like: ai_tools, tool_snapshots, curation_sessions, etc.
echo "✅ Database schema applied"
```

## Step 4: Python Environment Setup

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Create .env file for Python scraper
cat > .env << 'EOF'
# Database configuration (for Python scraper)
DB_NAME=ai_database
DB_USER=ai_user
DB_PASSWORD=dota
DB_HOST=localhost
DB_PORT=5432

# API Keys (add your actual keys here for full functionality)
# FIRECRAWL_API_KEY=your_firecrawl_key
# GITHUB_API_TOKEN=your_github_token
# REDDIT_CLIENT_ID=your_reddit_client_id
# REDDIT_CLIENT_SECRET=your_reddit_client_secret
# REDDIT_USERNAME=your_reddit_username
# REDDIT_PASSWORD=your_reddit_password
# REDDIT_USER_AGENT=YourApp/1.0
# NEWS_API_KEY=your_news_api_key
# ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
# PRODUCTHUNT_API_TOKEN=your_producthunt_token
# MEDIUM_API_KEY=your_medium_key
# AWS credentials for Strands AI
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EOF

echo "✅ Python environment setup completed"
echo "⚠️  Important: Add your actual API keys to .env file for full scraping functionality"
```

## Step 5: Import Data (If Available)

```bash
# Check if you have export data
ls -la database/exports/

# If you have export files, import them
if [ -f "database/exports/tool_snapshots.json" ]; then
    echo "📥 Importing data..."
    python3 import_full_data.py
else
    echo "⚠️  No export data found - will start with empty database"
    # Insert a test tool to verify everything works
    sudo -u postgres psql ai_database << 'EOF'
INSERT INTO ai_tools (name, description, status, run_status) 
VALUES ('Test Tool', 'A test tool for verification', 'active', 'update');
EOF
fi

echo "✅ Data import completed"
```

## Step 6: Web Application Setup

```bash
# Navigate to web application directory
cd web-implementation

# Remove any existing build artifacts and dependencies
rm -rf node_modules package-lock.json .next

# Install dependencies
npm install

# Create environment configuration
cat > .env.local << 'EOF'
POSTGRES_HOST=localhost
POSTGRES_DB=ai_database
POSTGRES_USER=ai_user
POSTGRES_PASSWORD=dota
POSTGRES_PORT=5432
UPLOAD_DIR=./public/uploads
EOF

# Create uploads directory
mkdir -p public/uploads
chmod 755 public/uploads

echo "✅ Web application configured"
```

## Step 7: Test Database Connection

```bash
# Test database connection from Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  database: 'ai_database',
  user: 'ai_user',
  password: 'dota',
  port: 5432,
});

pool.query('SELECT COUNT(*) FROM ai_tools', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    console.log('📊 Tools in database:', res.rows[0].count);
    pool.end();
  }
});
"
```

## Step 8: Build and Start Application

```bash
# Build for production (fast performance)
npm run build

# If build fails, check for errors and fix them
# Common fixes:
# - npm install --legacy-peer-deps
# - Delete node_modules and reinstall

# Start production server
npm run start &

# Wait a moment for server to start
sleep 5

echo "✅ Application should be running at http://localhost:3000"
```

## Step 9: Verify Everything Works

```bash
# Test the application endpoints
echo "🔍 Testing application..."

# Test homepage
curl -s http://localhost:3000 | grep -q "Intelligence Dashboard" && echo "✅ Homepage loads" || echo "❌ Homepage failed"

# Test API
curl -s http://localhost:3000/api/snapshots/status | grep -q "success" && echo "✅ API works" || echo "❌ API failed"

# Test database query
curl -s "http://localhost:3000/api/tools" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Found {len(data)} tools in database')
except:
    print('❌ API response invalid')
"

echo "🎉 Setup verification complete!"
echo "👉 Open your browser to: http://localhost:3000"
```

## Step 10: Test Complete Workflow

```bash
# Test the complete workflow from web interface
echo "🧪 Testing complete workflow..."

# 1. Access web interface
curl -s http://localhost:3000 | grep -q "AI Tools Intelligence Dashboard" && echo "✅ Web interface accessible" || echo "❌ Web interface failed"

# 2. Test Python scraper availability
cd ..
python3 src/main.py --help >/dev/null 2>&1 && echo "✅ Python scraper available" || echo "❌ Python scraper failed"

# 3. Test API endpoints
curl -s http://localhost:3000/api/tools | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'✅ API returns {len(data)} tools')" 2>/dev/null || echo "❌ API failed"

echo "🎉 Workflow test complete!"
echo "👉 Open your browser to: http://localhost:3000/tools"
echo "💡 Use 'Add New Tool' button to add tools, then 'Run Scraper' to collect intelligence"
```

---

## Complete Workflow Guide

### Adding New Tools via Web Interface

1. **Navigate to Tools Page**: `http://localhost:3000/tools`
2. **Click "Add New Tool"** button in the top-right
3. **Fill in tool details**:
   - **Tool Name**: Required (e.g., "Cursor")
   - **Description**: Optional brief description
   - **Company Info**: Company name and legal name
   - **GitHub URL**: If available
   - **Category**: e.g., "AI_IDE", "CODE_COMPLETION"
   - **URLs**: Add multiple URLs (website, blog, changelog, etc.)
4. **Click "Add Tool"** - tool will be added with `run_status='update'`

### Running Intelligence Collection

**Option 1: Via Web Interface**
1. On the Tools page, find the "AI Tool Scraper" section
2. Click **"Run Scraper"** button
3. Monitor progress and results in the interface

**Option 2: Via Command Line**
```bash
# From project root directory
python3 src/main.py
```

### What the Scraper Collects

The Python scraper (`src/main.py`) collects intelligence from:
- **Web scraping** of all tool URLs (using Firecrawl)
- **GitHub analysis** (stars, forks, commits, releases)
- **Reddit mentions** across AI-related subreddits
- **News articles** and press coverage
- **Financial data** for public/private companies
- **Community metrics** (HackerNews, StackOverflow, Dev.to)
- **ProductHunt rankings and reviews**

### Viewing Results

1. **Dashboard**: `http://localhost:3000` - Overview and stats
2. **Tools List**: `http://localhost:3000/tools` - All tools with intelligence status
3. **Tool Details**: `http://localhost:3000/tool/[id]` - Detailed intelligence data
4. **Reports**: `http://localhost:3000/reports` - Analytics and insights

### API Integration

The web application provides REST APIs:
- `GET /api/tools` - List all tools
- `POST /api/tools` - Add new tool
- `GET /api/tools/[id]` - Get tool details
- `POST /api/scraper/run` - Trigger Python scraper
- `GET /api/scraper/run` - Check scraper status

## Step 11: Final Verification Checklist

```bash
# Run the automated test script
cd ..
./fresh_install_test.sh

# This will verify:
# ✅ PostgreSQL running
# ✅ Database exists with correct tables
# ✅ Web application built successfully
# ✅ All dependencies installed
# ✅ Environment configured correctly
# ✅ Ports available
# ✅ File permissions correct
```

## Troubleshooting Common Issues

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Use legacy peer deps
npm install --legacy-peer-deps

# Or use exact versions
rm package-lock.json
npm install
```

### Issue: Database connection fails

```bash
# Check PostgreSQL is running
sudo service postgresql status
sudo service postgresql restart

# Test connection manually
psql -h localhost -U ai_user -d ai_database

# If password fails, reset it:
sudo -u postgres psql -c "ALTER USER ai_user PASSWORD 'dota';"
```

### Issue: Build fails with TypeScript errors

```bash
# Check for missing dependencies
npm install @types/node @types/react @types/react-dom

# Skip type checking temporarily
npm run build -- --skip-ts-checks

# Fix import paths
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "from '@/" | head -5
```

### Issue: Port 3000 in use

```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
npm run start -- -p 3001
```

### Issue: Permission denied on uploads

```bash
# Fix permissions
chmod 755 public/uploads
chown -R $USER:$USER public/

# Check disk space
df -h .
```

## Success Indicators

When everything is working, you should see:

1. **Database**: `ai_database` exists with tables
2. **Web App**: Builds without errors
3. **Server**: Starts on port 3000
4. **Homepage**: Shows "AI Tools Intelligence Dashboard"
5. **API**: Returns JSON responses
6. **Tools**: At least one tool visible (test tool or imported data)

## Quick Recovery Commands

If something goes wrong, use this to start over:

```bash
# Nuclear option - complete reset
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ai_database;"
sudo service postgresql restart
rm -rf web-implementation/node_modules web-implementation/.next
cd web-implementation && rm -f package-lock.json

# Then follow steps 2-8 again
```

---

**🎯 Goal**: After following these steps, `http://localhost:3000` should show your AI Tools Intelligence Dashboard with full functionality.

**⏱️ Time**: ~10-15 minutes for complete fresh setup

**🆘 Help**: If any step fails, run `./fresh_install_test.sh` for detailed diagnostics.