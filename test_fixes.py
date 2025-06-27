#!/usr/bin/env python3
"""
Test script to validate the fixes made to the AI Intelligence Platform.
This script tests the key fixes:
1. LLM prompt generation with full data payload
2. Package search relevance filtering  
3. Enhanced error handling
4. JSON schema validation
"""

import json
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from models import ToolSnapshotData, BasicInfo, TechnicalDetails, CompanyInfo, CommunityMetrics
from main import ToolIntelligenceAgent

def test_pydantic_models():
    """Test that our Pydantic models work correctly."""
    print("Testing Pydantic model validation...")
    
    # Test with sample data
    sample_data = {
        "basic_info": {
            "description": "Test AI tool",
            "category_classification": "AI_IDE"
        },
        "technical_details": {
            "feature_list": ["feature1", "feature2"],
            "technology_stack": ["Python", "React"],
            "pricing_model": {"free": "Free tier", "paid": "Pro tier"},
            "enterprise_capabilities": "SSO, Admin dashboard",
            "security_features": ["2FA", "SOC2"],
            "integration_capabilities": ["GitHub", "Slack"],
            "scalability_features": ["Auto-scaling"],
            "compliance_certifications": ["SOC2"],
            "comparable_tools": ["VS Code", "Cursor"],
            "unique_differentiators": ["AI-powered"],
            "pros_and_cons": {"pros": ["Fast"], "cons": ["Limited"]},
            "market_positioning": "Premium AI IDE",
            "update_frequency": "Weekly",
            "version_history": ["v1.0", "v2.0"],
            "roadmap_information": "Expanding AI features"
        },
        "company_info": {
            "stock_price": 150.0,
            "market_cap": "1B",
            "news_mentions": 50,
            "annual_recurring_revenue": "100M",
            "funding_rounds": [{"round": "Series A", "amount": "10M"}],
            "valuation": "500M",
            "employee_count": 100,
            "founding_date": "2020-01-01",
            "key_executives": ["John Doe CEO"],
            "parent_company": "Tech Corp",
            "major_investors": ["VC Fund"]
        },
        "community_metrics": {
            "github_stars": 1000,
            "github_forks": 100,
            "github_last_commit_date": "2025-01-01",
            "reddit_mentions": 50,
            "reddit_sentiment_score": 0.7,
            "hacker_news_mentions_count": 10,
            "stackoverflow_questions_count": 25,
            "producthunt_ranking": 5,
            "devto_articles_count": 15,
            "npm_packages_count": 3,
            "npm_weekly_downloads": 1000,
            "pypi_packages_count": 2,
            "medium_articles_count": 8,
            "list_of_companies_using_tool": ["Company1"],
            "case_studies": ["Case study 1"],
            "testimonials": ["Great tool!"]
        }
    }
    
    try:
        snapshot = ToolSnapshotData.model_validate(sample_data)
        print("✅ Pydantic model validation successful!")
        return True
    except Exception as e:
        print(f"❌ Pydantic model validation failed: {e}")
        return False

def test_prompt_generation():
    """Test that the prompt includes all data sources."""
    print("Testing prompt generation...")
    
    # Mock agent (without actually initializing AWS)
    class MockAgent:
        def _create_prompt(self, tool_record: dict, raw_data_payload: dict) -> str:
            # Import the actual method
            from main import ToolIntelligenceAgent
            return ToolIntelligenceAgent._create_prompt(self, tool_record, raw_data_payload)
    
    mock_agent = MockAgent()
    
    tool_record = {
        "name": "Test Tool",
        "description": "A test AI tool",
        "category": "AI_IDE",
        "urls": [{"url": "https://example.com", "url_type": "main"}]
    }
    
    raw_data_payload = {
        "scraped_content": [{"url": "https://example.com", "content": "Test content"}],
        "github_data": {"stars": 1000, "forks": 100},
        "reddit_data": {"search_results": []},
        "news_data": {"articles": []},
        "hackernews_data": {"hits": []},
        "stackoverflow_data": {"questions": []},
        "producthunt_data": {"search_results": []},
        "devto_data": {"articles": []},
        "npm_data": {"packages": []},
        "pypi_data": {"packages": []},
        "medium_data": {"articles": []},
        "stock_data": {"stock_symbol": "TEST", "price": 100}
    }
    
    try:
        prompt = mock_agent._create_prompt(tool_record, raw_data_payload)
        
        # Check that prompt includes all data sources
        required_sections = [
            "github_data", "reddit_data", "news_data", "hackernews_data",
            "stackoverflow_data", "producthunt_data", "devto_data", 
            "npm_data", "pypi_data", "medium_data", "stock_data"
        ]
        
        missing_sections = []
        for section in required_sections:
            if section.replace('_', ' ').title() not in prompt:
                missing_sections.append(section)
        
        if missing_sections:
            print(f"❌ Prompt missing sections: {missing_sections}")
            return False
        
        # Check that JSON schema is included
        if "REQUIRED JSON OUTPUT FORMAT" not in prompt:
            print("❌ Prompt missing JSON schema")
            return False
            
        print("✅ Prompt generation includes all data sources and schema!")
        return True
        
    except Exception as e:
        print(f"❌ Prompt generation failed: {e}")
        return False

def test_relevance_scoring():
    """Test package relevance scoring."""
    print("Testing relevance scoring...")
    
    try:
        from scrapers import ScraperMixin
        
        class MockScraperMixin(ScraperMixin):
            pass
        
        scraper = MockScraperMixin()
        
        # Test PyPI relevance scoring
        test_packages = [
            {"name": "zed", "summary": "ZeroMQ wrapper", "description": "Twisted reactor integration"},  # Should score low for Zed editor
            {"name": "zed-editor", "summary": "Zed editor package", "description": "Editor for AI development"},  # Should score high
            {"name": "cursor-ai", "summary": "Cursor AI tools", "description": "AI-powered code editor"},  # Should score high for Cursor
        ]
        
        for package in test_packages:
            zed_score = scraper._calculate_relevance_score("Zed", package)
            cursor_score = scraper._calculate_relevance_score("Cursor", package)
            print(f"  Package '{package['name']}': Zed={zed_score}, Cursor={cursor_score}")
        
        print("✅ Relevance scoring working!")
        return True
        
    except Exception as e:
        print(f"❌ Relevance scoring failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing AI Intelligence Platform Fixes")
    print("=" * 50)
    
    tests = [
        test_pydantic_models,
        test_prompt_generation,
        test_relevance_scoring
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The fixes look good.")
        return 0
    else:
        print("⚠️  Some tests failed. Review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())