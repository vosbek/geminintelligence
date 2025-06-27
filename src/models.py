from pydantic import BaseModel, Field
from typing import List, Optional

class BasicInfo(BaseModel):
    description: Optional[str] = Field(None, description="A summary of the tool's purpose and features.")
    category_classification: Optional[str] = Field(None, description="The category of the tool (e.g., AI_IDE, CODE_COMPLETION).")
    
class TechnicalDetails(BaseModel):
    feature_list: List[str] = Field([], description="A list of key features.")
    technology_stack: List[str] = Field([], description="The primary technologies used to build the tool.")
    pricing_model: dict = Field({}, description="Information on pricing tiers.")
    enterprise_capabilities: Optional[str] = Field(None)
    security_features: List[str] = Field([])
    integration_capabilities: List[str] = Field([])
    scalability_features: List[str] = Field([])
    compliance_certifications: List[str] = Field([])
    comparable_tools: List[str] = Field([])
    unique_differentiators: List[str] = Field([])
    pros_and_cons: dict = Field({})
    market_positioning: Optional[str] = Field(None)
    update_frequency: Optional[str] = Field(None)
    version_history: List[str] = Field([])
    roadmap_information: Optional[str] = Field(None)


class CompanyInfo(BaseModel):
    stock_price: Optional[float] = Field(None)
    market_cap: Optional[str] = Field(None)
    news_mentions: Optional[int] = Field(None)
    annual_recurring_revenue: Optional[str] = Field(None)
    funding_rounds: List[dict] = Field([])
    valuation: Optional[str] = Field(None)
    employee_count: Optional[int] = Field(None)
    founding_date: Optional[str] = Field(None)
    key_executives: List[str] = Field([])
    parent_company: Optional[str] = Field(None)
    major_investors: List[str] = Field([])


class CommunityMetrics(BaseModel):
    github_stars: Optional[int] = Field(None)
    github_forks: Optional[int] = Field(None)
    github_last_commit_date: Optional[str] = Field(None)
    reddit_mentions: Optional[int] = Field(None)
    reddit_sentiment_score: Optional[float] = Field(None)
    hacker_news_mentions_count: Optional[int] = Field(None)
    stackoverflow_questions_count: Optional[int] = Field(None)
    producthunt_ranking: Optional[int] = Field(None)
    devto_articles_count: Optional[int] = Field(None)
    npm_packages_count: Optional[int] = Field(None)
    npm_weekly_downloads: Optional[int] = Field(None)
    pypi_packages_count: Optional[int] = Field(None)
    medium_articles_count: Optional[int] = Field(None)
    list_of_companies_using_tool: List[str] = Field([])
    case_studies: List[str] = Field([])
    testimonials: List[str] = Field([])


class ToolSnapshotData(BaseModel):
    """The complete structured data model for a single tool snapshot."""
    basic_info: BasicInfo = Field(default_factory=BasicInfo)
    technical_details: TechnicalDetails = Field(default_factory=TechnicalDetails)
    company_info: CompanyInfo = Field(default_factory=CompanyInfo)
    community_metrics: CommunityMetrics = Field(default_factory=CommunityMetrics)
