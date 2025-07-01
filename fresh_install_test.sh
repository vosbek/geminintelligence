#!/bin/bash
# fresh_install_test.sh - Complete fresh installation test script
# Tests all components for new machine deployment including curator agent

set -e  # Exit on any error

echo "🚀 AI Intelligence Platform - Fresh Installation Test"
echo "=" * 60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track test results
PASSED=0
FAILED=0

test_step() {
    echo -e "\n${BLUE}🔍 Testing: $1${NC}"
}

test_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
}

# Test 1: PostgreSQL Installation and Service
test_step "PostgreSQL Installation and Service"
if command -v psql >/dev/null 2>&1; then
    test_pass "PostgreSQL is installed"
    
    if sudo service postgresql status >/dev/null 2>&1; then
        test_pass "PostgreSQL service is running"
    else
        test_fail "PostgreSQL service is not running"
        echo "Run: sudo service postgresql start"
    fi
else
    test_fail "PostgreSQL is not installed"
    echo "Run: sudo apt update && sudo apt install -y postgresql postgresql-contrib"
fi

# Test 2: Database Connection and Setup (Enhanced with Curator Tables)
test_step "Database Connection and Setup"
if sudo -u postgres psql -c '\l' | grep -q ai_database; then
    test_pass "Database 'ai_database' exists"
else
    test_fail "Database 'ai_database' does not exist"
    echo "Run: sudo -u postgres createdb ai_database"
fi

# Test core tables
if sudo -u postgres psql ai_database -c '\dt' | grep -q ai_tools; then
    test_pass "Core tables exist (ai_tools found)"
else
    test_fail "Core tables missing"
    echo "Run: sudo -u postgres psql ai_database < database/schema.sql"
fi

# Test snapshot management tables
if sudo -u postgres psql ai_database -c '\dt' | grep -q tool_snapshots; then
    test_pass "Snapshot management tables exist"
else
    test_fail "Snapshot management tables missing"
    echo "Ensure database/schema.sql includes latest snapshot management schema"
fi

# NEW: Test curator tables
if sudo -u postgres psql ai_database -c '\dt' | grep -q curated_repositories; then
    test_pass "Curator tables exist (curated_repositories found)"
else
    test_fail "Curator tables missing"
    echo "Ensure database/schema.sql includes curator tables (curated_repositories, curation_runs)"
fi

if sudo -u postgres psql ai_database -c '\dt' | grep -q curation_runs; then
    test_pass "Curation runs table exists"
else
    test_fail "Curation runs table missing"
    echo "Run: python3 update_curator_schema.py"
fi

# Test 3: Node.js and npm
test_step "Node.js and npm Installation"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    test_pass "Node.js is installed ($NODE_VERSION)"
    
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        test_pass "npm is installed ($NPM_VERSION)"
    else
        test_fail "npm is not installed"
    fi
else
    test_fail "Node.js is not installed"
    echo "Install Node.js from: https://nodejs.org/"
fi

# Test 4: Web Application Setup (Enhanced with Curator Interface)
test_step "Web Application Setup"
if [ -d "web-implementation" ]; then
    test_pass "web-implementation directory exists"
    
    cd web-implementation
    
    # Test package.json
    if [ -f "package.json" ]; then
        test_pass "package.json exists"
    else
        test_fail "package.json missing"
    fi
    
    # Test node_modules
    if [ -d "node_modules" ]; then
        test_pass "Dependencies installed (node_modules exists)"
    else
        test_warn "Dependencies not installed"
        echo "Run: npm install"
    fi
    
    # Test environment file
    if [ -f ".env.local" ]; then
        test_pass ".env.local configuration file exists"
        
        # Test database connection string
        if grep -q "POSTGRES_HOST=localhost" .env.local; then
            test_pass "Database configuration looks correct"
        else
            test_warn "Database configuration may need updating"
        fi
    else
        test_fail ".env.local configuration file missing"
        echo "Create .env.local with database credentials"
    fi
    
    # Test uploads directory
    if [ -d "public/uploads" ]; then
        test_pass "Uploads directory exists"
        
        if [ -w "public/uploads" ]; then
            test_pass "Uploads directory is writable"
        else
            test_fail "Uploads directory is not writable"
            echo "Run: chmod 755 public/uploads"
        fi
    else
        test_fail "Uploads directory missing"
        echo "Run: mkdir -p public/uploads && chmod 755 public/uploads"
    fi
    
    # NEW: Test curator interface components
    if [ -f "app/curator/page.tsx" ]; then
        test_pass "Curator interface component exists"
    else
        test_fail "Curator interface component missing"
        echo "Ensure curator interface files are present in app/curator/"
    fi
    
    # NEW: Test curator API routes
    if [ -f "app/api/curator/route.ts" ]; then
        test_pass "Curator API routes exist"
    else
        test_fail "Curator API routes missing"
        echo "Ensure curator API routes are present in app/api/curator/"
    fi
    
    cd ..
