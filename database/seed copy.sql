-- Clear existing data from the tables
TRUNCATE TABLE tool_urls, ai_tools RESTART IDENTITY CASCADE;

-- Initial data for the ai_tools table
INSERT INTO ai_tools (name, description, category, github_url, stock_symbol, company_name, legal_company_name)
VALUES
    ('Cursor', 'The AI Code Editor', 'AI_IDE', 'https://github.com/getcursor/cursor', NULL, 'Anysphere', 'Anysphere Inc.'),
    ('Claude', 'A family of foundational AI models that can be used in a variety of applications.', 'AI_ASSISTANT', 'https://github.com/anthropics/claude-code', NULL, 'Anthropic', 'Anthropic PBC'),
    ('GitHub Copilot', 'Your AI pair programmer', 'CODE_COMPLETION', 'https://github.com/features/copilot', 'MSFT', 'Microsoft', 'Microsoft Corporation'),
    ('Replit', 'A collaborative browser-based IDE', 'CLOUD_IDE', 'https://github.com/replit', NULL, 'Replit', 'Replit Inc.'),
    ('Augment', 'Your AI coding partner that helps you code faster and better.', 'AI_ASSISTANT', 'https://github.com/augmentcode', NULL, 'Augment', 'Augment Code Inc.'),
    ('Zed', 'A high-performance, multiplayer code editor from the creators of Atom and Tree-sitter.', 'EDITOR', 'https://github.com/zed-industries/zed', NULL, 'Zed Industries', 'Zed Industries Inc.');

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

-- Claude URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Claude')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://claude.ai/', 'website' FROM tool
UNION ALL
SELECT id, 'https://www.anthropic.com/claude', 'product_page' FROM tool
UNION ALL
SELECT id, 'https://docs.anthropic.com/en/release-notes/overview', 'release_notes' FROM tool;

-- GitHub Copilot URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'GitHub Copilot')
INSERT INTO tool_urls (tool_id, url, url_type)
VALUES ((SELECT id FROM tool), 'https://github.com/features/copilot', 'website');

-- Replit URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Replit')
INSERT INTO tool_urls (tool_id, url, url_type)
VALUES ((SELECT id FROM tool), 'https://replit.com', 'website');

-- Augment URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Augment')
INSERT INTO tool_urls (tool_id, url, url_type)
VALUES ((SELECT id FROM tool), 'https://augmentcode.com', 'website');

-- Zed URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Zed')
INSERT INTO tool_urls (tool_id, url, url_type)
VALUES ((SELECT id FROM tool), 'https://zed.dev', 'website');
