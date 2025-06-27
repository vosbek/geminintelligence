# AI Intelligence Platform - Testing & Validation Guide

## 🎯 Purpose
This guide provides step-by-step instructions for testing the critical fixes made to the AI Intelligence Platform and collecting validation data.

---

## 🚀 Quick Testing Steps

### **Step 1: Environment Setup**
```bash
# Navigate to your project directory
cd /path/to/gemini

# Ensure you have AWS credentials configured
aws configure list

# Verify environment variables are set
cat .env | grep -E "(FIRECRAWL|GITHUB|NEWS|REDDIT)"

# Install any missing dependencies
pip install -r requirements.txt
```

### **Step 2: Run Single Tool Test**
```bash
# Test with a single tool first (Zed is recommended)
python src/main.py

# Watch the logs for:
# - "Sending data to Strands AI for analysis..."
# - "Agent response text length: XXX"
# - "JSON parsing successful"
# - "Pydantic model validation successful"
```

### **Step 3: Check Database Results**
```sql
-- Connect to your PostgreSQL database and run:

-- Check if new snapshots were created
SELECT tool_id, snapshot_date, processing_status 
FROM tool_snapshots 
ORDER BY snapshot_date DESC 
LIMIT 5;

-- Check if structured data is populated (not null/empty)
SELECT 
    tool_id,
    basic_info->'description' as description,
    community_metrics->'github_stars' as github_stars,
    jsonb_array_length(technical_details->'feature_list') as feature_count
FROM tool_snapshots 
WHERE processing_status = 'processed'
ORDER BY snapshot_date DESC 
LIMIT 3;
```

---

## 📋 Comprehensive Testing Checklist

### **Test 1: LLM Processing Validation** ✅
**Goal**: Verify Claude receives all data and returns structured JSON

**Steps**:
1. Run: `python src/main.py` 
2. Check logs for: `"Agent response preview: {..."`
3. Verify no JSON parsing errors

**Success Criteria**:
- [ ] LLM agent returns JSON (not empty/null)
- [ ] No "Failed to parse JSON" errors in logs
- [ ] Pydantic model validation succeeds

### **Test 2: Data Source Coverage** ✅  
**Goal**: Confirm all 11 data sources provide data to Claude

**Steps**:
1. Check logs for sections: "Scraped Content", "Github Data", "Reddit Data", etc.
2. Verify prompt includes all data sources

**Success Criteria**:
- [ ] Scraped Content: Website content extracted
- [ ] Github Data: Stars, forks, contributors visible
- [ ] Reddit Data: Posts from AI subreddits  
- [ ] News Data: Recent articles mentioning tool
- [ ] HackerNews Data: Stories with points/comments
- [ ] StackOverflow Data: Questions with scores
- [ ] ProductHunt Data: Product listings
- [ ] DevTo Data: Articles with reactions
- [ ] NPM Data: Relevant packages only
- [ ] PyPI Data: Relevant packages only  
- [ ] Stock Data: Price info (if applicable)

### **Test 3: Package Relevance Validation** ✅
**Goal**: Verify package searches return relevant results only

**Steps**:
1. Check PyPI results for "Zed" - should NOT include Python ZeroMQ library
2. Check NPM results for "Cursor" - should include relevant packages
3. Look for relevance_score field in package data

**Success Criteria**:
- [ ] No "zed" Python library for Zed editor tool
- [ ] Package descriptions mention the actual tool
- [ ] Relevance scores > 5.0 for included packages

### **Test 4: Structured Intelligence Quality** ✅
**Goal**: Validate extracted intelligence is meaningful

**Steps**:
1. Check database for populated fields
2. Verify descriptions contain actual tool information
3. Confirm metrics match known values (e.g., GitHub stars)

**Success Criteria**:
- [ ] `basic_info.description` has real tool description
- [ ] `community_metrics.github_stars` matches actual repo
- [ ] `technical_details.feature_list` contains real features
- [ ] `company_info` has relevant business data

---

## 📊 Data Collection for Validation

### **What to Collect for Claude Review**

#### **1. Log Files** 
```bash
# Copy the latest log file
cp logs/ai_platform_*.log ./test_results_$(date +%Y%m%d).log

# Extract key sections
grep -A5 -B5 "Agent response preview" logs/ai_platform_*.log > agent_responses.txt
grep "JSON parsing" logs/ai_platform_*.log > json_parsing_results.txt
```

