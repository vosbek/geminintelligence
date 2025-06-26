# AI Intelligence Platform - Project TODO

This document outlines the development plan for the AI Intelligence Platform MVP.

## Phase 1: Core Data Collection System

**Objective:** Establish the foundational system for automatically collecting and storing data about AI developer tools.

### Completed Steps

- [x] **Project Scaffolding:** Created the initial directory structure (`src`, `database`, `logs`).
- [x] **Git Repository:** Initialized a Git repository and committed the initial project files.
- [x] **Database Schema:** Generated `database/schema.sql` with the complete PostgreSQL table definitions.
- [x] **Seed Data:** Generated `database/seed.sql` to populate the `ai_tools` table with the initial list of tools.
- [x] **Python Dependencies:** Created `requirements.txt` with the necessary Python libraries.
- [x] **Core Workflow Implementation:** Developed the initial `src/main.py` script, which includes:
    - [x] Database connection logic.
    - [x] Comprehensive logging setup.
    - [x] A main loop to fetch and iterate through tools needing processing.
    - [x] Placeholder functions for the data collection workflow.

### Next Steps

- [x] **Environment Configuration:** Created a `.env.example` file to document the required environment variables for database connection.
- [x] **AWS Strands Agent - Web Scraper:** Implemented the `web_scraper` agent.
- [x] **AWS Strands Agent - GitHub Analyzer:** Implemented the `github_analyzer` agent.
- [x] **AWS Strands Agent - Community & News (Stretch Goal for MVP):** Implemented placeholder agents for Reddit, News, and Stocks.
- [x] **Data Processing & Storage:**
    - [x] Implemented the logic within `run_data_collection_workflow` to take the raw data from all agents.
    - [x] Created a `processing.py` module to structure the data into the required JSONB formats.
    - [x] Updated the main workflow to store both raw and structured data in the `tool_snapshots` table.
- [x] **Error Handling & Logging:**
    - [x] Implemented basic error handling and logging throughout the pipeline.
- [ ] **Finalize Phase 1:**
    - [ ] Conduct a full test run of the data collection for all initial tools.
    - [ ] Review logs and database entries to ensure correctness.

---

## Phase 2: Local Curation Interface

**Objective:** Build a simple local web application to view, analyze, and curate the collected data.

### Next Steps

- [ ] **Web Framework Setup:**
    - [ ] Choose a simple Python web framework (e.g., Flask, FastAPI).
    - [ ] Set up the basic application structure.
- [ ] **Snapshot Viewer:**
    - [ ] Create a main page that lists all tools in the database.
    - [ ] Create a detail page that displays all the data from the most recent `tool_snapshots` record for a selected tool.
- [ ] **Curation Features:**
    - [ ] Add a form on the detail page to allow a user to add/edit `curator_notes`, `enterprise_position`, and `strategic_alignment`.
    - [ ] Implement the backend logic to save this curated data to the `curated_snapshots` table.
- [ ] **Snapshot Comparison View:**
    - [ ] Add functionality to select two different snapshots for the same tool.
    - [ ] Display a side-by-side or diff view to highlight changes between the snapshots.
- [ ] **Data Validation:**
    - [ ] Add a simple button or form to mark a curated snapshot as 'validated'.

---

## Post-MVP Considerations

- [ ] **Containerization:** Package the application and database in Docker containers for easier deployment.
- [ ] **Cloud Deployment:** Plan for migration to a cloud environment (e.g., AWS Fargate, EC2).
- [ ] **CI/CD Pipeline:** Set up a pipeline for automated testing and deployment.
- [ ] **Authentication:** Implement more robust user authentication for the curation interface.
