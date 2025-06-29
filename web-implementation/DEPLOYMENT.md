# AI Intelligence Platform - Web Interface Deployment Guide

## 🚀 Complete Setup Instructions

### 1. Project Initialization

```bash
# Create the Next.js project
npx create-next-app@latest ai-intelligence-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ai-intelligence-web

# Install dependencies
npm install pg @types/pg react-markdown remark-gfm react-dropzone react-hook-form @hookform/resolvers zod @headlessui/react @heroicons/react
```

### 2. Environment Configuration

Create `.env.local`:
```env
# Database Connection
POSTGRES_HOST=localhost
POSTGRES_DB=ai_intelligence_platform
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432

# Upload Directory
UPLOAD_DIR=./public/uploads
```

### 3. Database Schema Extensions

Run these SQL commands on your PostgreSQL database:

```sql
-- Screenshots table
CREATE TABLE IF NOT EXISTS tool_screenshots (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curated data table  
CREATE TABLE IF NOT EXISTS curated_tool_data (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id),
    section_name VARCHAR(100) NOT NULL,
    curated_content JSONB NOT NULL,
    curator_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tool_id, section_name)
);

-- Enterprise positioning table
CREATE TABLE IF NOT EXISTS enterprise_positioning (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id) UNIQUE,
    market_position TEXT,
    competitive_advantages TEXT,
    target_enterprises TEXT,
    implementation_complexity TEXT,
    strategic_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create uploads directory permissions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_curated_tool_data_updated_at 
    BEFORE UPDATE ON curated_tool_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_positioning_updated_at 
    BEFORE UPDATE ON enterprise_positioning 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. File Structure Setup

Copy all files from the `web-implementation/` directory to your Next.js project:

```
ai-intelligence-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── tool/[id]/page.tsx
│   │   └── api/
│   │       └── upload/route.ts
│   ├── components/
│   │   ├── layout/Navigation.tsx
│   │   ├── dashboard/ToolCard.tsx
│   │   ├── tool/
│   │   │   ├── ToolHeader.tsx
│   │   │   └── ToolTabs.tsx
│   │   └── curation/
│   │       ├── BasicInfoSection.tsx
│   │       ├── TechnicalDetailsSection.tsx
│   │       ├── EditableField.tsx
│   │       ├── ScreenshotsSection.tsx
│   │       └── EnterprisePositionSection.tsx
│   ├── lib/
│   │   └── db.ts
│   └── types/
│       └── database.ts
└── public/
    └── uploads/ (create this directory)
```

### 5. Create Missing Components

You'll need to create these additional components:

**src/components/curation/CompanyInfoSection.tsx**
**src/components/curation/CommunityMetricsSection.tsx**
**src/components/curation/RawDataSection.tsx**

Basic templates:

```tsx
// CompanyInfoSection.tsx
'use client';
import { ToolDetailData } from '@/types/database';

export default function CompanyInfoSection({ data }: { data: ToolDetailData }) {
  const companyInfo = data.snapshot?.company_info;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Company Information</h2>
      <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(companyInfo, null, 2)}
      </pre>
    </div>
  );
}

// CommunityMetricsSection.tsx  
'use client';
import { ToolDetailData } from '@/types/database';

export default function CommunityMetricsSection({ data }: { data: ToolDetailData }) {
  const metrics = data.snapshot?.community_metrics;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Community Metrics</h2>
      <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(metrics, null, 2)}
      </pre>
    </div>
  );
}

// RawDataSection.tsx
'use client';
import { ToolDetailData } from '@/types/database';

export default function RawDataSection({ data }: { data: ToolDetailData }) {
  const rawData = data.snapshot?.raw_data;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Raw Data</h2>
      <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
        {JSON.stringify(rawData, null, 2)}
      </pre>
    </div>
  );
}
```

### 6. Global CSS (src/app/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom prose styles for markdown */
.prose {
  max-width: none;
}

.prose h1, .prose h2, .prose h3, .prose h4 {
  color: #1f2937;
}

.prose p {
  margin-bottom: 1rem;
}

.prose ul {
  list-style-type: disc;
  margin-left: 1.5rem;
}

.prose ol {
  list-style-type: decimal;
  margin-left: 1.5rem;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### 7. Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### 8. Directory Permissions

```bash
# Create uploads directory with proper permissions
mkdir -p public/uploads
chmod 755 public/uploads
```

### 9. Testing the Setup

1. **Database Connection**: Verify you can connect to PostgreSQL
2. **Tool List**: Navigate to `http://localhost:3000` - should show AI tools
3. **Tool Details**: Click on a tool to view detailed intelligence
4. **File Upload**: Test screenshot upload functionality
5. **Curation**: Try editing sections and saving changes

