# Customer-Facing Schema Integration Guide

## Overview

This guide provides the customer-facing development team with everything needed to build against the final curated snapshots schema. The schema in `customer_facing_schema.sql` represents the clean, validated data structure that customers will consume.

## Schema Architecture

### Data Flow
```
Raw Data Collection → tool_snapshots → [Curation Process] → curated_snapshots → Customer Application
```

### Key Design Principles
1. **Customer-Ready**: All data is cleaned, validated, and ready for public consumption
2. **Structured JSONB**: Flexible but predictable data structures 
3. **Publication Control**: Built-in draft/published workflow
4. **Performance Optimized**: Indexes designed for customer query patterns
5. **SEO Friendly**: URL slugs and search-optimized fields

## Core Tables

### `curated_snapshots`
The main table containing all customer-facing data for AI tools.

**Primary Key**: `id` (UUID)  
**Unique Identifier**: `slug` (URL-friendly string)  
**Publication Control**: `status` ('draft', 'published', 'archived')

## JSONB Field Structures

### `technical_details`
Technical specifications and capabilities
```json
{
  "programming_languages": ["Python", "TypeScript", "JavaScript"],
  "frameworks_used": ["React", "Next.js", "PyTorch"],
  "api_available": true,
  "offline_capable": false,
  "open_source": true,
  "license": "MIT",
  "system_requirements": {
    "minimum_ram": "8GB",
    "supported_os": ["Windows", "macOS", "Linux"]
  },
  "integration_capabilities": ["VS Code", "JetBrains", "CLI"]
}
```

### `company_info`
Business and company information
```json
{
  "company_name": "Anysphere",
  "legal_name": "Anysphere Inc.",
  "founded_year": 2022,
  "headquarters": "San Francisco, CA",
  "funding_stage": "Series A",
  "total_funding": "$60M",
  "key_investors": ["a16z", "OpenAI Startup Fund"],
  "employee_count": "50-100",
  "stock_symbol": null,
  "public_company": false
}
```

### `community_metrics`
Popularity and engagement metrics
```json
{
  "github_stars": 15000,
  "github_forks": 1200,
  "npm_weekly_downloads": 50000,
  "reddit_mentions": 150,
  "twitter_followers": 25000,
  "discord_members": 5000,
  "monthly_active_users": 100000,
  "user_testimonials": [
    {
      "quote": "Amazing tool for productivity",
      "author": "Developer at Google", 
      "source": "Twitter"
    }
  ]
}
```

### `enterprise_positioning`
Strategic positioning for enterprise customers
```json
{
  "primary_use_cases": [
    "Code Generation and Completion",
    "Pair Programming Assistant",
    "Code Review Automation"
  ],
  "target_audience": [
    "Individual Developers",
    "Development Teams", 
    "Enterprise Engineering Organizations"
  ],
  "pricing_model": "Freemium",
  "enterprise_features": [
    "SSO Integration",
    "Admin Dashboard",
    "Usage Analytics",
    "Priority Support"
  ],
  "security_compliance": ["SOC2", "GDPR"],
  "competitive_advantages": [
    "Superior code understanding",
    "Multi-file editing",
    "Local processing option"
  ],
  "implementation_complexity": "Low",
  "roi_potential": "High"
}
```

### `pricing_info`
Structured pricing information
```json
{
  "pricing_model": "Subscription",
  "free_tier": {
    "available": true,
    "limitations": "Limited completions per month"
  },
  "plans": [
    {
      "name": "Pro",
      "price_monthly": 20,
      "price_annual": 200,
      "features": ["Unlimited completions", "Priority support"]
    },
    {
      "name": "Enterprise",
      "price_monthly": "Custom",
      "features": ["SSO", "Admin controls", "Custom models"]
    }
  ]
}
```

### `media_assets`
Visual assets and media
```json
{
  "logo_url": "https://cdn.cursor.sh/logo.png",
  "favicon_url": "https://cursor.sh/favicon.ico", 
  "screenshots": [
    {
      "url": "https://cdn.cursor.sh/screenshot1.jpg",
      "caption": "Main editor interface with AI completions",
      "alt_text": "Cursor editor showing code suggestions"
    }
  ],
  "demo_videos": [
    {
      "url": "https://youtube.com/watch?v=...",
      "title": "Getting Started with Cursor",
      "duration": "3:45"
    }
  ],
  "brand_colors": {
    "primary": "#000000",
    "secondary": "#ffffff"
  }
}
```

## Provided Views

### `published_tools`
Optimized view for tool listings and search results
```sql
SELECT * FROM published_tools 
WHERE category = 'AI_IDE' 
ORDER BY github_stars DESC;
```

### `tool_details`
Complete view for individual tool detail pages
```sql
SELECT * FROM tool_details 
WHERE slug = 'cursor-ai-editor';
```

## Common Query Patterns

### Tool Listing with Pagination
```sql
SELECT 
    slug,
    tool_name,
    short_description,
    category,
    github_stars,
    logo_url
FROM published_tools 
ORDER BY published_at DESC 
LIMIT 20 OFFSET 0;
```

