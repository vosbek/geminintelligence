# AI Intelligence Platform - Web Interface Setup Guide

## 🚀 Initial Setup (Run on target machine)

### 1. Create Next.js Project
```bash
npx create-next-app@latest ai-intelligence-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ai-intelligence-web
```

### 2. Install Required Dependencies
```bash
npm install pg @types/pg react-markdown remark-gfm react-dropzone react-hook-form @hookform/resolvers zod @headlessui/react @heroicons/react
```

### 3. Environment Variables
Create `.env.local`:
```env
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/ai_intelligence_platform
POSTGRES_HOST=localhost
POSTGRES_DB=ai_intelligence_platform
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432

# Upload Directory
UPLOAD_DIR=./public/uploads
```

## 🏗️ Project Structure

```
ai-intelligence-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard)
│   │   ├── tool/
│   │   │   └── [id]/
│   │   │       └── page.tsx (Tool Detail)
│   │   └── api/
│   │       ├── tools/
│   │       │   └── route.ts
│   │       ├── tool/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── upload/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── tool/
│   │   └── curation/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── types/
│       └── database.ts
└── public/
    └── uploads/ (for screenshots)
```

## 📋 Implementation Phases

### Phase 1: Core Infrastructure
1. Database connection setup
2. Basic layout and navigation  
3. Tool overview dashboard
4. API routes for data fetching

### Phase 2: Tool Detail Views
1. Detailed tool page with sections
2. Markdown rendering for intelligence
3. Read-only data display
4. Responsive section layout

### Phase 3: Curation Features
1. Editable fields for manual curation
2. Screenshot upload functionality
3. Enterprise position notes editor
4. Save/update API endpoints

### Phase 4: Polish & Testing
1. Error handling and loading states
2. Search and filtering
3. Form validation
4. Documentation

## 🎯 Key Features to Implement

**Dashboard**: Grid view of all tools with completion status
**Tool Details**: Tabbed view of intelligence sections
**Curation**: Inline editing with markdown preview
**Screenshots**: Drag-and-drop upload with preview
**Enterprise Notes**: Rich text editor for strategic analysis

## 📊 Database Schema Extensions

You'll need to add these tables to the existing PostgreSQL database:

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
    section_name VARCHAR(100) NOT NULL, -- 'basic_info', 'enterprise_notes', etc.
    curated_content JSONB NOT NULL,
    curator_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise positioning table
CREATE TABLE IF NOT EXISTS enterprise_positioning (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id),
    market_position TEXT,
    competitive_advantages TEXT,
    target_enterprises TEXT,
    implementation_complexity TEXT,
    strategic_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔗 Next Steps

1. **Setup**: Run the initial project setup commands
2. **Code Implementation**: I'll provide all the component and API code
3. **Database**: Run the schema extensions
4. **Testing**: Test with your existing AI tools data
5. **Deployment**: Configure for your target environment

Ready to provide the complete code implementation!