#### **2. Database Export**
```sql
-- Export recent snapshots for review
COPY (
    SELECT 
        t.name as tool_name,
        s.snapshot_date,
        s.processing_status,
        s.basic_info,
        s.community_metrics,
        jsonb_array_length(s.technical_details->'feature_list') as feature_count
    FROM tool_snapshots s
    JOIN ai_tools t ON s.tool_id = t.id
    WHERE s.snapshot_date > NOW() - INTERVAL '1 day'
    ORDER BY s.snapshot_date DESC
) TO '/tmp/test_results.csv' CSV HEADER;
```

#### **3. Sample Data Validation**
```bash
# Create a validation report
python -c "
import json
from database.export_data import export_intelligence_analysis
export_intelligence_analysis()
"

# Copy the export
cp exports/intelligence_analysis.json test_validation_$(date +%Y%m%d).json
```

---

## 🔍 What to Look For

### **🟢 GOOD Signs (Fixes Working)**
- **Log**: "Agent response text length: 5000+" (substantial response)
- **Log**: "JSON parsing successful" 
- **Log**: "Pydantic model validation successful"
- **Database**: Non-null values in basic_info, technical_details, community_metrics
- **Data**: GitHub stars match actual repository numbers
- **Data**: Package names are relevant to the tool being analyzed

### **🔴 BAD Signs (Issues Remain)**
- **Log**: "Agent returned an empty response"
- **Log**: "Failed to parse JSON from agent response"
- **Database**: All structured fields still null/empty
- **Data**: "zed" Python library returned for Zed editor
- **Data**: Package descriptions unrelated to target tool

---

## 📤 What to Send Claude for Validation

### **Required Files**:
1. **Latest log file**: `ai_platform_YYYYMMDD_HHMMSS.log`
2. **Database export**: `test_results.csv` 
3. **Intelligence export**: `test_validation_YYYYMMDD.json`

### **Key Information to Report**:
- **Test Date/Time**: When you ran the tests
- **Tools Tested**: Which AI tools you processed
- **Success/Failure**: Did the tests complete without errors?
- **Unexpected Behavior**: Any strange outputs or errors

### **Quick Summary Template**:
```
Test Results Summary:
- Date: [DATE]
- Tools Tested: [Zed, Cursor, etc.]
- LLM Processing: [SUCCESS/FAILED]
- JSON Parsing: [SUCCESS/FAILED] 
- Database Updates: [SUCCESS/FAILED]
- Data Quality: [GOOD/NEEDS_REVIEW]

Key Observations:
- [Any notable findings]
- [Issues encountered]
- [Unexpected results]

Files Attached:
- logs/ai_platform_*.log
- test_results.csv
- test_validation_*.json
```

---

## 🛠️ Troubleshooting

### **Common Issues & Solutions**

#### **AWS Credentials Error**
```bash
# Check AWS configuration
aws sts get-caller-identity

# If fails, reconfigure
aws configure
```

#### **Database Connection Error**
```bash
# Check PostgreSQL is running
pg_ctl status

# Test connection
psql -h localhost -U your_user -d ai_intelligence_platform -c "SELECT 1;"
```

#### **API Key Issues**
```bash
# Verify API keys are set
echo $FIRECRAWL_API_KEY | head -c 20
echo $GITHUB_API_TOKEN | head -c 20
```

#### **Python Dependencies**
```bash
# Reinstall if needed
pip install --upgrade strands-agents firecrawl-py praw psycopg2
```

---

## ⏱️ Expected Timeline

### **Quick Test (30 minutes)**
- Single tool processing
- Basic log review
- Database check

### **Comprehensive Test (2-3 hours)**
- Multiple tools (3-5)
- Full data validation
- Quality assessment

### **Complete Validation (4-6 hours)**
- All tools in database
- Cross-reference with known data
- Performance analysis

---

## 🎯 Success Definition

**The tests are successful if:**
1. ✅ LLM processing completes without JSON errors
2. ✅ Database contains meaningful structured intelligence (not null/empty)
3. ✅ Package searches return relevant results only
4. ✅ GitHub metrics match actual repository data
5. ✅ Tool descriptions contain real information about the tools

**If any of these fail, provide the logs and data for debugging!**