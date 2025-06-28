\echo 'Populating ai_tools...'
INSERT INTO "ai_tools" (id, name, description, github_url, stock_symbol, category, company_name, legal_company_name, status, run_status, last_run, created_at, updated_at) VALUES (1, 'Cursor', 'The AI Code Editor', 'https://github.com/getcursor/cursor', NULL, 'AI_IDE', 'Anysphere', 'Anysphere Inc.', 'active', 'processed', '2025-06-27T21:42:46.360813'::timestamp, '2025-06-27T21:02:54.155254'::timestamp, '2025-06-27T21:42:46.361295'::timestamp);

\echo 'Populating curated_snapshots...'
\echo 'Populating data_sources...'
\echo 'Populating tool_snapshots...'