### Category-Based Filtering
```sql
SELECT * FROM published_tools 
WHERE category = 'AI_IDE'
ORDER BY github_stars DESC;
```

### Tag-Based Search
```sql
SELECT * FROM published_tools 
WHERE tags && ARRAY['productivity', 'vscode']
ORDER BY published_at DESC;
```

### Full-Text Search
```sql
SELECT * FROM published_tools 
WHERE to_tsvector('english', tool_name || ' ' || short_description) 
@@ to_tsquery('english', 'code & completion');
```

### Popular Tools by GitHub Stars
```sql
SELECT * FROM published_tools 
WHERE github_stars IS NOT NULL 
ORDER BY github_stars DESC 
LIMIT 10;
```

### Enterprise-Focused Tools
```sql
SELECT 
    slug,
    tool_name,
    enterprise_positioning->'enterprise_features' as features,
    pricing_info->'plans' as pricing_plans
FROM tool_details 
WHERE enterprise_positioning->'enterprise_features' IS NOT NULL;
```

### Tools by Pricing Model
```sql
SELECT * FROM published_tools 
WHERE pricing_info->>'pricing_model' = 'Freemium';
```

## API Response Structure Recommendations

### Tool List Endpoint (`/api/tools`)
```json
{
  "tools": [
    {
      "id": "uuid",
      "slug": "cursor-ai-editor",
      "name": "Cursor",
      "description": "AI-powered code editor",
      "category": "AI_IDE",
      "tags": ["productivity", "vscode"],
      "logo_url": "https://...",
      "github_stars": 15000,
      "published_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Tool Detail Endpoint (`/api/tools/:slug`)
```json
{
  "tool": {
    "id": "uuid",
    "slug": "cursor-ai-editor", 
    "name": "Cursor",
    "short_description": "AI-powered code editor",
    "long_description": "Full description...",
    "website_url": "https://cursor.sh",
    "github_url": "https://github.com/getcursor/cursor",
    "category": "AI_IDE",
    "tags": ["productivity", "vscode"],
    "technical_details": { /* JSONB object */ },
    "company_info": { /* JSONB object */ },
    "community_metrics": { /* JSONB object */ },
    "enterprise_positioning": { /* JSONB object */ },
    "pricing_info": { /* JSONB object */ },
    "media_assets": { /* JSONB object */ },
    "published_at": "2024-01-15T10:00:00Z",
    "last_verified_at": "2024-01-20T15:30:00Z"
  }
}
```

## Performance Considerations

### Indexing Strategy
The schema includes optimized indexes for:
- Published tool listings
- Category filtering
- Tag-based search
- Full-text search
- Popular tools sorting (GitHub stars)
- Company name lookups
- Pricing model filtering

### Caching Recommendations
1. **Tool Lists**: Cache for 1 hour
2. **Tool Details**: Cache for 6 hours  
3. **Search Results**: Cache for 30 minutes
4. **Popular Tools**: Cache for 4 hours

### Query Optimization
- Use the provided views for common queries
- Leverage JSONB indexes for filtering
- Consider materialized views for complex aggregations
- Use LIMIT/OFFSET for pagination

## Data Validation

### Required Fields
- `tool_name`: Always present and non-empty
- `short_description`: Always present for published tools
- `slug`: Unique, URL-safe identifier
- `status`: Must be 'published' for customer visibility

### JSONB Validation
- All JSONB fields can be null (tool might not have all data)
- Check for field existence before accessing nested properties
- Provide sensible defaults for missing data

### Quality Indicators
- `data_quality_score`: 1-5 rating of data completeness
- `last_verified_at`: Timestamp of last validation
- `verification_notes`: Any data quality notes

## Security Considerations

### Data Exposure
- Only published (`status = 'published'`) tools are customer-visible
- `internal_notes` and `curator_id` are for internal use only
- All customer-facing views filter by publication status

### Input Sanitization
- All text fields should be sanitized for XSS
- URLs should be validated before display
- JSONB data should be validated before consumption

## Migration from Current Schema

If migrating from the existing simple `curated_snapshots` table:

```sql
-- Example migration script
INSERT INTO curated_snapshots (
    source_snapshot_id,
    slug,
    tool_name,
    short_description,
    enterprise_positioning,
    media_assets,
    status
)
SELECT 
    snapshot_id,
    lower(regexp_replace(tool_name, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
    tool_name,
    'Curated AI tool', -- placeholder description
    jsonb_build_object('notes', enterprise_position),
    jsonb_build_object('screenshots', screenshots),
    CASE 
        WHEN validation_status = 'approved' THEN 'published'
        ELSE 'draft'
    END
FROM old_curated_snapshots;
```

## Support and Questions

For questions about this schema or integration support:
1. Review the sample queries in `customer_facing_schema.sql`
2. Check the JSONB structure examples above
3. Test queries against the provided views
4. Validate performance with the included indexes

The schema is designed to be flexible while maintaining structure, allowing for rich customer experiences while keeping the data model predictable and performant.