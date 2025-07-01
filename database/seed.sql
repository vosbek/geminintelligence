-- Clear existing data from the tables
TRUNCATE TABLE tool_urls, ai_tools RESTART IDENTITY CASCADE;

-- Initial data for the ai_tools table
INSERT INTO ai_tools (name, description, category, github_url, stock_symbol, company_name, legal_company_name)
VALUES
    ('Cursor', 'The AI Code Editor', 'AI_IDE', 'https://github.com/getcursor/cursor', NULL, 'Anysphere', 'Anysphere Inc.'),
    ('Claude Code', 'A family of foundational AI models that can be used in a variety of applications.', 'AI_ASSISTANT', 'https://github.com/anthropics/claude-code', NULL, 'Anthropic', 'Anthropic PBC'),
    ('GitHub Copilot', 'Your AI pair programmer', 'CODE_COMPLETION', 'https://github.com/features/copilot', 'MSFT', 'Microsoft', 'Microsoft Corporation'),
    ('Replit', 'A collaborative browser-based IDE', 'CLOUD_IDE', 'https://github.com/replit', NULL, 'Replit', 'Replit Inc.'),
    ('Augment', 'Your AI coding partner that helps you code faster and better.', 'AI_ASSISTANT', 'https://github.com/augmentcode', NULL, 'Augment', 'Augment Code Inc.'),
    ('Zed', 'A high-performance, multiplayer code editor from the creators of Atom and Tree-sitter.', 'EDITOR', 'https://github.com/zed-industries/zed', NULL, 'Zed Industries', 'Zed Industries Inc.'),
    ('CLIne', 'Cline is an open-source AI coding assistant with dual Plan/Act modes.', 'EDITOR', 'https://github.com/cline/cline', NULL, 'Cline Bot Inc.', 'Cline Bot Inc.'),
    ('Windsurf', 'The new purpose-built IDE to harness magic', 'EDITOR', 'https://windsurf.com/', NULL, 'Codeium.', 'OpenAI'),
    ('Roo Code', 'Roo Code is an AI-powered autonomous coding agent that lives in your editor.', 'EDITOR', 'https://roocline.dev/', NULL, 'Community', NULL);
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
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Claude Code')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://claude.ai/', 'website' FROM tool
UNION ALL
SELECT id, 'https://www.anthropic.com/claude', 'product_page' FROM tool
UNION ALL
SELECT id, 'https://docs.anthropic.com/en/release-notes/overview', 'release_notes' FROM tool;

-- GitHub Copilot URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'GitHub Copilot')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://github.com/features/copilot', 'website' FROM tool
UNION ALL
SELECT id, 'https://github.blog/ai-and-ml/github-copilot/', 'blog' FROM tool
UNION ALL
SELECT id, 'https://docs.github.com/en/copilot/get-started/what-is-github-copilot', 'docs' FROM tool;

-- Replit URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Replit')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://replit.com/', 'website' FROM tool
UNION ALL
SELECT id, 'https://blog.replit.com/', 'blog' FROM tool
UNION ALL
SELECT id, 'https://replit.com/ai', 'docs' FROM tool;

-- Augment URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Augment')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://www.augmentcode.com/', 'website' FROM tool
UNION ALL
SELECT id, 'https://www.augmentcode.com/blog', 'blog' FROM tool
UNION ALL
SELECT id, 'https://docs.augmentcode.com/introduction', 'docs' FROM tool;

-- Zed URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Zed')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://zed.dev/', 'website' FROM tool
UNION ALL
SELECT id, 'https://zed.dev/blog', 'blog' FROM tool
UNION ALL
SELECT id, 'https://zed.dev/docs/', 'docs' FROM tool;

-- ClIne URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'CLIne')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://cline.bot/', 'website' FROM tool
UNION ALL
SELECT id, 'https://cline.bot/blog', 'blog' FROM tool
UNION ALL
SELECT id, 'https://docs.cline.bot/getting-started/for-new-coders', 'changelog' FROM tool;

-- Windsurf URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Windsurf')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://windsurf.com/', 'website' FROM tool
UNION ALL
SELECT id, 'https://windsurf.com/blog', 'blog' FROM tool
UNION ALL
SELECT id, 'https://windsurf.com/changelog', 'changelog' FROM tool;


-- Roo Code URLs
WITH tool AS (SELECT id FROM ai_tools WHERE name = 'Roo Code')
INSERT INTO tool_urls (tool_id, url, url_type)
SELECT id, 'https://roocline.dev/', 'website' FROM tool
UNION ALL
SELECT id, 'https://roocline.dev/blog/', 'blog' FROM tool
UNION ALL
SELECT id, 'https://github.com/qpd-v/Roo-Code/blob/main/CHANGELOG.md', 'changelog' FROM tool;

