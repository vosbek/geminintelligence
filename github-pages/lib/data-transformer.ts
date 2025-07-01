import fs from 'fs';
import path from 'path';

export interface AITool {
  id: number;
  name: string;
  description: string;
  github_url: string | null;
  stock_symbol: string | null;
  category: string;
  company_name: string;
  legal_company_name: string;
  status: string;
  urls: Array<{
    url: string;
    url_type: string;
  }>;
  snapshots: Array<{
    basic_info: {
      description: string;
      category_classification: string;
    };
    technical_details: {
      feature_list: string[];
      pricing_model: Record<string, string>;
      comparable_tools: string[];
      unique_differentiators: string[];
      deployment_options: string[];
      supported_languages: string[];
      market_positioning: string;
    };
    company_info: {
      valuation: string | null;
      funding_rounds: Array<Record<string, string>>;
      total_funding_amount: string;
      business_model: string;
      list_of_companies_using_tool: string[];
      testimonials: string[];
      case_studies: string[];
    };
    community_metrics: {
      reddit_mentions: number;
      github_stars: number | null;
      github_forks: number | null;
    };
    raw_data: {
      news_data: {
        articles: Array<{
          title: string;
          source: string;
          published_at: string;
          url: string;
        }>;
        total_articles: number;
      };
      github_data: {
        stars: number;
        forks: number;
        open_issues: number;
      } | null;
    };
  }>;
}

export interface TransformedData {
  overview: {
    totalTools: number;
    totalFunding: string;
    categories: string[];
    lastUpdated: string;
  };
  tools: AITool[];
  marketMetrics: {
    fundingByCategory: Record<string, number>;
    valuations: Array<{ name: string; valuation: number; category: string }>;
    communityEngagement: Array<{ name: string; mentions: number; stars: number }>;
  };
  recentNews: Array<{
    title: string;
    source: string;
    date: string;
    tool: string;
  }>;
}

export function transformCuratedData(filePath: string): TransformedData {
  const rawData = fs.readFileSync(filePath, 'utf8');
  const tools: AITool[] = JSON.parse(rawData);
  
  // Calculate overview metrics
  const totalTools = tools.length;
  const categories = [...new Set(tools.map(tool => tool.category))];
  
  // Calculate total funding
  let totalFundingNum = 0;
  const valuations: Array<{ name: string; valuation: number; category: string }> = [];
  const fundingByCategory: Record<string, number> = {};
  
  tools.forEach(tool => {
    if (tool.snapshots?.[0]?.company_info) {
      const companyInfo = tool.snapshots[0].company_info;
      
      // Parse valuation
      if (companyInfo.valuation) {
        const valStr = companyInfo.valuation.replace(/[^0-9]/g, '');
        if (valStr) {
          const val = parseInt(valStr) * (companyInfo.valuation.includes('billion') ? 1000000000 : 1000000);
          valuations.push({
            name: tool.name,
            valuation: val,
            category: tool.category
          });
        }
      }
      
      // Parse total funding
      if (companyInfo.total_funding_amount) {
        const fundingStr = companyInfo.total_funding_amount.replace(/[^0-9]/g, '');
        if (fundingStr) {
          const funding = parseInt(fundingStr);
          totalFundingNum += funding;
          
          if (!fundingByCategory[tool.category]) {
            fundingByCategory[tool.category] = 0;
          }
          fundingByCategory[tool.category] += funding;
        }
      }
    }
  });
  
  // Community engagement metrics
  const communityEngagement = tools.map(tool => ({
    name: tool.name,
    mentions: tool.snapshots?.[0]?.community_metrics?.reddit_mentions || 0,
    stars: tool.snapshots?.[0]?.raw_data?.github_data?.stars || 0
  })).filter(item => item.mentions > 0 || item.stars > 0);
  
  // Recent news aggregation
  const recentNews: Array<{ title: string; source: string; date: string; tool: string }> = [];
  tools.forEach(tool => {
    const articles = tool.snapshots?.[0]?.raw_data?.news_data?.articles || [];
    articles.slice(0, 3).forEach(article => {
      recentNews.push({
        title: article.title,
        source: article.source,
        date: article.published_at,
        tool: tool.name
      });
    });
  });
  
  // Sort by date and take most recent
  recentNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return {
    overview: {
      totalTools,
      totalFunding: formatCurrency(totalFundingNum),
      categories,
      lastUpdated: new Date().toISOString()
    },
    tools,
    marketMetrics: {
      fundingByCategory,
      valuations: valuations.sort((a, b) => b.valuation - a.valuation),
      communityEngagement: communityEngagement.sort((a, b) => (b.mentions + b.stars) - (a.mentions + a.stars))
    },
    recentNews: recentNews.slice(0, 10)
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else {
    return `$${amount.toLocaleString()}`;
  }
}

// Static data generation for Next.js
export async function generateStaticData() {
  const dataPath = path.join(process.cwd(), '..', 'database', 'curated_export.json');
  const transformedData = transformCuratedData(dataPath);
  
  // Write transformed data to static files
  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'transformed-data.json'),
    JSON.stringify(transformedData, null, 2)
  );
  
  return transformedData;
}