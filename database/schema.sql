-- Database schema for the AI Intelligence Platform

DROP TABLE IF EXISTS enterprise_positioning CASCADE;
DROP TABLE IF EXISTS curated_tool_data CASCADE;
DROP TABLE IF EXISTS tool_screenshots CASCADE;
DROP TABLE IF EXISTS curation_sessions CASCADE;
DROP TABLE IF EXISTS snapshot_changes CASCADE;
DROP TABLE IF EXISTS curated_snapshots CASCADE;
DROP TABLE IF EXISTS tool_snapshots CASCADE;
DROP TABLE IF EXISTS tool_urls CASCADE;
DROP TABLE IF EXISTS ai_tools CASCADE;
DROP TABLE IF EXISTS data_sources CASCADE;

-- Table to store information about the AI tools to be tracked
CREATE TABLE ai_tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    github_url VARCHAR(500),
    stock_symbol VARCHAR(20),
    category VARCHAR(100),
    company_name VARCHAR(255), -- The actual company name (e.g., "Anysphere" for Cursor)
    legal_company_name VARCHAR(255), -- Legal entity name (e.g., "Anysphere Inc.")
    status VARCHAR(50) DEFAULT 'active',
    run_status VARCHAR(50) DEFAULT NULL, -- null=never_run, update=needs_run, processed=completed
    last_run TIMESTAMP,
    error_message TEXT, -- To store the error message if a run fails
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store multiple URLs for each tool
CREATE TABLE tool_urls (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER NOT NULL REFERENCES ai_tools(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    url_type VARCHAR(50) NOT NULL, -- e.g., 'website', 'blog', 'changelog', 'release_notes'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tool_id, url_type)
);

-- Table to store snapshots of data collected for each tool at a point in time
CREATE TABLE tool_snapshots (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMP NOT NULL,
    basic_info JSONB,
    technical_details JSONB,
    company_info JSONB,
    community_metrics JSONB,
    raw_data JSONB,
    processing_status VARCHAR(50) DEFAULT 'processing',
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Snapshot management fields for weekly curation workflow
    review_status VARCHAR(50) DEFAULT 'pending_review',
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    curator_notes TEXT,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    changes_detected BOOLEAN DEFAULT false,
    ready_for_publication BOOLEAN DEFAULT false
);

-- Table to store curated data and analysis on top of snapshots
CREATE TABLE curated_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_id INTEGER REFERENCES tool_snapshots(id) ON DELETE CASCADE,
    curator_notes TEXT,
    enterprise_position TEXT,
    screenshots JSONB,
    videos JSONB,
    strategic_alignment TEXT,
    validation_status VARCHAR(50) DEFAULT 'pending',
    curated_by VARCHAR(100),
    curated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to configure various data sources used for collection
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(100),
    source_name VARCHAR(255),
    source_url VARCHAR(500),
    api_endpoint VARCHAR(500),
    configuration JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update the updated_at timestamp on ai_tools table
CREATE TRIGGER update_ai_tools_updated_at
BEFORE UPDATE ON ai_tools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Additional tables for snapshot management and weekly curation workflow

