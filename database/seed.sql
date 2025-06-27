-- Clear existing data from the tables
TRUNCATE TABLE tool_urls, ai_tools RESTART IDENTITY CASCADE;

-- Initial data for the ai_tools table
INSERT INTO ai_tools (name, description, category, github_url, stock_symbol)
VALUES
    ('Cursor', 'The AI Code Editor', 'AI_IDE', 'https://github.com/getcursor/cursor', 'NULL');

-- Seed data for tool_urls
-- Note: Using WITH clauses to get the id of the tool by name for clarity and maintainability.

-- Cursor URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Cursor')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://www.cursor.com/', 'website' FROM tool
UNION ALL
SELECT id, 'https://www.cursor.com/blog', 'blog' FROM tool
UNION ALL
SELECT id, 'https://www.cursor.com/changelog', 'changelog' FROM tool;