else
    test_fail "web-implementation directory not found"
fi

# Test 5: Python Environment and Scraper (Enhanced with Curator)
test_step "Python Environment and Scraper Integration"
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version)
    test_pass "Python 3 is installed ($PYTHON_VERSION)"
    
    # Test main scraper module
    if [ -f "src/main.py" ]; then
        test_pass "Scraper main module exists (src/main.py)"
    else
        test_fail "Scraper main module not found (src/main.py)"
    fi
    
    # NEW: Test curator agent
    if [ -f "curator_agent.py" ]; then
        test_pass "Curator agent exists (curator_agent.py)"
        
        # Test if curator agent can be imported
        if python3 -c "import curator_agent" >/dev/null 2>&1; then
            test_pass "Curator agent can be imported"
        else
            test_warn "Curator agent has import issues - check dependencies"
            echo "Run: pip3 install -r curator_requirements.txt"
        fi
    else
        test_fail "Curator agent not found (curator_agent.py)"
    fi
    
    # Test requirements files
    if [ -f "requirements.txt" ]; then
        test_pass "Main requirements file exists"
    else
        test_fail "requirements.txt missing"
    fi
    
    # NEW: Test curator requirements
    if [ -f "curator_requirements.txt" ]; then
        test_pass "Curator requirements file exists"
    else
        test_fail "curator_requirements.txt missing"
    fi
    
    # Test import script
    if [ -f "import_full_data.py" ]; then
        test_pass "Data import script exists"
    else
        test_fail "import_full_data.py script missing"
    fi
    
    # NEW: Test curator schema updater
    if [ -f "update_curator_schema.py" ]; then
        test_pass "Curator schema updater exists"
    else
        test_fail "update_curator_schema.py script missing"
    fi
else
    test_fail "Python 3 is not installed"
    echo "Run: sudo apt install python3 python3-pip"
fi

# NEW: Test 6: GitHub API Configuration (Required for Curator)
test_step "GitHub API Configuration"
if [ -f ".env" ]; then
    test_pass ".env file exists"
    
    if grep -q "GITHUB.*TOKEN" .env; then
        test_pass "GitHub API token configured"
        
        # Test if token is not just a placeholder
        if grep -q "your_github_token" .env; then
            test_warn "GitHub token appears to be placeholder"
            echo "Replace with actual GitHub personal access token"
        else
            test_pass "GitHub token appears to be configured"
        fi
    else
        test_warn "GitHub API token not configured"
        echo "Add GITHUB_API_TOKEN or GITHUB_TOKEN to .env file for curator functionality"
    fi
else
    test_fail ".env file missing"
    echo "Create .env file with GitHub API token for curator functionality"
fi

# Test 7: Data Import and Export Files
test_step "Data Import and Export Files"
if [ -d "database/exports" ]; then
    test_pass "Export directory exists"
    
    if [ -f "database/exports/tool_snapshots.json" ]; then
        test_pass "Snapshot data export file exists"
    else
        test_warn "No snapshot data export file found"
        echo "Ensure you have exported data from previous machine"
    fi
else
    test_warn "Export directory not found"
    echo "Create database/exports/ and copy export files from previous machine"
fi