-- Create table for tracking snapshot changes
CREATE TABLE snapshot_changes (
    id SERIAL PRIMARY KEY,
    snapshot_id INTEGER REFERENCES tool_snapshots(id) ON DELETE CASCADE,
    previous_snapshot_id INTEGER REFERENCES tool_snapshots(id) ON DELETE SET NULL,
    change_type VARCHAR(50) NOT NULL, -- 'new_feature', 'metric_change', 'content_update', etc.
    field_name VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_summary TEXT,
    significance_level INTEGER DEFAULT 1 CHECK (significance_level >= 1 AND significance_level <= 5),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create weekly curation sessions table
CREATE TABLE curation_sessions (
    id SERIAL PRIMARY KEY,
    session_date DATE NOT NULL,
    tools_reviewed INTEGER DEFAULT 0,
    tools_approved INTEGER DEFAULT 0,
    session_notes TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for better performance on status queries
CREATE INDEX idx_tool_snapshots_review_status ON tool_snapshots(review_status);
CREATE INDEX idx_tool_snapshots_ready_for_publication ON tool_snapshots(ready_for_publication);
CREATE INDEX idx_tool_snapshots_tool_date ON tool_snapshots(tool_id, snapshot_date DESC);
CREATE INDEX idx_snapshot_changes_snapshot_id ON snapshot_changes(snapshot_id);

-- Function to detect changes between snapshots
CREATE OR REPLACE FUNCTION detect_snapshot_changes(new_snapshot_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    changes_count INTEGER := 0;
    prev_snapshot_id INTEGER;
    current_snapshot RECORD;
    previous_snapshot RECORD;
BEGIN
    -- Get the current snapshot
    SELECT * INTO current_snapshot FROM tool_snapshots WHERE id = new_snapshot_id;
    
    -- Find the previous snapshot for the same tool
    SELECT id INTO prev_snapshot_id 
    FROM tool_snapshots 
    WHERE tool_id = current_snapshot.tool_id 
      AND snapshot_date < current_snapshot.snapshot_date 
    ORDER BY snapshot_date DESC 
    LIMIT 1;
    
    IF prev_snapshot_id IS NOT NULL THEN
        SELECT * INTO previous_snapshot FROM tool_snapshots WHERE id = prev_snapshot_id;
        
        -- Check technical details changes
        IF current_snapshot.technical_details != previous_snapshot.technical_details THEN
            INSERT INTO snapshot_changes (snapshot_id, previous_snapshot_id, change_type, field_name, old_value, new_value, change_summary)
            VALUES (new_snapshot_id, prev_snapshot_id, 'content_update', 'technical_details', 
                   previous_snapshot.technical_details, current_snapshot.technical_details, 
                   'Technical details updated');
            changes_count := changes_count + 1;
        END IF;
        
        -- Check community metrics changes
        IF current_snapshot.community_metrics != previous_snapshot.community_metrics THEN
            INSERT INTO snapshot_changes (snapshot_id, previous_snapshot_id, change_type, field_name, old_value, new_value, change_summary)
            VALUES (new_snapshot_id, prev_snapshot_id, 'metric_change', 'community_metrics', 
                   previous_snapshot.community_metrics, current_snapshot.community_metrics, 
                   'Community metrics updated');
            changes_count := changes_count + 1;
        END IF;
        
        -- Mark snapshot as having changes if any were detected
        IF changes_count > 0 THEN
            UPDATE tool_snapshots SET changes_detected = true WHERE id = new_snapshot_id;
        END IF;
    END IF;
    
    RETURN changes_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically detect changes when new snapshots are added
CREATE OR REPLACE FUNCTION trigger_detect_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run change detection if this is a new snapshot (not an update)
    IF TG_OP = 'INSERT' THEN
        PERFORM detect_snapshot_changes(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to tool_snapshots table
CREATE TRIGGER detect_changes_trigger
    AFTER INSERT ON tool_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION trigger_detect_changes();

-- ================================================================= 
-- Additional tables required by web application
-- =================================================================

-- Table to store tool screenshots uploaded through the web interface
CREATE TABLE tool_screenshots (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store curated tool data sections managed through the web interface
CREATE TABLE curated_tool_data (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    curated_content JSONB NOT NULL,
    curator_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tool_id, section_name)
);

-- Table to store enterprise positioning data for tools
CREATE TABLE enterprise_positioning (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES ai_tools(id) ON DELETE CASCADE,
    market_position TEXT,
    competitive_advantages TEXT,
    target_enterprises TEXT,
    implementation_complexity TEXT,
    strategic_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tool_id)
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_curated_tool_data_updated_at
BEFORE UPDATE ON curated_tool_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_positioning_updated_at
BEFORE UPDATE ON enterprise_positioning
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for web application performance
CREATE INDEX idx_tool_screenshots_tool_id ON tool_screenshots(tool_id);
CREATE INDEX idx_curated_tool_data_tool_id ON curated_tool_data(tool_id);
CREATE INDEX idx_enterprise_positioning_tool_id ON enterprise_positioning(tool_id);

-- Add helpful view for the curation workflow
CREATE VIEW weekly_review_summary AS
SELECT 
    t.id as tool_id,
    t.name as tool_name,
    ts.id as snapshot_id,
    ts.snapshot_date,
    ts.review_status,
    ts.quality_score,
    ts.changes_detected,
    ts.ready_for_publication,
    COALESCE(sc.change_count, 0) as changes_count
FROM ai_tools t
LEFT JOIN LATERAL (
    SELECT * FROM tool_snapshots 
    WHERE tool_id = t.id 
    ORDER BY snapshot_date DESC 
    LIMIT 1
) ts ON true
LEFT JOIN (
    SELECT snapshot_id, COUNT(*) as change_count
    FROM snapshot_changes 
    GROUP BY snapshot_id
) sc ON sc.snapshot_id = ts.id
ORDER BY ts.changes_detected DESC, ts.snapshot_date DESC;
