from pydantic import BaseModel, Field
from typing import List, Optional

class BasicInfo(BaseModel):
    description: Optional[str] = Field(None, description="A summary of the tool's purpose and features.")
    category_classification: Optional[str] = Field(None, description="The category of the tool (e.g., AI_IDE, CODE_COMPLETION).")
    
class TechnicalDetails(BaseModel):
    feature_list: List[str] = Field([], description="A list of key features.")
    technology_stack: List[str] = Field([], description="The primary technologies used to build the tool.")
    pricing_model: dict = Field({}, description="Information on pricing tiers.")
    
class CompanyInfo(BaseModel):
    stock_price: Optional[float] = Field(None)
    market_cap: Optional[str] = Field(None)
    news_mentions: Optional[int] = Field(None)

class CommunityMetrics(BaseModel):
    github_stars: Optional[int] = Field(None)
    github_forks: Optional[int] = Field(None)
    github_last_commit_date: Optional[str] = Field(None)
    reddit_mentions: Optional[int] = Field(None)
    reddit_sentiment_score: Optional[float] = Field(None)

class ToolSnapshotData(BaseModel):
    """The complete structured data model for a single tool snapshot."""
    basic_info: BasicInfo = Field(default_factory=BasicInfo)
    technical_details: TechnicalDetails = Field(default_factory=TechnicalDetails)
    company_info: CompanyInfo = Field(default_factory=CompanyInfo)
    community_metrics: CommunityMetrics = Field(default_factory=CommunityMetrics)
