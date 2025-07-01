const fs = require('fs');
const path = require('path');

// Copy curated export to local data directory
const sourceFile = path.join(__dirname, '..', '..', 'database', 'curated_export.json');
const targetDir = path.join(__dirname, '..', 'data');
const targetFile = path.join(targetDir, 'curated_export.json');

// Ensure data directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy the file
if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('✅ Curated export data copied successfully');
} else {
  console.error('❌ Source curated export file not found:', sourceFile);
  process.exit(1);
}

// Transform the data
const rawData = fs.readFileSync(targetFile, 'utf8');
const tools = JSON.parse(rawData);

console.log(`📊 Processing ${tools.length} AI tools...`);

// Generate transformed data
function transformData() {
  const totalTools = tools.length;
  const categories = [...new Set(tools.map(tool => tool.category))];
  
  let totalFundingNum = 0;
  const valuations = [];
  const fundingByCategory = {};
  
  tools.forEach(tool => {
    if (tool.snapshots?.[0]?.company_info) {
      const companyInfo = tool.snapshots[0].company_info;
      
      // Parse valuation
      if (companyInfo.valuation) {
        const valStr = companyInfo.valuation.replace(/[^0-9]/g, '');
        if (valStr) {
          const multiplier = companyInfo.valuation.toLowerCase().includes('billion') ? 1000000000 : 1000000;
          const val = parseInt(valStr) * multiplier;
          valuations.push({
            name: tool.name,
            valuation: val,
            category: tool.category,
            company: tool.company_name
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
    company: tool.company_name,
    category: tool.category,
    mentions: tool.snapshots?.[0]?.community_metrics?.reddit_mentions || 0,
    stars: tool.snapshots?.[0]?.raw_data?.github_data?.stars || 0
  })).filter(item => item.mentions > 0 || item.stars > 0);
  
  // Recent news aggregation
  const recentNews = [];
  tools.forEach(tool => {
    const articles = tool.snapshots?.[0]?.raw_data?.news_data?.articles || [];
    articles.slice(0, 3).forEach(article => {
      recentNews.push({
        title: article.title,
        source: article.source,
        date: article.published_at,
        tool: tool.name,
        company: tool.company_name
      });
    });
  });
  
  // Sort by date and take most recent
  recentNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Format currency helper
  function formatCurrency(amount) {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  }
  
  return {
    overview: {
      totalTools,
      totalFunding: formatCurrency(totalFundingNum),
      totalFundingAmount: totalFundingNum,
      categories,
      lastUpdated: new Date().toISOString()
    },
    tools,
    marketMetrics: {
      fundingByCategory,
      valuations: valuations.sort((a, b) => b.valuation - a.valuation),
      communityEngagement: communityEngagement.sort((a, b) => (b.mentions + b.stars) - (a.mentions + a.stars))
    },
    recentNews: recentNews.slice(0, 15)
  };
}

const transformedData = transformData();

// Write transformed data
fs.writeFileSync(
  path.join(targetDir, 'dashboard-data.json'),
  JSON.stringify(transformedData, null, 2)
);

console.log('✅ Dashboard data generated successfully');
console.log(`📈 Total funding tracked: ${transformedData.overview.totalFunding}`);
console.log(`🏢 Categories: ${transformedData.overview.categories.join(', ')}`);
console.log(`📰 Recent news articles: ${transformedData.recentNews.length}`);
console.log(`⭐ Community metrics: ${transformedData.marketMetrics.communityEngagement.length} tools with engagement data`);