# Test 8: Build and Production Setup
test_step "Production Build Capability"
if [ -d "web-implementation" ]; then
    cd web-implementation
    
    if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
        test_pass "Next.js configuration exists"
    else
        test_warn "Next.js configuration file not found"
    fi
    
    # Test if we can build (only if dependencies are installed)
    if [ -d "node_modules" ]; then
        if npm run build >/dev/null 2>&1; then
            test_pass "Production build succeeds"
            
            # Clean up build files for fresh test
            rm -rf .next
        else
            test_fail "Production build fails"
            echo "Check TypeScript errors and dependencies"
        fi
    else
        test_warn "Cannot test build - dependencies not installed"
    fi
    
    cd ..
fi

# Test 9: Port Availability
test_step "Port Availability"
if ! ss -tuln | grep -q :3000; then
    test_pass "Port 3000 is available for web application"
else
    test_warn "Port 3000 is already in use"
    echo "Stop other services or use different port"
fi

if ! ss -tuln | grep -q :5432; then
    test_pass "Port 5432 is available for PostgreSQL"
else
    # PostgreSQL should be running on 5432, so this is expected
    test_pass "Port 5432 is in use (PostgreSQL running)"
fi

# NEW: Test 10: Curator Functionality
test_step "Curator Agent Functionality"
if [ -f "curator_agent.py" ] && [ -f ".env" ]; then
    # Test curator help command
    if python3 curator_agent.py --help >/dev/null 2>&1; then
        test_pass "Curator agent help command works"
    else
        test_fail "Curator agent help command fails"
        echo "Check curator_agent.py syntax and dependencies"
    fi
    
    # Test curator database connection
    if python3 -c "
import sys
sys.path.append('.')
try:
    from src.database import Database
    db = Database()
    cur = db.conn.cursor()
    cur.execute('SELECT COUNT(*) FROM curated_repositories')
    count = cur.fetchone()[0]
    print(f'Curator database connection works - {count} repositories')
    db.close()
    exit(0)
except Exception as e:
    print(f'Curator database connection failed: {e}')
    exit(1)
" >/dev/null 2>&1; then
        test_pass "Curator database connection works"
    else
        test_fail "Curator database connection fails"
        echo "Check database setup and curator table creation"
    fi
else
    test_warn "Cannot test curator functionality - missing files"
fi

# NEW: Test 11: Community Metrics Fix Verification
test_step "Community Metrics System"
if [ -f "src/main.py" ]; then
    # Check if the community metrics fix is present
    if grep -q "community_metrics_direct" src/main.py; then
        test_pass "Community metrics fallback system present"
    else
        test_fail "Community metrics fallback system missing"
        echo "Ensure src/main.py includes direct metrics extraction"
    fi
    
    # Check if GitHub data mapping is present
    if grep -q "github_stars.*github_data" src/main.py; then
        test_pass "GitHub metrics mapping present"
    else
        test_fail "GitHub metrics mapping missing"
        echo "Ensure GitHub data is properly mapped to community metrics"
    fi
else
    test_fail "Cannot test community metrics - src/main.py missing"
fi

# Summary
echo -e "\n" + "=" * 60
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "=" * 60

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ($PASSED/$((PASSED + FAILED)))${NC}"
    echo -e "\nYour system is ready for AI Intelligence Platform deployment with curator agent!"
    echo -e "\nNext steps:"
    echo -e "1. cd web-implementation"
    echo -e "2. npm run build"
    echo -e "3. npm run start"
    echo -e "4. Open http://localhost:3000"
    echo -e "5. NEW: Test curator at http://localhost:3000/curator"
else
    echo -e "${RED}❌ SOME TESTS FAILED ($FAILED failures, $PASSED passed)${NC}"
    echo -e "\nPlease address the failed tests above before proceeding."
    
    if [ $PASSED -gt 0 ]; then
        echo -e "\n${GREEN}✅ Working components: $PASSED${NC}"
    fi
    
    # Provide specific guidance for common issues
    echo -e "\n${YELLOW}Common Solutions:${NC}"
    echo -e "• Missing curator tables: Run 'python3 update_curator_schema.py'"
    echo -e "• Missing dependencies: Run 'pip3 install -r curator_requirements.txt'"
    echo -e "• GitHub token needed: Add GITHUB_API_TOKEN to .env file"
    echo -e "• Community metrics: Ensure latest src/main.py with fallback system"
fi

# Exit with error code if any tests failed
exit $FAILED