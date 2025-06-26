# AI Intelligence Platform

## Project Overview

This project is a database-driven system that automatically collects, processes, and curates information about AI developer tools. The goal is to provide comprehensive, up-to-date intelligence for strategic decision-making.

The system is composed of two main parts:
1.  **Data Collection Engine (Phase 1):** A Python-based backend that uses an AWS Strands agent to orchestrate data collection from various sources (websites, GitHub, financial APIs, news APIs). It stores this data in a PostgreSQL database.
2.  **Curation Interface (Phase 2):** A local React Native application that allows analysts to view the collected data, add notes, and curate it for executive review. (This part is not yet built).

---

## Prerequisites

Before you begin, ensure you have the following installed on your Windows machine:

- **Python 3.10+**: Make sure Python is installed and the `python` and `pip` commands are available in your terminal.
- **PostgreSQL**: A running local instance of the PostgreSQL server. You will need to create a database for this project.
- **Git**: For cloning the repository.
- **Node.js & npm**: Required for the React Native frontend (Phase 2).
- **An AWS Account**: With credentials configured for programmatic access (via `aws configure sso` or access keys), as the Strands agent relies on AWS Bedrock.

---

## Step-by-Step Onboarding Instructions

### 1. Set Up the Database

1.  Open your PostgreSQL client (e.g., `psql` or a GUI tool like DBeaver).
2.  Create a new database for the project. The default name is `ai_platform`.
    ```sql
    CREATE DATABASE ai_platform;
    ```
3.  Connect to your new database and run the schema and seed scripts to create the necessary tables and populate the initial tool list.
    - Execute the contents of `database/schema.sql`.
    - Execute the contents of `database/seed.sql`.

### 2. Configure the Environment

1.  **Install Python dependencies:**
    Open a terminal in the project root and run:
    ```bash
    pip install -r requirements.txt
    ```
    *Note: The `requirements.txt` file does not yet exist. I will create this in the next step.*

2.  **Create the `.env` file:**
    - Make a copy of `.env.example` and name it `.env`.
    - Open the new `.env` file and fill in your credentials:
      - `DB_PASSWORD`: Your password for the PostgreSQL user.
      - `FIRECRAWL_API_KEY`: Your key for the Firecrawl service.
      - `GITHUB_API_TOKEN`: Your GitHub Personal Access Token.
      - `ALPHA_VANTAGE_API_KEY`: Your Alpha Vantage API key.
      - `NEWS_API_KEY`: Your NewsAPI.org API key.

### 3. Run the Data Collection

1.  **Ensure AWS credentials are active:** If you are using SSO, make sure you have an active session.
2.  **Execute the main script:**
    From the project root, run the following command in your terminal:
    ```bash
    python src/main.py
    ```
3.  **Monitor the output:** The script will log its progress to the console. It will process each tool from the `ai_tools` table one by one. You can also find detailed logs in the `logs/` directory.
4.  **Verify the results:** After the script finishes, you can connect to your PostgreSQL database and inspect the `tool_snapshots` table to see the newly created data snapshots.

---

## Project Structure

- `src/`: Contains the main Python source code.
  - `main.py`: The main entry point for the data collection script.
  - `tools.py`: Defines the data collection "Tools" used by the Strands agent.
  - `models.py`: Defines the Pydantic data models for the structured output.
- `database/`: Contains SQL scripts for database setup.
  - `schema.sql`: Creates the database tables.
  - `seed.sql`: Populates the initial list of AI tools.
- `logs/`: Directory where log files are stored (created automatically).
- `.env.example`: An example file showing the required environment variables.
- `requirements.txt`: A list of all Python package dependencies.
