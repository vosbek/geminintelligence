from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class BasicInfo(BaseModel):
    description: Optional[str] = Field(None, description="A summary of the tool's purpose and features.")
    category_classification: Optional[str] = Field(None, description="The category of the tool (e.g., AI_IDE, CODE_COMPLETION).")
    
class TechnicalDetails(BaseModel):
    feature_list: List[str] = Field([], description="A comprehensive list of the tool's key features and functionalities.")
    technology_stack: List[str] = Field([], description="The primary programming languages, frameworks, and technologies used to build the tool itself.")
    
    # Supported Technologies
    supported_languages: List[str] = Field([], description="A list of programming languages the tool actively supports or integrates with.")
    frameworks_and_libraries: List[str] = Field([], description="Frameworks and libraries that the tool has specific support for (e.g., React, Django, TensorFlow).")
    ides: List[str] = Field([], description="A list of IDEs that the tool can be used with or has a plugin for (e.g., VS Code, JetBrains, Eclipse).")
    
    # AI and Code Intelligence
    model_integration_capabilities: Optional[str] = Field(None, description="Describes how the tool integrates with or utilizes specific AI models (e.g., GPT-4, Claude 3.5, local models).")
    context_window_size: Optional[int] = Field(None, description="The size of the context window in tokens that the AI can handle, if applicable.")
    code_quality_and_analysis: Optional[str] = Field(None, description="A description of features related to code quality, linting, debugging, and static analysis.")
    
    # API, Deployment, and Security
    api_access: Optional[bool] = Field(None, description="Does the tool offer API access for developers? True or False.")
    deployment_options: List[str] = Field([], description="A list of supported deployment environments (e.g., Cloud, On-Premise, Desktop).")
    security_and_privacy_features: List[str] = Field([], description="A list of features related to data security, privacy, and compliance (e.g., end-to-end encryption, SOC 2 compliance).")

    # Pricing and General
    pricing_model: dict = Field({}, description="A structured object describing pricing tiers, costs, and features per tier.")
    update_frequency: Optional[str] = Field(None, description="How often the tool is updated (e.g., weekly, monthly, continuously).")
    unique_differentiators: List[str] = Field([], description="What makes this tool unique compared to its competitors?")
    enterprise_capabilities: Optional[str] = Field(None)
    security_features: List[str] = Field(default_factory=list)
    integration_capabilities: List[str] = Field(default_factory=list)
    scalability_features: List[str] = Field(default_factory=list)
    compliance_certifications: Optional[List[str]] = Field(default_factory=list)
    comparable_tools: List[str] = Field(default_factory=list)
    market_positioning: Optional[str] = Field(None)
    version_history: List[str] = Field(default_factory=list)
    roadmap_information: Optional[str] = Field(None)


class CompanyInfo(BaseModel):
    company_website: Optional[str] = Field(None, description="Official company website URL")
    stock_price: Optional[float] = None
    market_cap: Optional[str] = None
    news_mentions: Optional[int] = None
    annual_recurring_revenue: Optional[str] = None
    funding_rounds: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    valuation: Optional[str] = None
    employee_count: Optional[int] = None
    employee_count_source: Optional[str] = Field(None, description="Source of employee count (LinkedIn, About page, etc.)")
    founding_date: Optional[str] = None
    key_executives: Optional[List[str]] = Field(default_factory=list)
    parent_company: Optional[str] = None
    major_investors: Optional[List[str]] = Field(default_factory=list)
    strategic_partnerships: List[str] = Field(default_factory=list)
    headquarters_location: Optional[str] = Field(None)
    company_stage: Optional[str] = Field(None, description="Startup stage: seed, series A, B, C, etc.")
    total_funding_amount: Optional[str] = Field(None)
    last_funding_date: Optional[str] = Field(None)
    revenue_estimate: Optional[str] = Field(None)
    website_traffic_rank: Optional[int] = Field(None, description="Website ranking/traffic estimate")
    business_model: Optional[str] = Field(None, description="SaaS, freemium, enterprise, etc.")
    list_of_companies_using_tool: Optional[List[str]] = Field(default_factory=list)
    case_studies: Optional[List[str]] = Field(default_factory=list)
    testimonials: Optional[List[str]] = Field(default_factory=list)


class CommunityMetrics(BaseModel):
    github_stars: Optional[int] = None
    github_forks: Optional[int] = None
    github_last_commit_date: Optional[str] = None
    reddit_mentions: Optional[int] = None
    reddit_sentiment_score: Optional[float] = None
    hacker_news_mentions_count: Optional[int] = None
    stackoverflow_questions_count: Optional[int] = None
    devto_articles_count: Optional[int] = None
    npm_packages_count: Optional[int] = None
    pypi_packages_count: Optional[int] = None
    npm_weekly_downloads: Optional[int] = None
    youtube_mention_count: Optional[int] = None
    youtube_tutorial_count: Optional[int] = None
    youtube_sentiment: Optional[float] = None
    youtube_top_videos: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    list_of_companies_using_tool: Optional[List[str]] = Field(default_factory=list)
    testimonials: Optional[List[str]] = Field(default_factory=list)
    producthunt_ranking: Optional[int] = None
    case_studies: Optional[List[str]] = Field(default_factory=list)
    medium_articles_count: Optional[int] = None


class ToolSnapshotData(BaseModel):
    """The complete structured data model for a single tool snapshot."""
    basic_info: BasicInfo = Field(default_factory=BasicInfo)
    technical_details: TechnicalDetails = Field(default_factory=TechnicalDetails)
    company_info: CompanyInfo = Field(default_factory=CompanyInfo)
    community_metrics: CommunityMetrics = Field(default_factory=CommunityMetrics)
