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