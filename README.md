# AI Intelligence Platform

## Project Overview

This project is a comprehensive, database-driven system that automatically collects, processes, and curates intelligence about AI developer tools from **11 different data sources**. The goal is to provide strategic decision-makers with comprehensive, up-to-date intelligence for competitive analysis and market positioning.

### System Architecture

The system is composed of two main parts:

1.  **Data Collection Engine (Phase 1 - Complete):** A sophisticated Python-based backend powered by AWS Strands agent using **Claude 3.5 Sonnet (Latest)** with optimized configuration for maximum detail extraction. The system orchestrates data collection from 11 comprehensive sources and processes everything through an LLM to generate structured intelligence snapshots stored in PostgreSQL.

2.  **Curation Interface (Phase 2 - Complete):** A React-based web application that allows analysts to view collected data, add notes, and curate intelligence for executive review.

### Comprehensive Data Sources (11 Total)

**🌐 Web & Community Intelligence:**
- **Website Content**: Firecrawl-powered scraping of primary websites
- **GitHub Analytics**: Repository metrics, stars, forks, commit activity  
- **Reddit Discussions**: Community sentiment and mentions across AI subreddits
- **HackerNews**: Technical community discussions and trending stories
- **StackOverflow**: Developer questions and technical adoption metrics
- **Dev.to**: Technical articles and tutorials from developer community

**📦 Package Ecosystem Intelligence:**
- **NPM Registry**: JavaScript/Node.js package adoption and download metrics
- **PyPI Registry**: Python package ecosystem and library usage

**📰 Media & Market Intelligence:**
- **News Articles**: Comprehensive news coverage via NewsAPI
- **Medium**: Technical thought leadership and company blog content
- **ProductHunt**: Product launches, community voting, and market reception

**💼 Financial & Business Intelligence:**
- **Stock Data**: Financial metrics via Alpha Vantage (when applicable)

---

## Prerequisites

Before you begin, ensure you have the following installed on your Windows machine:

*   **Python 3.11+**: Make sure Python is installed and the `python` and `pip` commands are available in your terminal.
*   **PostgreSQL**: A running local instance of the PostgreSQL server. You will need to create a database for this project.
*   **Git**: For cloning the repository.
*   **An AWS Account**: With credentials configured for programmatic access (via `aws configure sso` or access keys), as the Strands agent relies on AWS Bedrock.

---

## Step-by-Step Onboarding Instructions

### 1. Set Up the Database

1.  Open your PostgreSQL client (e.g., `psql` or a GUI tool like pgAdmin).
2.  Create a new database for the project. The default name is `ai_platform_db`.
    ```sql
    CREATE DATABASE ai_platform_db;
    ```
3.  Connect to your new database and run the schema and seed scripts to create the necessary tables and populate the initial tool list.
    *   Execute the contents of `database/schema.sql`.
    *   Execute the contents of `database/seed.sql`.
4.  (Optional) If you need to reset the database at any time, you can run the `database/reset_database.ps1` script from a PowerShell terminal.

### 2. Configure the Environment

1.  **Create a Python Virtual Environment:**
    ```shell
    python -m venv venv
    ```
2.  **Activate the Virtual Environment:**
    ```shell
    .\venv\Scripts\Activate.ps1
    ```
3.  **Install Python dependencies:**
    ```shell
    pip install -r requirements.txt
    ```
4.  **Create the `.env` file:**
    *   Make a copy of `.env.example` and name it `.env`.
    *   Open the new `.env` file and fill in your credentials for all required APIs:
        - **Database**: PostgreSQL connection details
        - **Firecrawl**: Web scraping API key
        - **GitHub**: Personal access token for repository analysis  
        - **Reddit**: PRAW API credentials (client ID, secret, username, password)
        - **NewsAPI**: News aggregation API key
        - **Alpha Vantage**: Financial data API key
        - **ProductHunt**: API token for product data
        - **Medium**: API key (optional - limited public access)
        - **AWS**: Configured via `aws configure sso` for Strands agent

### 3. Run the Data Collection

1.  **Ensure AWS credentials are active:** If you are using SSO, make sure you have an active session.
2.  **Execute the main script:** From the project root, with your virtual environment active, run the following command in your terminal:
    ```shell
    python src/main.py
    ```
