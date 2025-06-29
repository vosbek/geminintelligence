-- Additional tables needed by the web interface
-- These are in addition to the existing schema

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

-- Update triggers for timestamp columns
CREATE TRIGGER update_curated_tool_data_updated_at 
    BEFORE UPDATE ON curated_tool_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_positioning_updated_at 
    BEFORE UPDATE ON enterprise_positioning 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Simple import of snapshot data with new curation fields
-- Import the tool snapshot data from JSON (this is a simple version)
INSERT INTO tool_snapshots (
    tool_id, snapshot_date, basic_info, technical_details, company_info, 
    community_metrics, raw_data, processing_status, review_status, 
    quality_score, ready_for_publication
)
SELECT 1, '2025-06-27T21:42:46.336739'::timestamp, 
       '{"description": "Cursor is an AI-powered code editor designed to make developers extraordinarily productive.", "category_classification": "AI_IDE"}'::jsonb,
       '{"features": ["AI code completion", "Natural language editing", "Multi-language support"], "pricing": "Free tier available"}'::jsonb,
       '{"name": "Anysphere", "founded": "2022", "funding": "Series A"}'::jsonb,
       '{"github_stars": 20000, "reddit_mentions": 500}'::jsonb,
       '{}'::jsonb,
       'completed',
       'pending_review',  -- Default review status for new imports
       NULL,             -- No quality score initially
       false             -- Not ready for publication until reviewed
WHERE NOT EXISTS (SELECT 1 FROM tool_snapshots WHERE tool_id = 1);

\echo 'Web interface tables created successfully!';