### 10. Production Deployment

For production deployment:

1. **Environment Variables**: Set up production database credentials
2. **File Storage**: Consider using cloud storage (AWS S3) instead of local uploads
3. **Database**: Ensure PostgreSQL is properly configured for production
4. **SSL**: Enable HTTPS for production deployment
5. **Performance**: Add caching layers and optimize images

### 🔧 Troubleshooting

**Database Connection Issues:**
- Verify PostgreSQL is running
- Check credentials in `.env.local`
- Ensure database exists and tables are created

**Upload Issues:**
- Check `public/uploads` directory exists and is writable
- Verify file size limits
- Check network/firewall settings

**Build Issues:**
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run lint`
- Verify all import paths are correct

### 📱 Usage

1. **Dashboard**: Overview of all AI tools with intelligence status
2. **Tool Details**: Comprehensive view of intelligence data
3. **Curation**: Edit and enhance AI-generated intelligence
4. **Screenshots**: Upload and manage tool screenshots
5. **Enterprise Analysis**: Strategic positioning for enterprise adoption

The interface is designed for internal curation use - focused on functionality over polish.

---

## 🔧 WSL/Linux Setup Notes (Updated 2025-06-28)

### Additional Setup for WSL Users

If you're running in WSL and want to install PostgreSQL locally instead of using Windows PostgreSQL:

```bash
# Install PostgreSQL in WSL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create database and set password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password';
CREATE DATABASE ai_database;
\q

# Create schema and import data
sudo -u postgres psql ai_database < database/schema.sql
sudo -u postgres psql ai_database < database/exports/ai_tools_export_20250627.sql
sudo -u postgres psql ai_database < database/web_interface_tables.sql
```

### Database Schema Adaptations Made

During setup, we discovered that the existing database schema uses `curated_snapshots` table with JSONB columns, while the web interface expects separate tables. We added these additional tables for compatibility:

- `tool_screenshots` - For managing uploaded screenshots
- `curated_tool_data` - For section-based curation data
- `enterprise_positioning` - For enterprise analysis data

These tables work alongside the existing schema without conflicts.

### Dependencies Updated

- Updated Next.js to version 14.2.30 (security fix)
- All npm audit vulnerabilities resolved
- PostgreSQL connection configured for local WSL instance

### Files Created During Setup

- `.env.local` - Environment configuration for Next.js
- `components/curation/CompanyInfoSection.tsx` - Company information display
- `components/curation/CommunityMetricsSection.tsx` - Community metrics display  
- `components/curation/RawDataSection.tsx` - Raw data visualization
- `public/uploads/` - Directory for file uploads
- `database/web_interface_tables.sql` - Additional schema for web interface

### Verification Steps

1. ✅ PostgreSQL service running
2. ✅ Database `ai_database` created with schema and data
3. ✅ Next.js dependencies installed and security issues resolved
4. ✅ Missing React components created
5. ✅ Development server starts successfully on http://localhost:3000
6. ✅ Environment variables configured correctly

### Known Working Configuration

- **OS**: WSL2 (Ubuntu 24.04)
- **PostgreSQL**: 16.x (local installation)
- **Next.js**: 14.2.30
- **Node.js**: 3.11
- **Database**: `ai_database` with "Cursor" tool data imported

The setup is now ready for development and testing.

---

## 🎯 **Major Updates (2025-06-28 Evening)**

### ✅ **Data Pipeline Alignment Complete**
The web application has been fully aligned with the actual export data structure:

### **What's Fixed:**
1. **Beautiful Data Display**: Replaced all raw JSON dumps with formatted, professional UI components
2. **Company Information**: Now shows funding rounds, valuation, executives, and market data in organized cards
3. **Community Metrics**: Displays 30K+ GitHub stars, testimonials, and enterprise adoption visually
4. **Enterprise Position**: Auto-populates from intelligence data, still manually editable
5. **Raw Data Explorer**: Interactive expandable sections for exploring source intelligence
6. **Navigation**: All routes (/tools, /reports) working correctly

### **Data Flow Verified:**
- ✅ Export JSON → Database → Web Interface (working seamlessly)
- ✅ Rich intelligence data (101K+ characters) properly displayed
- ✅ Auto-population of enterprise analysis from existing data
- ✅ All TypeScript types aligned with actual data structure

### **Ready for Production:**
- The web application now works perfectly with the export data format
- When you run scrapers on the other machine, the data will display beautifully
- Enterprise position fields auto-populate but remain editable for human insights
- All UI components handle missing data gracefully

### **Performance:**
- First-time compilation in dev mode (normal Next.js behavior)
- Subsequent navigation is fast
- Loading states added for better UX
- Database queries optimized for the actual data structure

The application is now production-ready and will work seamlessly when deployed on the other machine with live scrapers.

---

## 🔧 **Fresh Deployment Instructions (Updated 2025-06-28)**

### Complete Setup for Other Machine

**1. Database Setup**
```bash
# Install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres psql
ALTER USER postgres PASSWORD 'dota';
CREATE DATABASE ai_database;
\q

