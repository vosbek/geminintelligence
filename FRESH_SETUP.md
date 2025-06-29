# Fresh Machine Setup - Step by Step

**Complete setup instructions from git pull to working web application**

## Prerequisites Check

```bash
# Verify you have these installed
node --version    # Should be v18+ 
npm --version     # Should be 8+
python3 --version # Should be 3.8+
psql --version    # Should be 12+

# If missing any, install them first:
# sudo apt update && sudo apt install -y nodejs npm python3 python3-pip postgresql postgresql-contrib
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

## Step 4: Import Data (If Available)

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
VALUES ('Test Tool', 'A test tool for verification', 'active', 'processed');
EOF
fi

echo "✅ Data import completed"
```

## Step 5: Web Application Setup

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

## Step 6: Test Database Connection

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

## Step 7: Build and Start Application

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

## Step 8: Verify Everything Works

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

## Step 9: Final Verification Checklist

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