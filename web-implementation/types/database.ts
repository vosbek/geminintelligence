// types/database.ts - TypeScript type definitions
export interface AITool {
  id: number;
  name: string;
  description: string;
  github_url?: string;
  stock_symbol?: string;
  category: string;
  company_name?: string;
  legal_company_name?: string;
  status: string;
  run_status?: string;
  last_run?: string;
  created_at: string;
  updated_at: string;
  has_intelligence?: boolean;
}

export interface BasicInfo {
  description: string;
  category_classification: string;
}

export type TechnicalDetails = {
  supported_languages?: string[];
  frameworks_and_libraries?: string[];
  ides?: string[];
  model_integration_capabilities?: string;
  context_window_size?: number;
  code_quality_and_analysis?: string;
  security_and_privacy_features?: string[];
  deployment_options?: string[];
  api_access?: boolean;
  data_sources?: string[];
  feature_list: string[];
  technology_stack: string[];
  pricing_model: Record<string, any>;
  enterprise_capabilities?: string;
  security_features: string[];
  integration_capabilities: string[];
  scalability_features: string[];
  compliance_certifications: string[];
  comparable_tools: string[];
  unique_differentiators: string[];
  pros_and_cons: Record<string, string[]>;
  market_positioning?: string;
  update_frequency?: string;
  version_history: string[];
  roadmap_information?: string;
}

export interface CompanyInfo {
  company_website?: string;
  stock_price?: number;
  market_cap?: string;
  news_mentions?: number;
  annual_recurring_revenue?: string;
  funding_rounds: Array<{round: string; amount: string}>;
  valuation?: string;
  employee_count?: number;
  employee_count_source?: string;
  founding_date?: string;
  key_executives: string[];
  parent_company?: string;
  major_investors: string[];
  strategic_partnerships: string[];
  headquarters_location?: string;
  company_stage?: string;
  total_funding_amount?: string;
  last_funding_date?: string;
  revenue_estimate?: string;
  website_traffic_rank?: number;
  business_model?: string;
}

export type CommunityMetrics = {
  github_stars?: number;
  github_forks?: number;
  github_last_commit_date?: string;
  reddit_mentions?: number;
  reddit_sentiment_score?: number;
  hacker_news_mentions_count?: number;
  stackoverflow_questions_count?: number;
  devto_articles_count?: number;
  npm_packages_count?: number;
  pypi_packages_count?: number;
  npm_weekly_downloads?: number;
  youtube_mention_count?: number;
  youtube_tutorial_count?: number;
  youtube_sentiment?: number;
  youtube_top_videos?: { title: string, url: string, publishedAt: string }[];
  list_of_companies_using_tool?: string[];
  testimonials?: string[];
  producthunt_ranking?: number;
  case_studies?: string[];
  medium_articles_count?: number;
}

export interface ToolSnapshot {
  id: number;
  tool_id: number;
  snapshot_date: string;
  basic_info: BasicInfo;
  technical_details: TechnicalDetails;
  company_info: CompanyInfo;
  community_metrics: CommunityMetrics;
  raw_data?: Record<string, any>;
  processing_status: string;
}

export interface Screenshot {
  id: number;
  tool_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  description?: string;
  uploaded_at: string;
}

export interface CuratedData {
  id: number;
  tool_id: number;
  section_name: string;
  curated_content: Record<string, any>;
  curator_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EnterprisePosition {
  id: number;
  tool_id: number;
  market_position?: string;
  competitive_advantages?: string;
  target_enterprises?: string;
  implementation_complexity?: string;
  strategic_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolURL {
  url: string;
  url_type: string;
}

export interface ToolDetailData {
  tool: AITool;
  snapshot?: ToolSnapshot;
  screenshots: Screenshot[];
  curated_data: CuratedData[];
  enterprise_position?: EnterprisePosition;
  urls: ToolURL[];
}

// Curator-specific types
export interface CuratedRepository {
  id: number;
  name: string;
  github_url: string;
  description: string;
  category: string;
  developer_relevance_score: number;
  utility_score: number;
  final_score: number;
  star_count: number;
  fork_count: number;
  last_commit_date: string;
  language: string;
  mcp_compatible: boolean;
  installation_method: string;
  analysis_data: Record<string, any>;
  discovered_at: string;
  curation_run_id?: number;
}

export interface CurationRun {
  id: number;
  run_date: string;
  repositories_analyzed: number;
  repositories_curated: number;
  min_stars: number;
  days_back: number;
  search_queries: string[];
  completed: boolean;
  duration_seconds?: number;
  error_message?: string;
}

export interface CuratorConfig {
  minStars: number;
  daysBack: number;
  developerRelevanceThreshold: number;
  utilityThreshold: number;
  debug: boolean;
}