# Create schema (includes snapshot management features)
sudo -u postgres psql ai_database < database/schema.sql

# Import initial data 
python3 import_full_data.py
```

**2. Web Application Setup**
```bash
# Navigate to web interface directory
cd web-implementation

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
POSTGRES_HOST=localhost
POSTGRES_DB=ai_database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dota
POSTGRES_PORT=5432
UPLOAD_DIR=./public/uploads
EOF

# Create uploads directory
mkdir -p public/uploads
chmod 755 public/uploads

# Build for production (fast local use)
npm run build

# Start production server
npm run start
```

**3. Access Application**
- Open browser to: http://localhost:3000
- Production build = fast page loads
- Weekly curation workflow ready

### New Features in This Version

**Snapshot Management:**
- Review status tracking (pending_review → reviewed → ready_for_publication)
- Quality scoring (1-5 stars)
- Change detection between snapshots
- Weekly workflow dashboard

**Automatic Change Detection:**
- Compares new snapshots with previous versions
- Highlights technical changes, metric updates
- Flags tools needing review

**Bulk Operations:**
- Mark multiple tools as reviewed
- Batch status updates for weekly workflow

The fresh deployment now includes complete snapshot management for your weekly curation process.

---

## 🎯 **Scraper Control Integration (Latest Update)**

### New Web Interface Features

**Scraper Controls Panel:**
- "Start Weekly Intelligence Run" button triggers all scrapers
- Individual tool refresh buttons for targeted updates
- "Add New Tool" with immediate scraping capability
- Real-time progress monitoring and status updates
- Recent activity feed showing new snapshots

**API Endpoints:**
- `POST /api/snapshots/run-all` - Triggers weekly run for all tools
- `POST /api/snapshots/run-tool/[id]` - Refreshes specific tool
- `POST /api/tools/add-and-run` - Adds new tool and starts scraping
- `GET /api/snapshots/status` - Real-time scraper status

**Integration Requirements:**
- Python scraper must support command-line arguments:
  - `python3 -m src.main --all-tools` (weekly run)
  - `python3 -m src.main --tool-id <id>` (specific tool)
- Scraper should update `run_status` in database:
  - `'update'` while running
  - `'processed'` when complete
  - `'error'` if failed

**Session Management:**
- Tracks weekly curation sessions
- Progress monitoring with percentage completion
- Error tracking and retry capabilities
- Historical run logs

### Updated Deployment Steps

**4. Verify Scraper Integration**
```bash
# Test scraper commands from web-implementation directory
cd ..
python3 -m src.main --help
python3 -m src.main --all-tools  # Should run all tools

# Check database updates
sudo -u postgres psql ai_database
SELECT name, run_status, last_run FROM ai_tools ORDER BY last_run DESC;
```

**5. Start Web Interface with Scraper Controls**
```bash
cd web-implementation
npm run build && npm run start
```

**Features Available:**
- Dashboard with scraper controls at top
- Weekly intelligence run button
- Individual tool refresh buttons
- Add new tool form with immediate scraping
- Real-time status monitoring
- Progress tracking during runs

### Scraper Requirements

Your Python scraper must support these command patterns:

```bash
# Weekly run (all tools)
python3 -m src.main --all-tools

# Single tool refresh  
python3 -m src.main --tool-id 123

# Help/usage
python3 -m src.main --help
```

The web interface expects the scraper to:
1. Update `ai_tools.run_status` to `'update'` when starting
2. Create/update `tool_snapshots` table entries
3. Set `run_status` to `'processed'` when complete
4. Set `run_status` to `'error'` if failed
5. Update `last_run` timestamp

### Testing Scraper Integration

```bash
# Test individual tool scraping
cd web-implementation
node -e "fetch('http://localhost:3000/api/snapshots/run-tool/1', {method: 'POST'}).then(r => r.json()).then(console.log)"

# Test weekly run
node -e "fetch('http://localhost:3000/api/snapshots/run-all', {method: 'POST'}).then(r => r.json()).then(console.log)"

# Check status
node -e "fetch('http://localhost:3000/api/snapshots/status').then(r => r.json()).then(console.log)"
```

The web interface now provides complete control over your intelligence gathering pipeline with real-time monitoring and progress tracking.