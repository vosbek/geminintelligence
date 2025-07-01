#!/usr/bin/env python3
"""
Developer Tooling & Agentic Development Curator Agent

Discovers, analyzes, and curates trending GitHub repositories focused on 
developer productivity tools, agentic IDEs, AI-powered development libraries,
MCP implementations, and agentic development frameworks.
"""

import os
import sys
import logging
import argparse
import json
import re
import time
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
import requests
import psycopg2
from psycopg2.extras import DictCursor, Json
from dataclasses import dataclass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class CurationConfig:
    """Configuration for curation runs"""
    min_stars: int = 20
    max_repo_age_years: int = 3
    min_developer_relevance: float = 0.6
    min_utility_score: float = 0.4
    rate_limit_delay: int = 1
    max_repos_per_search: int = 100
    github_token: str = os.getenv('GITHUB_TOKEN', '') or os.getenv('GITHUB_API_TOKEN', '')

class GitHubAPI:
    """GitHub API client with rate limiting and error handling"""
    
    def __init__(self, token: str):
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'DevToolsCurator/1.0'
        })
        self.api_calls_made = 0
        
    def search_repositories(self, query: str, sort: str = 'stars', order: str = 'desc', 
                          per_page: int = 100) -> Dict:
        """Search GitHub repositories with the given query"""
        url = 'https://api.github.com/search/repositories'
        params = {
            'q': query,
            'sort': sort,
            'order': order,
            'per_page': per_page
        }
        
        try:
            response = self.session.get(url, params=params)
            self.api_calls_made += 1
            
            if response.status_code == 403:  # Rate limit exceeded
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                wait_time = max(0, reset_time - int(time.time())) + 5
                logger.warning(f"Rate limit exceeded. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                return self.search_repositories(query, sort, order, per_page)
            
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"GitHub API error for query '{query}': {e}")
            return {'items': []}
    
    def get_repository_details(self, owner: str, repo: str) -> Optional[Dict]:
        """Get detailed information about a specific repository"""
        url = f'https://api.github.com/repos/{owner}/{repo}'
        try:
            response = self.session.get(url)
            self.api_calls_made += 1
            
            if response.status_code == 403:  # Rate limit
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                wait_time = max(0, reset_time - int(time.time())) + 5
                logger.warning(f"Rate limit exceeded. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                return self.get_repository_details(owner, repo)
                
            if response.status_code == 404:
                return None
                
            response.raise_for_status()
            return response.json()
            
        except requests.RequestException as e:
            logger.error(f"Error fetching details for {owner}/{repo}: {e}")
            return None
    
    def get_repository_readme(self, owner: str, repo: str) -> str:
        """Get repository README content"""
        url = f'https://api.github.com/repos/{owner}/{repo}/readme'
        try:
            response = self.session.get(url)
            self.api_calls_made += 1
            
            if response.status_code == 404:
                return ""
            
            response.raise_for_status()
            readme_data = response.json()
            
            # README content is base64 encoded
            import base64
            content = base64.b64decode(readme_data['content']).decode('utf-8', 'ignore')
            return content
            
        except Exception as e:
            logger.error(f"Error fetching README for {owner}/{repo}: {e}")
            return ""

class RepositoryAnalyzer:
    """Analyzes repositories for developer tool relevance and utility"""
    
    # Keywords for different categories and analysis
    DEVELOPER_KEYWORDS = [
        'developer tools', 'dev tools', 'developer productivity', 'coding assistant',
        'code completion', 'code generation', 'ai assistant', 'programming assistant',
        'ide extension', 'vscode extension', 'jetbrains plugin', 'neovim plugin', 'vim plugin',
        'cli tool', 'command line', 'terminal', 'shell', 'automation',
        'debugging', 'testing', 'linting', 'code review', 'static analysis',
        # Programming and development terms
        'programming', 'coding', 'development', 'software development', 'dev environment',
        'code editor', 'text editor', 'ide', 'integrated development',
        # AI/ML development terms  
        'copilot', 'autocomplete', 'intellisense', 'code suggestion', 'ai code',
        'machine learning', 'artificial intelligence', 'llm', 'language model',
        # Workflow and productivity
        'workflow', 'build tool', 'deployment', 'devops', 'ci/cd', 'continuous integration',
        'version control', 'git', 'repository', 'repo', 'package manager',
        # Code quality and analysis
        'refactoring', 'code quality', 'code analysis', 'syntax', 'parser',
        'formatter', 'beautifier', 'minifier', 'bundler', 'transpiler'
    ]
    
    MCP_KEYWORDS = [
        'mcp', 'model context protocol', 'anthropic-mcp', 'mcp-server', 'mcp-client',
        'claude mcp', 'anthropic', 'model context'
    ]
    
    AGENTIC_KEYWORDS = [
        'agentic', 'ai-powered', 'intelligent', 'autonomous', 'smart assistant',
        'ai ide', 'copilot', 'autocomplete', 'code suggestion'
    ]
    
    CATEGORIES = {
        'agentic-ides': ['ai ide', 'agentic ide', 'intelligent editor', 'ai editor', 'copilot'],
        'code-generation': ['code generation', 'code generator', 'autocomplete', 'completion', 'copilot'],
        'mcp-tools': ['mcp', 'model context protocol', 'anthropic-mcp'],
        'developer-productivity': ['cli tool', 'productivity', 'automation', 'workflow'],
        'code-review': ['code review', 'static analysis', 'linting', 'quality'],
        'testing-debugging': ['testing', 'debug', 'unit test', 'integration test']
    }
    
    def analyze_repository(self, repo_data: Dict, readme_content: str) -> Dict:
        """Analyze a repository for developer tool relevance"""
        analysis = {
            'developer_relevance_score': 0.0,
            'utility_score': 0.0,
            'category': 'unknown',
            'mcp_compatible': False,
            'key_features': [],
            'installation_method': 'Unknown',
            'developer_benefits': ''
        }
        
        # Analyze README content
        readme_analysis = self._analyze_readme(readme_content)
        analysis.update(readme_analysis)
        
        # Analyze repository metadata
        metadata_analysis = self._analyze_metadata(repo_data)
        analysis.update(metadata_analysis)
        
        # Calculate final scores
        analysis['developer_relevance_score'] = self._calculate_developer_relevance(
            repo_data, readme_content, readme_analysis
        )
        analysis['utility_score'] = self._calculate_utility_score(
            repo_data, readme_analysis
        )
        
        return analysis
    
    def _analyze_readme(self, readme: str) -> Dict:
        """Analyze README content for developer tool indicators"""
        if not readme:
            readme = ""
        readme_lower = readme.lower()
        
        # Count keyword matches
        dev_keyword_matches = sum(1 for keyword in self.DEVELOPER_KEYWORDS 
                                if keyword in readme_lower)
        mcp_keyword_matches = sum(1 for keyword in self.MCP_KEYWORDS 
                                if keyword in readme_lower)
        
        # Determine category
        category = 'unknown'
        for cat, keywords in self.CATEGORIES.items():
            if any(keyword in readme_lower for keyword in keywords):
                category = cat
                break
        
        # Look for installation instructions
        installation_method = 'Unknown'
        if 'npm install' in readme_lower or 'yarn add' in readme_lower or 'pnpm add' in readme_lower:
            installation_method = 'npm install'
        elif 'pip install' in readme_lower or 'poetry add' in readme_lower or 'conda install' in readme_lower:
            installation_method = 'pip install'
        elif ('vs code marketplace' in readme_lower or 'vscode marketplace' in readme_lower or 
              'visual studio code' in readme_lower or 'extension marketplace' in readme_lower):
            installation_method = 'VS Code Marketplace'
        elif 'cargo install' in readme_lower:
            installation_method = 'cargo install'
        elif 'go install' in readme_lower or 'go get' in readme_lower:
            installation_method = 'go install'
        elif 'brew install' in readme_lower or 'homebrew' in readme_lower:
            installation_method = 'Homebrew'
        elif ('curl' in readme_lower and 'install' in readme_lower) or 'wget' in readme_lower:
            installation_method = 'Script Install'
        elif 'docker' in readme_lower and ('pull' in readme_lower or 'run' in readme_lower):
            installation_method = 'Docker'
        elif 'gem install' in readme_lower:
            installation_method = 'Ruby Gem'
        elif 'composer install' in readme_lower or 'composer require' in readme_lower:
            installation_method = 'Composer'
        
        # Extract key features (look for bullet points or numbered lists)
        features = self._extract_features_from_readme(readme)
        
        return {
            'readme_keyword_score': min(1.0, dev_keyword_matches / 10.0),
            'category': category,
            'mcp_compatible': mcp_keyword_matches > 0,
            'key_features': features[:5],  # Limit to top 5 features
            'installation_method': installation_method,
            'readme_analysis': {
                'length': len(readme),
                'dev_keywords_found': dev_keyword_matches,
                'mcp_keywords_found': mcp_keyword_matches,
                'has_installation_guide': 'install' in readme_lower,
                'has_usage_examples': 'example' in readme_lower or 'usage' in readme_lower
            }
        }
    
    def _extract_features_from_readme(self, readme: str) -> List[str]:
        """Extract key features from README using pattern matching"""
        features = []
        
        # Look for markdown lists and bullet points
        lines = readme.split('\n')
        for line in lines:
            line = line.strip()
            # Match bullet points, numbered lists, or feature lists
            if (line.startswith('- ') or line.startswith('* ') or 
                re.match(r'^\d+\.', line) or 
                (line.startswith('✓') or line.startswith('->'))):
                
                # Clean up the feature text
                feature = re.sub(r'^[\-\*\d\.✓\>\s]+', '', line).strip()
                if len(feature) > 10 and len(feature) < 100:  # Reasonable feature length
                    features.append(feature)
                    
        return features[:10]  # Return up to 10 features
    
    def _analyze_metadata(self, repo_data: Dict) -> Dict:
        """Analyze repository metadata for developer tool indicators"""
        topics = repo_data.get('topics', []) or []
        description = (repo_data.get('description', '') or '').lower()
        
        # Check for developer tool topics
        dev_topics = ['developer-tools', 'vscode-extension', 'cli', 'productivity',
                     'automation', 'devtools', 'coding-assistant', 'ai-assistant',
                     'developer-productivity', 'development-tools', 'programming',
                     'code-editor', 'ide', 'vim-plugin', 'neovim-plugin', 'nvim',
                     'jetbrains-plugin', 'intellij-plugin', 'code-completion',
                     'ai-code', 'copilot', 'autocomplete', 'code-generation',
                     'programming-tools', 'build-tools', 'deployment-tools',
                     'devops-tools', 'ci-cd', 'testing-tools', 'debugging',
                     'linting', 'code-analysis', 'static-analysis', 'refactoring']
        
        topic_matches = sum(1 for topic in topics if topic in dev_topics)
        
        # Language-based hints
        language = repo_data.get('language', '') or ''
        language_score = 0.0
        if language in ['TypeScript', 'JavaScript']:  # Common for VS Code extensions
            language_score = 0.1
        elif language in ['Python', 'Go', 'Rust']:  # Common for CLI tools
            language_score = 0.05
        
        return {
            'topic_matches': topic_matches,
            'language_score': language_score,
            'has_dev_description': any(keyword in description for keyword in self.DEVELOPER_KEYWORDS)
        }
    
    def _calculate_developer_relevance(self, repo_data: Dict, readme: str, 
                                     readme_analysis: Dict) -> float:
        """Calculate developer relevance score (0.0 to 1.0)"""
        score = 0.0
        
        # README keyword analysis (30% weight - reduced from 40%)
        score += readme_analysis['readme_keyword_score'] * 0.3
        
        # Repository topics and description (40% weight - increased from 30%)
        topic_score = min(1.0, readme_analysis.get('topic_matches', 0) / 2.0)  # More generous (was /3.0)
        desc_score = 1.0 if readme_analysis.get('has_dev_description', False) else 0.0
        score += (topic_score * 0.3 + desc_score * 0.1)
        
        # File structure and language analysis (20% weight)
        lang_score = readme_analysis.get('language_score', 0.0)
        # Boost score for common dev tool languages
        language = repo_data.get('language', '').lower()
        if language in ['typescript', 'javascript', 'python', 'go', 'rust']:
            lang_score = max(lang_score, 0.3)
        score += lang_score * 0.2
        
        # Documentation and ease of use (10% weight)
        doc_score = 0.0
        if readme_analysis['readme_analysis']['has_installation_guide']:
            doc_score += 0.5
        if readme_analysis['readme_analysis']['has_usage_examples']:
            doc_score += 0.5
        score += doc_score * 0.1
        
        # Minimum baseline for repos with good metadata
        if (readme_analysis.get('topic_matches', 0) > 0 or 
            readme_analysis.get('has_dev_description', False) or
            readme_analysis['installation_method'] != 'Unknown'):
            score = max(score, 0.25)  # Ensure minimum score for likely dev tools
        
        return min(1.0, score)
    
    def _calculate_utility_score(self, repo_data: Dict, readme_analysis: Dict) -> float:
        """Calculate utility score based on community adoption and quality"""
        score = 0.0
        
        # Star velocity (25% weight)
        stars = repo_data.get('stargazers_count', 0)
        created_at = datetime.fromisoformat(repo_data.get('created_at', '2020-01-01T00:00:00Z').replace('Z', '+00:00'))
        days_old = (datetime.now(created_at.tzinfo) - created_at).days
        star_velocity = stars / max(days_old, 1) * 365  # Stars per year
        star_score = min(1.0, star_velocity / 1000.0)  # Normalize to 1000 stars/year
        score += star_score * 0.25
        
        # Documentation quality (25% weight)
        doc_length = readme_analysis['readme_analysis']['length']
        doc_score = min(1.0, doc_length / 5000.0)  # Normalize to 5000 chars
        score += doc_score * 0.25
        
        # Ease of use indicators (20% weight)
        ease_score = 0.0
        if readme_analysis['installation_method'] != 'Unknown':
            ease_score += 0.5
        if readme_analysis['readme_analysis']['has_usage_examples']:
            ease_score += 0.5
        score += ease_score * 0.2
        
        # Practical examples (15% weight)
        example_score = min(1.0, len(readme_analysis['key_features']) / 5.0)
        score += example_score * 0.15
        
        # Community adoption (15% weight)
        community_score = min(1.0, (stars + repo_data.get('forks_count', 0)) / 1000.0)
        score += community_score * 0.15
        
        return min(1.0, score)

class CuratorDatabase:
    """Database operations for curator agent"""
    
    def __init__(self):
        self.conn = self._get_connection()
    
    def _get_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(
                dbname=os.getenv("DB_NAME", "ai_database"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "postgres"),
                host=os.getenv("DB_HOST", "localhost"),
                port=os.getenv("DB_PORT", "5432")
            )
            return conn
        except psycopg2.OperationalError as e:
            logger.error(f"Could not connect to database: {e}")
            sys.exit(1)
    
    def create_curation_run(self, config: CurationConfig, period_start: date, 
                          period_end: date) -> int:
        """Create a new curation run record"""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO curation_runs (
                    curation_type, period_start, period_end, run_status, run_config
                ) VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (
                'adhoc',  # Will be configurable later
                period_start,
                period_end, 
                'running',
                Json(config.__dict__)
            ))
            run_id = cur.fetchone()[0]
            self.conn.commit()
            return run_id
    
    def update_curation_run(self, run_id: int, status: str, 
                          total_analyzed: int = 0, curated: int = 0,
                          api_calls: int = 0, error_msg: str = None,
                          summary_stats: Dict = None, trends: List[str] = None):
        """Update curation run with results"""
        with self.conn.cursor() as cur:
            cur.execute("""
                UPDATE curation_runs SET 
                    run_status = %s,
                    total_repositories_analyzed = %s,
                    repositories_curated = %s,
                    github_api_calls_made = %s,
                    error_message = %s,
                    summary_stats = %s,
                    notable_trends = %s,
                    completed_at = CASE WHEN %s != 'running' THEN NOW() ELSE completed_at END
                WHERE id = %s
            """, (
                status, total_analyzed, curated, api_calls, error_msg,
                Json(summary_stats) if summary_stats else None,
                trends or [],
                status, run_id
            ))
            self.conn.commit()
    
    def save_curated_repository(self, repo_data: Dict, analysis: Dict, 
                              period_start: date, period_end: date) -> bool:
        """Save a curated repository to database"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO curated_repositories (
                        repo_name, repo_url, description, category, language,
                        stars, forks, topics, developer_relevance_score,
                        utility_score, final_score, mcp_compatible,
                        installation_method, key_features, developer_benefits,
                        first_seen_date, last_updated_date, last_commit_date,
                        issues_count, pull_requests_count, license,
                        curation_period_start, curation_period_end,
                        curation_type, readme_analysis, raw_github_data
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) ON CONFLICT (repo_name, curation_period_start) DO UPDATE SET
                        stars = EXCLUDED.stars,
                        forks = EXCLUDED.forks,
                        developer_relevance_score = EXCLUDED.developer_relevance_score,
                        utility_score = EXCLUDED.utility_score,
                        final_score = EXCLUDED.final_score,
                        updated_at = NOW()
                """, (
                    repo_data['full_name'],
                    repo_data['html_url'],
                    repo_data.get('description', ''),
                    analysis['category'],
                    repo_data.get('language', ''),
                    repo_data.get('stargazers_count', 0),
                    repo_data.get('forks_count', 0),
                    repo_data.get('topics', []),
                    analysis['developer_relevance_score'],
                    analysis['utility_score'],
                    analysis.get('final_score', 0.0),
                    analysis['mcp_compatible'],
                    analysis['installation_method'],
                    analysis['key_features'],
                    analysis['developer_benefits'],
                    datetime.fromisoformat(repo_data['created_at'].replace('Z', '+00:00')).date(),
                    datetime.fromisoformat(repo_data['updated_at'].replace('Z', '+00:00')).date(),
                    datetime.fromisoformat(repo_data['pushed_at'].replace('Z', '+00:00')).date() if repo_data.get('pushed_at') else None,
                    repo_data.get('open_issues_count', 0),
                    0,  # pull_requests_count - would need separate API call
                    repo_data.get('license', {}).get('name', '') if repo_data.get('license') else '',
                    period_start,
                    period_end,
                    'adhoc',
                    Json(analysis.get('readme_analysis', {})),
                    Json(repo_data)
                ))
                self.conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error saving repository {repo_data['full_name']}: {e}")
            self.conn.rollback()
            return False
    
    def get_curated_repositories(self, limit: int = 50) -> List[Dict]:
        """Get recently curated repositories"""
        with self.conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute("""
                SELECT * FROM curated_repositories 
                ORDER BY final_score DESC, created_at DESC 
                LIMIT %s
            """, (limit,))
            return [dict(row) for row in cur.fetchall()]
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

