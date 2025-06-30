-- =================================================================
--  AI Intelligence Platform - Customer-Facing Schema
--  Final Curated Snapshots Table for Customer Application
-- =================================================================
--
-- This schema is designed for the customer-facing application team.
-- It represents the final, curated data structure that customers will
-- consume through the public-facing web application.
--
-- Source: Generated from deep project analysis using Gemini CLI
-- Date: 2025-06-29
-- Purpose: Provide clean, structured data for customer consumption
--

-- =================================================================
--  Helper Functions
-- =================================================================

-- Function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- =================================================================
--  Main Curated Snapshots Table
-- =================================================================

-- This table stores the cleaned, verified, and curated data for AI tools,
-- ready for public consumption. It is the result of the internal curation
-- process performed on the raw data from the 'tool_snapshots' table.
CREATE TABLE curated_snapshots (
    -- === Core Identifiers ===
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_snapshot_id INTEGER REFERENCES tool_snapshots(id) ON DELETE SET NULL,
    -- A user-friendly slug for URLs, e.g., 'cursor-ai-editor'
    slug TEXT NOT NULL UNIQUE,

    -- === Publication Control ===
    -- Controls the visibility of the snapshot in the customer app
    -- 'draft': In progress, not visible to customers
    -- 'published': Visible to customers in the public application
    -- 'archived': No longer listed but kept for historical records
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,

    -- === Basic Information (Curated) ===
    -- Clean, customer-ready basic information about the tool
    tool_name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    long_description TEXT,
    website_url TEXT,
    github_url TEXT,
    category TEXT, -- Primary category: AI_IDE, CODE_COMPLETION, etc.
    tags TEXT[], -- Additional tags for filtering and search

    -- === Technical Details (JSONB) ===
    -- Structured technical information about the tool
    -- Expected structure:
    -- {
    --   "programming_languages": ["Python", "TypeScript", "JavaScript"],
    --   "frameworks_used": ["React", "Next.js", "PyTorch"],
    --   "api_available": true,
    --   "offline_capable": false,
    --   "open_source": true,
    --   "license": "MIT",
    --   "system_requirements": {
    --     "minimum_ram": "8GB",
    --     "supported_os": ["Windows", "macOS", "Linux"]
    --   },
    --   "integration_capabilities": ["VS Code", "JetBrains", "CLI"]
    -- }
    technical_details JSONB,

    -- === Company & Business Information (JSONB) ===
    -- Curated company and business model information
    -- Expected structure:
    -- {
    --   "company_name": "Anysphere",
    --   "legal_name": "Anysphere Inc.",
    --   "founded_year": 2022,
    --   "headquarters": "San Francisco, CA",
    --   "funding_stage": "Series A",
    --   "total_funding": "$60M",
    --   "key_investors": ["a16z", "OpenAI Startup Fund"],
    --   "employee_count": "50-100",
    --   "stock_symbol": null,
    --   "public_company": false
    -- }
    company_info JSONB,

    -- === Community & Popularity Metrics (JSONB) ===
    -- Key metrics showing the tool's popularity and community engagement
    -- Expected structure:
    -- {
    --   "github_stars": 15000,
    --   "github_forks": 1200,
    --   "npm_weekly_downloads": 50000,
    --   "reddit_mentions": 150,
    --   "twitter_followers": 25000,
    --   "discord_members": 5000,
    --   "monthly_active_users": 100000,
    --   "user_testimonials": [
    --     {
    --       "quote": "Amazing tool for productivity",
    --       "author": "Developer at Google",
    --       "source": "Twitter"
    --     }
    --   ]
    -- }
    community_metrics JSONB,

    -- === Enterprise Positioning (JSONB) ===
    -- Strategic positioning and use case information for enterprise customers
    -- Expected structure:
    -- {
    --   "primary_use_cases": [
    --     "Code Generation and Completion",
    --     "Pair Programming Assistant",
    --     "Code Review Automation"
    --   ],
    --   "target_audience": [
    --     "Individual Developers",
    --     "Development Teams",
    --     "Enterprise Engineering Organizations"
    --   ],
    --   "pricing_model": "Freemium",
    --   "enterprise_features": [
    --     "SSO Integration",
    --     "Admin Dashboard", 
    --     "Usage Analytics",
    --     "Priority Support"
    --   ],
    --   "security_compliance": ["SOC2", "GDPR"],
    --   "competitive_advantages": [
    --     "Superior code understanding",
    --     "Multi-file editing",
    --     "Local processing option"
    --   ],
    --   "implementation_complexity": "Low",
    --   "roi_potential": "High"
    -- }
    enterprise_positioning JSONB,

    -- === Pricing Information (JSONB) ===
    -- Structured pricing information for customers
    -- Expected structure:
    -- {
    --   "pricing_model": "Subscription",
    --   "free_tier": {
    --     "available": true,
    --     "limitations": "Limited completions per month"
    --   },
    --   "plans": [
    --     {
    --       "name": "Pro",
    --       "price_monthly": 20,
    --       "price_annual": 200,
    --       "features": ["Unlimited completions", "Priority support"]
    --     },
    --     {
    --       "name": "Enterprise",
    --       "price_monthly": "Custom",
    --       "features": ["SSO", "Admin controls", "Custom models"]
    --     }
    --   ]
    -- }
    pricing_info JSONB,

    -- === Media Assets (JSONB) ===
    -- URLs and metadata for visual assets and media
    -- Expected structure:
    -- {
    --   "logo_url": "https://cdn.cursor.sh/logo.png",
    --   "favicon_url": "https://cursor.sh/favicon.ico",
    --   "screenshots": [
    --     {
    --       "url": "https://cdn.cursor.sh/screenshot1.jpg",
    --       "caption": "Main editor interface with AI completions",
    --       "alt_text": "Cursor editor showing code suggestions"
    --     }
    --   ],
    --   "demo_videos": [
    --     {
    --       "url": "https://youtube.com/watch?v=...",
    --       "title": "Getting Started with Cursor",
    --       "duration": "3:45"
    --     }
    --   ],
    --   "brand_colors": {
    --     "primary": "#000000",
    --     "secondary": "#ffffff"
    --   }
    -- }
    media_assets JSONB,

    -- === Quality & Validation Metadata ===
    -- Information about the curation and validation process
    data_quality_score INTEGER CHECK (data_quality_score >= 1 AND data_quality_score <= 5),
    last_verified_at TIMESTAMPTZ,
    verification_notes TEXT,

    -- === Curation Tracking ===
    -- Internal metadata for tracking the curation process
    curator_id TEXT, -- ID of the person who curated this entry
    internal_notes TEXT, -- Internal curation notes (not visible to customers)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =================================================================
--  Triggers
-- =================================================================

-- Automatically update 'updated_at' timestamp on any change
CREATE TRIGGER trigger_update_curated_snapshots_updated_at
BEFORE UPDATE ON curated_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
--  Indexes for Performance
-- =================================================================

-- Primary lookup indexes
CREATE INDEX idx_curated_snapshots_status_published 
ON curated_snapshots(status, published_at DESC) 
WHERE status = 'published';

CREATE INDEX idx_curated_snapshots_slug 
ON curated_snapshots(slug) 
WHERE status = 'published';

CREATE INDEX idx_curated_snapshots_category 
ON curated_snapshots(category, published_at DESC) 
WHERE status = 'published';

-- Search and filtering indexes
CREATE INDEX idx_curated_snapshots_tags 
ON curated_snapshots USING GIN(tags) 
WHERE status = 'published';

CREATE INDEX idx_curated_snapshots_tool_name 
ON curated_snapshots USING GIN(to_tsvector('english', tool_name || ' ' || short_description));

-- JSONB field indexes for common queries
CREATE INDEX idx_curated_snapshots_company_name 
ON curated_snapshots USING BTREE ((company_info->>'company_name'));

CREATE INDEX idx_curated_snapshots_github_stars 
ON curated_snapshots USING BTREE (((community_metrics->>'github_stars')::integer)) 
WHERE community_metrics->>'github_stars' IS NOT NULL;

CREATE INDEX idx_curated_snapshots_pricing_model 
ON curated_snapshots USING BTREE ((pricing_info->>'pricing_model'));

-- =================================================================
--  Views for Customer Application
-- =================================================================

-- Simple view for listing published tools
CREATE VIEW published_tools AS
SELECT 
    id,
    slug,
    tool_name,
    short_description,
    category,
    tags,
    published_at,
    (community_metrics->>'github_stars')::integer as github_stars,
    (media_assets->>'logo_url') as logo_url
FROM curated_snapshots 
WHERE status = 'published'
ORDER BY published_at DESC;

-- Detailed view for individual tool pages
CREATE VIEW tool_details AS
SELECT 
    id,
    slug,
    tool_name,
    short_description,
    long_description,
    website_url,
    github_url,
    category,
    tags,
    technical_details,
    company_info,
    community_metrics,
    enterprise_positioning,
    pricing_info,
    media_assets,
    published_at,
    last_verified_at
FROM curated_snapshots 
WHERE status = 'published';

-- =================================================================
--  Sample Queries for Customer Application
-- =================================================================

-- Example: Get all published AI IDE tools
-- SELECT * FROM published_tools WHERE category = 'AI_IDE';

-- Example: Search tools by name or description
-- SELECT * FROM published_tools WHERE to_tsvector('english', tool_name || ' ' || short_description) @@ to_tsquery('english', 'code & completion');

-- Example: Get tools with specific tags
-- SELECT * FROM published_tools WHERE tags && ARRAY['productivity', 'vscode'];

-- Example: Get most popular tools by GitHub stars
-- SELECT * FROM published_tools WHERE github_stars IS NOT NULL ORDER BY github_stars DESC LIMIT 10;

-- Example: Get detailed information for a specific tool
-- SELECT * FROM tool_details WHERE slug = 'cursor-ai-editor';

-- =================================================================
--  Table Comments
-- =================================================================

COMMENT ON TABLE curated_snapshots IS 'Final curated data for AI tools, ready for customer-facing application consumption';
COMMENT ON COLUMN curated_snapshots.slug IS 'URL-friendly identifier derived from tool name, used in customer application URLs';
COMMENT ON COLUMN curated_snapshots.status IS 'Publication status controlling visibility in customer application';
COMMENT ON COLUMN curated_snapshots.source_snapshot_id IS 'Reference to original raw data in tool_snapshots table';
COMMENT ON COLUMN curated_snapshots.technical_details IS 'JSONB containing structured technical specifications and capabilities';
COMMENT ON COLUMN curated_snapshots.company_info IS 'JSONB containing business and company information';
COMMENT ON COLUMN curated_snapshots.community_metrics IS 'JSONB containing popularity and community engagement metrics';
COMMENT ON COLUMN curated_snapshots.enterprise_positioning IS 'JSONB containing enterprise use cases and strategic positioning';
COMMENT ON COLUMN curated_snapshots.pricing_info IS 'JSONB containing structured pricing and plan information';
COMMENT ON COLUMN curated_snapshots.media_assets IS 'JSONB containing URLs and metadata for logos, screenshots, and media';