#!/usr/bin/env python3
"""
Update database schema with curator tables
"""
import os
import psycopg2
import sys

def update_schema():
    """Add curator tables to existing database"""
    
    # Database connection
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "ai_database"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
    except psycopg2.OperationalError as e:
        print(f"Could not connect to database: {e}")
        sys.exit(1)
    
    curator_tables_sql = """
    -- Table for curated developer tool repositories
    CREATE TABLE IF NOT EXISTS curated_repositories (
        id SERIAL PRIMARY KEY,
        repo_name VARCHAR(255) NOT NULL, -- e.g., 'username/repo-name'
        repo_url VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100), -- agentic-ides, code-generation, mcp-tools, etc.
        language VARCHAR(100),
        stars INTEGER DEFAULT 0,
        forks INTEGER DEFAULT 0,
        stars_this_period INTEGER DEFAULT 0, -- stars gained in curation period
        topics TEXT[], -- GitHub topics as array
        
        -- Scoring and analysis
        developer_relevance_score DECIMAL(3,2) CHECK (developer_relevance_score >= 0.0 AND developer_relevance_score <= 1.0),
        utility_score DECIMAL(3,2) CHECK (utility_score >= 0.0 AND utility_score <= 1.0),
        final_score DECIMAL(3,2) CHECK (final_score >= 0.0 AND final_score <= 1.0),
        
        -- Developer tool specific fields
        mcp_compatible BOOLEAN DEFAULT false,
        installation_method VARCHAR(200), -- 'VS Code Marketplace', 'npm install', 'pip install', etc.
        key_features TEXT[], -- array of key features
        developer_benefits TEXT, -- description of benefits for developers
        
        -- Repository metadata
        first_seen_date DATE,
        last_updated_date DATE,
        last_commit_date DATE,
        issues_count INTEGER DEFAULT 0,
        pull_requests_count INTEGER DEFAULT 0,
        contributors_count INTEGER DEFAULT 0,
        license VARCHAR(100),
        
        -- Analysis metadata
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        curation_period_start DATE,
        curation_period_end DATE,
        curation_type VARCHAR(50), -- 'weekly', 'monthly', 'adhoc'
        
        -- Raw analysis data
        readme_analysis JSONB, -- analysis of README content
        code_analysis JSONB, -- analysis of code structure
        dependency_analysis JSONB, -- analysis of dependencies
        raw_github_data JSONB, -- complete GitHub API response
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(repo_name, curation_period_start)
    );

    -- Indexes for curated repositories
    CREATE INDEX IF NOT EXISTS idx_curated_repositories_category ON curated_repositories(category);
    CREATE INDEX IF NOT EXISTS idx_curated_repositories_final_score ON curated_repositories(final_score DESC);
    CREATE INDEX IF NOT EXISTS idx_curated_repositories_curation_period ON curated_repositories(curation_period_start, curation_period_end);
    CREATE INDEX IF NOT EXISTS idx_curated_repositories_mcp_compatible ON curated_repositories(mcp_compatible);
    CREATE INDEX IF NOT EXISTS idx_curated_repositories_analysis_date ON curated_repositories(analysis_date DESC);

    -- Table for curation run metadata
    CREATE TABLE IF NOT EXISTS curation_runs (
        id SERIAL PRIMARY KEY,
        run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        curation_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'adhoc'
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_repositories_analyzed INTEGER DEFAULT 0,
        repositories_curated INTEGER DEFAULT 0,
        github_api_calls_made INTEGER DEFAULT 0,
        run_status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed'
        error_message TEXT,
        run_config JSONB, -- configuration used for this run
        summary_stats JSONB, -- summary statistics from the run
        notable_trends TEXT[],
        completed_at TIMESTAMP
    );

    -- Trigger to update updated_at timestamp for curated_repositories
    DROP TRIGGER IF EXISTS update_curated_repositories_updated_at ON curated_repositories;
    CREATE TRIGGER update_curated_repositories_updated_at
    BEFORE UPDATE ON curated_repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    """
    
    try:
        with conn.cursor() as cur:
            cur.execute(curator_tables_sql)
        conn.commit()
        print("✅ Curator tables created successfully!")
        
        # Check if tables exist
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('curated_repositories', 'curation_runs')
                ORDER BY table_name
            """)
            tables = cur.fetchall()
            print(f"📋 Curator tables found: {[t[0] for t in tables]}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔧 Updating database schema for curator agent...")
    update_schema()
    print("🎉 Schema update completed!") 