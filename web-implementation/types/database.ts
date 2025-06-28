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

export interface TechnicalDetails {
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

export interface CommunityMetrics {
  github_stars?: number;
  github_forks?: number;
  github_last_commit_date?: string;
  reddit_mentions?: number;
  reddit_sentiment_score?: number;
  hacker_news_mentions_count?: number;
  stackoverflow_questions_count?: number;
  producthunt_ranking?: number;
  devto_articles_count?: number;
  npm_packages_count?: number;
  npm_weekly_downloads?: number;
  pypi_packages_count?: number;
  medium_articles_count?: number;
  list_of_companies_using_tool: string[];
  case_studies?: string[];
  testimonials: string[];
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

export interface ToolDetailData {
  tool: AITool;
  snapshot?: ToolSnapshot;
  screenshots: Screenshot[];
  curated_data: CuratedData[];
  enterprise_position?: EnterprisePosition;
}