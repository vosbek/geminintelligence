# Intelligence Gathering and Tool Onboarding

This document outlines the process for gathering intelligence on AI tools and the steps required to onboard a new tool into our system for automated analysis.

## 1. System Architecture Overview

The intelligence gathering system is composed of three main parts:

1.  **Database**: A PostgreSQL database that stores tool information, raw scraped data, and structured analysis results.
2.  **Scraping and Analysis Engine**: A Python application (`src/main.py`) that uses the `ToolIntelligenceAgent` to orchestrate data collection from various web sources and analyze it using an LLM.
3.  **Web Interface**: A Next.js application for viewing and curating the collected intelligence.

### Data Flow

The process works as follows:

1.  A user adds a new tool to the `ai_tools` table in the database.
2.  Associated URLs for the tool are added to the `tool_urls` table.
3.  The Python engine (`main.py`) periodically queries the database for tools that need processing (`run_status` is `NULL` or `'update'`).
4.  For each tool, the `ToolIntelligenceAgent` performs the following actions:
    *   Scrapes content from all associated URLs (website, blog, docs, etc.).
    *   Fetches data from APIs like GitHub, Reddit, News API, and more.
    *   Aggregates all collected information into a `raw_data_payload`.
5.  The agent constructs a detailed prompt containing the raw data and sends it to a large language model (LLM) for analysis.
6.  The LLM returns a structured JSON object, which is validated against the `ToolSnapshotData` Pydantic model (`src/models.py`).
7.  The structured data and the raw data payload are saved as a new record in the `tool_snapshots` table.
8.  The `run_status` for the tool in the `ai_tools` table is updated to `'processed'`.

## 2. Onboarding a New Tool

To add a new AI tool to the intelligence gathering pipeline, you need to add records to the `ai_tools` and `tool_urls` tables.

### Step 2.1: Add to `ai_tools`

First, insert a new row into the `ai_tools` table.

**Required Fields:**

*   `name`: The common name of the tool (e.g., "Cursor").
*   `description`: A brief, one-sentence description of the tool.

**Optional but Recommended Fields:**

*   `github_url`: The URL to the main GitHub repository.
*   `company_name`: The name of the company that develops the tool.
*   `legal_company_name`: The legal name of the company.
*   `stock_symbol`: The stock market symbol, if it's a public company.
*   `category`: A relevant category (e.g., `AI_IDE`, `CODE_COMPLETION`).

**Example SQL:**

```sql
INSERT INTO ai_tools (name, description, category, github_url, company_name, legal_company_name)
VALUES
    ('New Tool Name', 'A concise description of the new tool.', 'AI_CATEGORY', 'https://github.com/example/repo', 'Example Inc.', 'Example Corporation Inc.');
```

### Step 2.2: Add to `tool_urls`

Next, add all relevant URLs for the tool into the `tool_urls` table. The scraper will process all URLs associated with the tool's `id`.

**Fields:**

*   `tool_id`: The `id` of the tool you just inserted into the `ai_tools` table.
*   `url`: The full URL.
*   `url_type`: A descriptor for the URL's content. Use one of the following:
    *   `website` (main product/company website)
    *   `blog`
    *   `changelog`
    *   `docs`
    *   `pricing`
    *   `careers`
    *   `about`
    *   `release_notes`

**Example SQL:**

```sql
-- Get the ID of the tool you just added
WITH tool AS (
  SELECT id FROM ai_tools WHERE name = 'New Tool Name'
)
INSERT INTO tool_urls (tool_id, url, url_type)
VALUES
    ((SELECT id FROM tool), 'https://example.com', 'website'),
    ((SELECT id FROM tool), 'https://example.com/blog', 'blog'),
    ((SELECT id FROM tool), 'https://example.com/docs', 'docs');
```

## 3. Running the Scraper

Once the tool data is in the database, the intelligence gathering process will automatically pick it up on its next scheduled run.

To trigger a run manually for all tools that need processing, you can execute the main Python script:

```bash
python src/main.py
```

The script will log its progress to the console and to a file in the `logs/` directory.

## 4. Database Queries for Verification

You can query the database directly to check the status of tools and review the collected data.

**Connect to the database using `psql`:**

*Note: The command might need adjustments based on your shell environment. If the path contains spaces, it should be quoted.*

```powershell
& "C:\Program Files\PostgreSQL\11\bin\psql" -U postgres -d ai_database
```

**Check tools waiting to be processed:**

```sql
SELECT id, name, run_status, last_run FROM ai_tools WHERE run_status IS NULL OR run_status = 'update';
```

**View the latest snapshot for a specific tool:**

```sql
SELECT
    s.id AS snapshot_id,
    t.name,
    s.snapshot_date,
    s.processing_status
FROM tool_snapshots s
JOIN ai_tools t ON s.tool_id = t.id
WHERE t.name = 'Cursor'
ORDER BY s.snapshot_date DESC
LIMIT 1;
```

## 5. Addressing Data Inconsistencies

There are known mismatches between the backend data models (Python/Pydantic) and the frontend type definitions (TypeScript). These need to be resolved to ensure the web application functions correctly.

**Key areas of mismatch:**

*   **Optional vs. Required Fields**: Some fields are optional (`Optional[str]`) in the backend but required (`string`) in the frontend. The frontend types should be updated to handle `null` or `undefined` values where appropriate.
*   **Type Definitions**: There are minor differences in type definitions (e.g., `List[str]` vs `string[]`) that are generally compatible, but complex types like `funding_rounds` should be carefully checked.

**Recommendation:**

The TypeScript definitions in `web-implementation/types/database.ts` should be updated to perfectly mirror the Pydantic models in `src/models.py`. Specifically, fields that can be `null` in the database must be marked as optional (e.g., `fieldName?: string;`) in TypeScript. 