class DevToolsCurator:
    """Main curator agent class"""
    
    def __init__(self, config: CurationConfig):
        self.config = config
        self.github = GitHubAPI(config.github_token)
        self.analyzer = RepositoryAnalyzer()
        self.db = CuratorDatabase()
        
        if not config.github_token:
            logger.error("GitHub token not found in environment. Set GITHUB_TOKEN.")
            sys.exit(1)
    
    def run_curation(self, period_days: int = 7) -> Dict:
        """Run full curation process"""
        logger.info("Starting developer tools curation...")
        
        # Set up time period
        end_date = date.today()
        start_date = end_date - timedelta(days=period_days)
        
        # Create curation run record
        run_id = self.db.create_curation_run(self.config, start_date, end_date)
        
        try:
            # Search queries for different types of developer tools
            search_queries = [
                # Time-based trending
                f"developer tools created:>{start_date.isoformat()}",
                f"programming tools pushed:>{start_date.isoformat()}",
                f"coding assistant created:>{start_date.isoformat()}",
                
                # MCP and AI tools
                "mcp OR \"model context protocol\"",
                "agentic IDE OR \"ai ide\" OR \"intelligent editor\"",
                "vscode-extension AI OR \"ai extension\"",
                "copilot OR \"code completion\" OR autocomplete",
                
                # Developer productivity
                "topic:developer-tools",
                "topic:productivity",
                "topic:cli",
                "cli tool developer productivity",
                "build tools OR \"build automation\"",
                
                # Code quality and analysis
                "code generation autocomplete",
                "programming assistant",
                "static analysis OR linting OR \"code review\"",
                "debugging tools OR \"developer debugging\"",
                
                # Editor plugins and extensions
                "vim plugin OR neovim plugin",
                "jetbrains plugin OR intellij plugin",
                "\"text editor\" OR \"code editor\"",
                
                # Language-specific dev tools
                "python developer tools",
                "javascript developer tools",
                "typescript developer tools"
            ]
            
            all_repos = []
            total_analyzed = 0
            
            # Search for repositories
            for query in search_queries:
                logger.info(f"Searching: {query}")
                results = self.github.search_repositories(
                    query, per_page=min(100, self.config.max_repos_per_search)
                )
                
                repos = results.get('items', [])
                all_repos.extend(repos)
                total_analyzed += len(repos)
                
                # Rate limiting
                time.sleep(self.config.rate_limit_delay)
            
            # Remove duplicates
            unique_repos = {repo['full_name']: repo for repo in all_repos}
            all_repos = list(unique_repos.values())
            
            logger.info(f"Found {len(all_repos)} unique repositories to analyze")
            
            # Filter and analyze repositories
            curated_repos = []
            analyzed_count = 0
            passed_initial_filter = 0
            
            for repo in all_repos:
                if self._should_analyze_repo(repo):
                    passed_initial_filter += 1
                    analysis = self._analyze_repository(repo, start_date, end_date)
                    if analysis:
                        analyzed_count += 1
                        logger.debug(f"Analyzed {repo['full_name']}: dev_score={analysis['developer_relevance_score']:.2f}, utility_score={analysis['utility_score']:.2f}, final_score={analysis.get('final_score', 0):.2f}")
                        if self._meets_curation_criteria(analysis):
                            curated_repos.append((repo, analysis))
                            logger.info(f"✅ Curated: {repo['full_name']} (score: {analysis.get('final_score', 0):.2f})")
            
            logger.info(f"Analysis summary: {passed_initial_filter} passed initial filter, {analyzed_count} analyzed successfully, {len(curated_repos)} met curation criteria")
            
            # Save curated repositories
            saved_count = 0
            for repo, analysis in curated_repos:
                if self.db.save_curated_repository(repo, analysis, start_date, end_date):
                    saved_count += 1
            
            # Generate summary statistics
            summary_stats = self._generate_summary_stats(curated_repos)
            
            # Update curation run
            self.db.update_curation_run(
                run_id, 'completed', total_analyzed, saved_count,
                self.github.api_calls_made, None, summary_stats
            )
            
            logger.info(f"Curation completed: {saved_count}/{len(curated_repos)} repositories saved")
            
            return {
                'run_id': run_id,
                'total_analyzed': total_analyzed,
                'repositories_curated': saved_count,
                'summary_stats': summary_stats
            }
            
        except Exception as e:
            logger.error(f"Curation failed: {e}")
            self.db.update_curation_run(run_id, 'failed', error_msg=str(e))
            raise
    
    def _should_analyze_repo(self, repo: Dict) -> bool:
        """Check if repository should be analyzed"""
        # Basic filters
        if repo.get('stargazers_count', 0) < self.config.min_stars:
            return False
        
        if repo.get('archived', False) or repo.get('disabled', False):
            return False
        
        # Age filter
        created_at = datetime.fromisoformat(repo['created_at'].replace('Z', '+00:00'))
        age_years = (datetime.now(created_at.tzinfo) - created_at).days / 365
        if age_years > self.config.max_repo_age_years:
            return False
        
        return True
    
    def _analyze_repository(self, repo: Dict, start_date: date, end_date: date) -> Optional[Dict]:
        """Analyze a single repository"""
        try:
            # Get README content
            owner, name = repo['full_name'].split('/')
            readme = self.github.get_repository_readme(owner, name)
            
            # Analyze repository
            analysis = self.analyzer.analyze_repository(repo, readme)
            
            # Calculate final score with bonuses
            final_score = (analysis['developer_relevance_score'] * 0.6 + 
                          analysis['utility_score'] * 0.4)
            
            # Apply bonuses
            if analysis['mcp_compatible']:
                final_score += 0.05  # Reduced from 0.1 to reduce MCP bias
            if 'VS Code' in analysis['installation_method']:
                final_score += 0.05
            if analysis['installation_method'] not in ['Unknown']:
                final_score += 0.05
            # Additional bonuses for diversity
            if analysis['category'] in ['code-generation', 'developer-productivity']:
                final_score += 0.03  # Boost non-MCP categories
            
            analysis['final_score'] = min(1.0, final_score)
            
            # Generate developer benefits summary
            analysis['developer_benefits'] = self._generate_benefits_summary(repo, analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing {repo['full_name']}: {e}")
            return None
    
    def _meets_curation_criteria(self, analysis: Dict) -> bool:
        """Check if analysis meets curation criteria"""
        dev_score = analysis['developer_relevance_score']
        utility_score = analysis['utility_score']
        
        meets_criteria = (dev_score >= self.config.min_developer_relevance and
                         utility_score >= self.config.min_utility_score)
        
        if not meets_criteria:
            logger.debug(f"Failed criteria: dev_score={dev_score:.2f} (need {self.config.min_developer_relevance}), utility_score={utility_score:.2f} (need {self.config.min_utility_score})")
        
        return meets_criteria
    
    def _generate_benefits_summary(self, repo: Dict, analysis: Dict) -> str:
        """Generate a summary of developer benefits"""
        benefits = []
        
        if analysis['category'] == 'agentic-ides':
            benefits.append("Enhanced coding experience with AI assistance")
        elif analysis['category'] == 'code-generation':
            benefits.append("Automated code generation and completion")
        elif analysis['category'] == 'mcp-tools':
            benefits.append("Model Context Protocol integration for AI workflows")
        
        if analysis['key_features']:
            benefits.append(f"Key features: {', '.join(analysis['key_features'][:3])}")
        
        stars = repo.get('stargazers_count', 0)
        if stars > 1000:
            benefits.append(f"Popular tool with {stars} GitHub stars")
        
        return "; ".join(benefits)
    
    def _generate_summary_stats(self, curated_repos: List[Tuple[Dict, Dict]]) -> Dict:
        """Generate summary statistics"""
        if not curated_repos:
            return {}
        
        categories = {}
        languages = {}
        total_stars = 0
        mcp_count = 0
        
        for repo, analysis in curated_repos:
            # Count categories
            cat = analysis['category']
            categories[cat] = categories.get(cat, 0) + 1
            
            # Count languages
            lang = repo.get('language', 'Unknown')
            languages[lang] = languages.get(lang, 0) + 1
            
            # Sum stars
            total_stars += repo.get('stargazers_count', 0)
            
            # Count MCP implementations
            if analysis['mcp_compatible']:
                mcp_count += 1
        
        return {
            'top_categories': sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5],
            'top_languages': sorted(languages.items(), key=lambda x: x[1], reverse=True)[:5],
            'average_stars': total_stars // len(curated_repos) if curated_repos else 0,
            'mcp_implementations_found': mcp_count,
            'total_curated': len(curated_repos)
        }

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description='Developer Tools Curator Agent')
    parser.add_argument('--days', type=int, default=7, 
                       help='Number of days to look back for trending repos')
    parser.add_argument('--min-stars', type=int, default=20,
                       help='Minimum stars for repository consideration')
    parser.add_argument('--output-json', type=str,
                       help='Output results to JSON file')
    parser.add_argument('--list-recent', action='store_true',
                       help='List recently curated repositories')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug logging')
    parser.add_argument('--lower-thresholds', action='store_true',
                       help='Use lower scoring thresholds for testing')
    
    args = parser.parse_args()
    
    # Set debug logging level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create configuration
    config = CurationConfig(
        min_stars=args.min_stars,
        github_token=os.getenv('GITHUB_TOKEN', '') or os.getenv('GITHUB_API_TOKEN', ''),
        min_developer_relevance=0.3 if args.lower_thresholds else 0.6,
        min_utility_score=0.2 if args.lower_thresholds else 0.4
    )
    
    if args.lower_thresholds:
        logger.info("Using lower thresholds for testing: dev_relevance=0.3, utility=0.2")
    
    curator = DevToolsCurator(config)
    
    try:
        if args.list_recent:
            # List recent repositories
            repos = curator.db.get_curated_repositories(50)
            print(f"\nRecently Curated Developer Tools ({len(repos)} found):")
            print("-" * 80)
            for repo in repos:
                print(f"📦 {repo['repo_name']} (⭐ {repo['stars']})")
                print(f"   Category: {repo['category']} | Score: {repo['final_score']:.2f}")
                print(f"   {repo['description'][:100]}...")
                if repo['mcp_compatible']:
                    print("   🤖 MCP Compatible")
                print()
        else:
            # Run curation
            results = curator.run_curation(args.days)
            
            print(f"\n🎉 Curation completed!")
            print(f"📊 Analyzed: {results['total_analyzed']} repositories")
            print(f"✅ Curated: {results['repositories_curated']} repositories")
            
            if args.output_json:
                with open(args.output_json, 'w') as f:
                    json.dump(results, f, indent=2, default=str)
                print(f"💾 Results saved to {args.output_json}")
    
    finally:
        curator.db.close()

if __name__ == '__main__':
    main() 