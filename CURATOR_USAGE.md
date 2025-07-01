# Developer Tools Curator Agent - Usage Guide

## Overview
The Developer Tools Curator Agent is a standalone Python script that discovers, analyzes, and curates trending GitHub repositories focused on developer productivity tools, agentic IDEs, AI-powered development libraries, and MCP implementations.

## Setup

### 1. Install Dependencies
```bash
pip install -r curator_requirements.txt
```

### 2. Set Environment Variables
Make sure you have these environment variables set:
```bash
# GitHub token (either name works)
export GITHUB_TOKEN="your_github_token_here"
# OR
export GITHUB_API_TOKEN="your_github_token_here"

# Database configuration
export DB_NAME="ai_database"
export DB_USER="postgres"
export DB_PASSWORD="your_password"
export DB_HOST="localhost"
export DB_PORT="5432"
```

### 3. Update Database Schema
Run this once to create the curator tables:
```bash
python update_curator_schema.py
```

## Usage

### Run Curation (Default - Last 7 Days)
```bash
python curator_agent.py
```

### Run Curation for Specific Time Period
```bash
# Look back 14 days
python curator_agent.py --days 14

# Set minimum stars threshold
python curator_agent.py --min-stars 50
```

### Save Results to JSON
```bash
python curator_agent.py --output-json curated_repos.json
```

### View Recent Curations
```bash
python curator_agent.py --list-recent
```

## What It Does

### 1. Repository Discovery
- Searches GitHub for trending repositories using multiple queries:
  - Developer tools created recently
  - Agentic IDE repositories
  - MCP (Model Context Protocol) implementations
  - VS Code extensions with AI features
  - CLI productivity tools
  - Code generation and autocomplete tools

### 2. Analysis & Scoring
Each repository is analyzed for:
- **Developer Relevance Score** (0.0-1.0): How relevant it is to developers
- **Utility Score** (0.0-1.0): Community adoption and practical value
- **Final Score**: Weighted combination with bonuses for MCP compatibility, VS Code marketplace presence, etc.

### 3. Categorization
Repositories are classified into:
- `agentic-ides`: AI-powered code editors and IDEs
- `code-generation`: Code completion and generation tools
- `mcp-tools`: Model Context Protocol implementations
- `developer-productivity`: CLI tools and workflow automation
- `code-review`: Code analysis and review tools
- `testing-debugging`: Testing and debugging assistants

### 4. Data Storage
All curated data is stored in PostgreSQL tables:
- `curated_repositories`: Repository details, scores, and analysis
- `curation_runs`: Metadata about each curation run

## Output Example

```
🎉 Curation completed!
📊 Analyzed: 156 repositories
✅ Curated: 23 repositories

Recently Curated Developer Tools (23 found):
--------------------------------------------------------------------------------
📦 username/awesome-dev-tool (⭐ 1,245)
   Category: agentic-ides | Score: 0.87
   AI-powered code editor with intelligent completions and context awareness...
   🤖 MCP Compatible

📦 another/cli-productivity (⭐ 567)
   Category: developer-productivity | Score: 0.76
   Command-line tool for automating development workflows...
```

## Configuration

The `CurationConfig` class allows customization:
- `min_stars`: Minimum GitHub stars (default: 20)
- `max_repo_age_years`: Maximum repository age (default: 3 years)
- `min_developer_relevance`: Minimum relevance score (default: 0.6)
- `min_utility_score`: Minimum utility score (default: 0.4)
- `rate_limit_delay`: Delay between API calls (default: 1 second)

## Database Schema

### curated_repositories
- Repository metadata (name, URL, description, stars, etc.)
- Analysis scores and categorization
- Developer-specific fields (MCP compatibility, installation method)
- Raw analysis data (README analysis, GitHub API response)

### curation_runs
- Run metadata and configuration
- Summary statistics and trends
- Error tracking and status

## Next Steps

Once you have curated data in the database, you can:
1. Build web interface components to display results
2. Create automated weekly/monthly curation workflows
3. Add more sophisticated analysis (dependency analysis, code structure)
4. Generate markdown reports and digests
5. Set up notifications for high-scoring new discoveries

## Troubleshooting

### GitHub API Rate Limits
- The script handles rate limiting automatically
- Uses exponential backoff when limits are hit
- Consider using a GitHub token with higher limits

### Database Connection Issues
- Verify environment variables are set correctly
- Ensure PostgreSQL is running and accessible
- Check that the `update_updated_at_column()` function exists in your schema

### No Repositories Found
- Check that your GitHub token has proper permissions
- Verify search queries are returning results
- Lower the `min_stars` threshold for broader results 