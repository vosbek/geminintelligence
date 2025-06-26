-- Initial data for the ai_tools table

INSERT INTO ai_tools (name, website_url, category, github_url, stock_symbol, run_status)
VALUES
    ('Cursor', 'https://cursor.com', 'AI_IDE', 'https://github.com/getcursor/cursor', NULL, NULL),
    ('Claude Code', 'https://claude.ai', 'AI_ASSISTANT', NULL, NULL, NULL),
    ('GitHub Copilot', 'https://github.com/features/copilot', 'CODE_COMPLETION', 'https://github.com/github/copilot', 'MSFT', NULL),
    ('Replit', 'https://replit.com', 'CLOUD_IDE', 'https://github.com/replit/replit-ai', NULL, NULL),
    ('Augment', 'https://augmentcode.com', 'AI_ASSISTANT', NULL, NULL, NULL),
    ('Zed', 'https://zed.dev', 'EDITOR', 'https://github.com/zed-industries/zed', NULL, NULL);
