# AI Intelligence Platform

## Project Overview

This project is a database-driven system that automatically collects, processes, and curates information about AI developer tools. The goal is to provide comprehensive, up-to-date intelligence for strategic decision-making.

The system is composed of two main parts:

1.  **Data Collection Engine (Phase 1 - Complete):** A Python-based backend that uses an AWS-powered agent (`strands`) to orchestrate data collection from various sources. It scrapes websites with Firecrawl, analyzes GitHub repositories, searches Reddit via the PRAW API, and fetches news. The collected data is processed by an LLM to generate a structured JSON snapshot, which is then stored in a PostgreSQL database.
2.  **Curation Interface (Phase 2 - Planned):** A future application that will allow analysts to view the collected data, add notes, and curate it for executive review.

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
    *   Open the new `.env` file and fill in your credentials for the database and all required APIs (Firecrawl, GitHub, Reddit, NewsAPI).

### 3. Run the Data Collection

1.  **Ensure AWS credentials are active:** If you are using SSO, make sure you have an active session.
2.  **Execute the main script:** From the project root, with your virtual environment active, run the following command in your terminal:
    ```shell
    python src/main.py
    ```
3.  **Monitor the output:** The script will log its progress to the console. It will process each tool from the `ai_tools` table one by one. You can also find detailed logs in the `logs/` directory.
4.  **Verify the results:** After the script finishes, you can connect to your PostgreSQL database and inspect the `tool_snapshots` table to see the newly created data snapshots. See the "Querying the Data" section below for examples.

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
The `raw_data` column contains the unprocessed data from all sources. You can inspect it using PostgreSQL's JSON functions.

```sql
SELECT
    t.name,
    s.snapshot_date,
    s.raw_data -> 'news_data' as news
FROM
    tool_snapshots s
JOIN
    ai_tools t ON s.tool_id = t.id
WHERE
    t.name = 'Cursor'
ORDER BY
    s.snapshot_date DESC
LIMIT 1;
```

---

## Project Structure

*   `src/`: Contains the main Python source code.
    *   `main.py`: The main entry point for the data collection script. It orchestrates the process and handles database interactions.
    *   `models.py`: Defines the Pydantic data models for structured data validation.
*   `database/`: Contains SQL scripts for database setup.
    *   `schema.sql`: Creates the database tables.
    *   `seed.sql`: Populates the initial list of AI tools.
    *   `reset_database.ps1`: A PowerShell script to quickly drop and recreate the database.
*   `logs/`: Directory where log files are stored (created automatically).
*   `.env.example`: An example file showing the required environment variables.
*   `requirements.txt`: A list of all Python package dependencies.
*   `example_raw_output.json`: An example of the raw JSON data collected for one tool before LLM processing.