3.  **Monitor the output:** The script will log its progress to the console. It will process each tool from the `ai_tools` table one by one. You can also find detailed logs in the `logs/` directory.
4.  **Verify the results:** After the script finishes, you can connect to your PostgreSQL database and inspect the `tool_snapshots` table to see the newly created data snapshots. See the "Querying the Data" section below for examples.

### 4. Run the API Backend (Optional)

To start the FastAPI backend for React frontend integration:
```shell
python src/api.py
```
Or using uvicorn directly:
```shell
uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

---
## Querying the Data

You can use a tool like pgAdmin or DBeaver to connect to your database and query the results.

#### Get the Latest Snapshot for a Specific Tool
```sql
SELECT
    t.name,
    s.snapshot_date,
    s.basic_info,
    s.technical_details,
    s.company_info
FROM
    tool_snapshots s
JOIN
    ai_tools t ON s.tool_id = t.id
WHERE
    t.name = 'Cursor' -- <-- Change the tool name here
ORDER BY
    s.snapshot_date DESC
LIMIT 1;
```

#### Explore the Raw JSON Data
The `raw_data` column contains unprocessed data from all 11 sources. You can inspect specific data sources using PostgreSQL's JSON functions:

```sql
-- View GitHub metrics
SELECT t.name, s.raw_data -> 'github_data' as github_metrics
FROM tool_snapshots s JOIN ai_tools t ON s.tool_id = t.id
WHERE t.name = 'Cursor';

-- View community discussions  
SELECT t.name, s.raw_data -> 'reddit_data' as reddit_discussions
FROM tool_snapshots s JOIN ai_tools t ON s.tool_id = t.id  
WHERE t.name = 'Cursor';

-- View package ecosystem data
SELECT t.name, 
       s.raw_data -> 'npm_data' as npm_packages,
       s.raw_data -> 'pypi_data' as python_packages
FROM tool_snapshots s JOIN ai_tools t ON s.tool_id = t.id
WHERE t.name = 'Cursor';

-- View all data sources available
SELECT t.name, 
       jsonb_object_keys(s.raw_data) as data_sources
FROM tool_snapshots s JOIN ai_tools t ON s.tool_id = t.id  
WHERE t.name = 'Cursor'
ORDER BY s.snapshot_date DESC LIMIT 1;
```

---

## Project Structure

### Core Application
*   `src/`: Contains the main Python source code (modular architecture).
    *   `main.py`: Main entry point with optimized Strands agent and execution logic
    *   `models.py`: Pydantic data models for structured data validation
    *   `database.py`: Database connection and utility functions  
    *   `scrapers.py`: All 11 data scraper implementations in modular design
    *   `api.py`: FastAPI backend for React frontend integration
    *   `app.py`: Legacy Flask app (to be removed)
    *   `templates/`: Legacy templates (to be replaced by React frontend)

### Configuration & Setup  
*   `database/`: SQL scripts for database setup.
    *   `schema.sql`: Creates PostgreSQL tables with JSONB support
    *   `seed.sql`: Populates initial AI tools list
    *   `reset_database.ps1`: PowerShell script to reset database
*   `.env.example`: Environment variables template with all 11 API configurations
*   `requirements.txt`: Python package dependencies

### Data & Logs
*   `logs/`: Timestamped log files (created automatically)
*   `raw.json`: Example raw data output from all 11 scrapers

## System Features

### Advanced Data Collection
- **11 Comprehensive Data Sources**: Web, community, packages, media, financial
- **Optimized LLM Processing**: Claude 3.5 Sonnet with 8192 tokens, temp=0.1
- **Intelligent Data Fusion**: Cross-references data across sources for accuracy
- **Robust Error Handling**: Graceful degradation when APIs are unavailable

### Structured Intelligence Output
- **Basic Info**: Comprehensive descriptions and categorization
- **Technical Details**: Features, pricing, tech stack, security, integrations
- **Company Intelligence**: Financial metrics, funding, leadership, investors  
- **Community Metrics**: GitHub stats, forum discussions, package adoption

### Data Architecture
- **PostgreSQL Database**: JSONB storage for flexibility and performance
- **Modular Codebase**: Clean separation of scrapers, database, and core logic
- **Flexible Schema**: Supports any data structure via JSONB fields
- **Audit Trail**: Complete snapshot history with timestamps
