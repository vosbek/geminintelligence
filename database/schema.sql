-- Database schema for the AI Intelligence Platform

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
