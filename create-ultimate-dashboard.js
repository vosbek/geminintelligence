const fs = require('fs');
const path = require('path');

// Load the dashboard data
const dataPath = path.join(__dirname, 'github-pages', 'data', 'dashboard-data.json');
const dashboardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🎨 Creating ultimate executive dashboard with ALL data and premium design...');

// Extract ALL the rich data available
function extractAllData(data) {
    let totalGithubStars = 0;
    let totalGithubForks = 0;
    let totalRedditMentions = 0;
    let totalFeatures = 0;
    let totalTestimonials = 0;
    let totalEnterprises = 0;
    let totalNewsArticles = 0;
    let totalRedditPosts = 0;
    
    data.tools.forEach(tool => {
        const snapshot = tool.snapshots?.[0];
        if (!snapshot) return;
        
        // GitHub metrics
        const githubData = snapshot.raw_data?.github_data;
        if (githubData) {
            totalGithubStars += githubData.stars || 0;
            totalGithubForks += githubData.forks || 0;
        }
        
        // Community metrics
        totalRedditMentions += snapshot.community_metrics?.reddit_mentions || 0;
        
        // Content metrics
        totalFeatures += (snapshot.technical_details?.feature_list || []).length;
        totalTestimonials += (snapshot.company_info?.testimonials || []).length;
        totalEnterprises += (snapshot.company_info?.list_of_companies_using_tool || []).length;
        
        // News and content
        totalNewsArticles += (snapshot.raw_data?.news_data?.articles || []).length;
        
        // Reddit posts
        const redditResults = snapshot.raw_data?.reddit_data?.search_results || [];
        totalRedditPosts += redditResults.length;
    });
    
    return {
        totalGithubStars,
        totalGithubForks,
        totalRedditMentions,
        totalFeatures,
        totalTestimonials,
        totalEnterprises,
        totalNewsArticles,
        totalRedditPosts,
        totalFunding: data.overview.totalFundingAmount,
        totalFundingDisplay: data.overview.totalFunding
    };
}

const allData = extractAllData(dashboardData);

// Create the ultimate dashboard
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Developer Tools | Executive Market Intelligence</title>
    <meta name="description" content="Comprehensive market intelligence on AI developer tools with funding, enterprise adoption, community metrics, and competitive analysis">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            --gradient-accent: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            --gradient-dark: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            --color-navy: #1a202c;
            --color-gray-900: #1a202c;
            --color-gray-800: #2d3748;
            --color-gray-700: #4a5568;
            --color-gray-600: #718096;
            --color-gray-500: #a0aec0;
            --color-gray-400: #cbd5e0;
            --color-gray-300: #e2e8f0;
            --color-gray-200: #edf2f7;
            --color-gray-100: #f7fafc;
            --color-white: #ffffff;
            --color-blue-600: #3182ce;
            --color-blue-500: #4299e1;
            --color-green-500: #48bb78;
            --color-purple-500: #9f7aea;
            --color-red-500: #f56565;
            --color-yellow-500: #ed8936;
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--color-gray-100);
            color: var(--color-gray-900);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }
        
        /* Header */
        .header {
            background: var(--color-white);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--color-gray-200);
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: var(--shadow-md);
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logo-icon {
            width: 48px;
            height: 48px;
            background: var(--gradient-primary);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 1.25rem;
            box-shadow: var(--shadow-lg);
        }
        
        .logo-text {
            font-size: 1.5rem;
            font-weight: 800;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header-meta {
            display: flex;
            flex-direction: column;
            align-items: end;
            gap: 0.25rem;
        }
        
        .last-updated {
            font-size: 0.875rem;
            color: var(--color-gray-600);
            font-weight: 500;
        }
        
        .data-sources {
            font-size: 0.75rem;
            color: var(--color-gray-500);
        }
        
        /* Hero Section */
        .hero {
            background: var(--gradient-primary);
            color: white;
            padding: 4rem 0;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
            text-align: center;
        }
        
        .hero-title {
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            letter-spacing: -0.025em;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 3rem;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .hero-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .hero-stat {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 2rem 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .hero-stat:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.2);
        }
        
        .hero-stat-number {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            display: block;
        }
        
        .hero-stat-label {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.9;
        }
        
        /* Main Content */
        .main-content {
            padding: 4rem 0;
        }
        
        .section {
            margin-bottom: 4rem;
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--color-gray-900);
            margin-bottom: 1rem;
            letter-spacing: -0.025em;
        }
        
        .section-subtitle {
            font-size: 1.125rem;
            color: var(--color-gray-600);
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* Tool Cards */
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 2rem;
        }
        
        .tool-card {
            background: var(--color-white);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: var(--shadow-lg);
            transition: all 0.3s ease;
            border: 1px solid var(--color-gray-200);
            position: relative;
            overflow: hidden;
        }
        
        .tool-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient-primary);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .tool-card:hover {
            transform: translateY(-8px);
            box-shadow: var(--shadow-xl);
        }
        
        .tool-card:hover::before {
            opacity: 1;
        }
        
        .tool-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
        }
        
        .tool-info h3 {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--color-gray-900);
            margin-bottom: 0.25rem;
        }
        
        .tool-company {
            font-size: 0.875rem;
            color: var(--color-gray-600);
            font-weight: 500;
        }
        
        .tool-valuation {
            background: var(--gradient-accent);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 700;
            box-shadow: var(--shadow-md);
        }
        
        .tool-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .tool-metric {
            text-align: center;
            padding: 1rem;
            background: var(--color-gray-100);
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        
        .tool-metric:hover {
            background: var(--color-gray-200);
            transform: scale(1.05);
        }
        
        .tool-metric-value {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--color-gray-900);
            margin-bottom: 0.25rem;
        }
        
        .tool-metric-label {
            font-size: 0.75rem;
            color: var(--color-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .tool-description {
            color: var(--color-gray-700);
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        
        .tool-features {
            margin-bottom: 1.5rem;
        }
        
        .tool-features-title {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--color-gray-900);
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
        }
        
        .feature-tag {
            background: var(--color-gray-200);
            color: var(--color-gray-800);
            padding: 0.375rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .feature-tag:hover {
            background: var(--color-blue-500);
            color: white;
        }
        
        .tool-enterprises {
            margin-bottom: 1.5rem;
        }
        
        .enterprises-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
        }
        
        .enterprise-tag {
            background: var(--gradient-secondary);
            color: white;
            padding: 0.375rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            text-align: center;
            box-shadow: var(--shadow-md);
        }
        
        .tool-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1.5rem;
            border-top: 1px solid var(--color-gray-200);
        }
        
        .tool-links {
            display: flex;
            gap: 0.5rem;
        }
        
        .tool-link {
            background: var(--color-gray-100);
            color: var(--color-gray-700);
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .tool-link:hover {
            background: var(--color-blue-500);
            color: white;
        }
        
        .view-details {
            background: var(--gradient-primary);
            color: white;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-md);
        }
        
        .view-details:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        /* Investment Section */
        .investment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }
        
        .investment-card {
            background: var(--color-white);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--color-gray-200);
        }
        
        .investment-card h3 {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--color-gray-900);
            margin-bottom: 1.5rem;
        }
        
        .ranking-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: var(--color-gray-100);
            border-radius: 12px;
            margin-bottom: 0.75rem;
            transition: all 0.2s ease;
        }
        
        .ranking-item:hover {
            background: var(--color-gray-200);
            transform: translateX(4px);
        }
        
        .ranking-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .ranking-number {
            width: 2rem;
            height: 2rem;
            background: var(--gradient-primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.875rem;
        }
        
        .ranking-name {
            font-weight: 700;
            color: var(--color-gray-900);
        }
        
        .ranking-value {
            font-weight: 800;
            color: var(--color-green-500);
        }
        
        /* News Section */
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        
        .news-item {
            background: var(--color-white);
            border-radius: 16px;
            padding: 1.5rem;
            border-left: 4px solid var(--color-blue-500);
            box-shadow: var(--shadow-md);
            transition: all 0.3s ease;
        }
        
        .news-item:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
        }
        
        .news-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--color-gray-900);
            margin-bottom: 0.75rem;
            line-height: 1.4;
        }
        
        .news-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
            color: var(--color-gray-600);
            font-weight: 600;
        }
        
        /* Footer */
        .footer {
            background: var(--gradient-dark);
            color: white;
            padding: 3rem 0;
            text-align: center;
        }
        
        .footer-content {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.875rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.5rem;
            }
            
            .tools-grid {
                grid-template-columns: 1fr;
            }
            
            .tool-metrics {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .hero-stats {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (max-width: 480px) {
            .hero-stats {
                grid-template-columns: 1fr;
            }
            
            .tool-metrics {
                grid-template-columns: 1fr;
            }
        }
        
        /* Animations */
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-slide-up {
            animation: slideUp 0.6s ease-out;
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--color-gray-200);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--gradient-primary);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--gradient-secondary);
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <div class="logo-icon">AI</div>
                    <div class="logo-text">Market Intelligence</div>
                </div>
                <div class="header-meta">
                    <div class="last-updated">
                        Updated: ${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                    <div class="data-sources">
                        ${allData.totalNewsArticles} articles • ${allData.totalRedditPosts} Reddit posts • GitHub data
                    </div>
                </div>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1 class="hero-title">AI Developer Tools Market Intelligence</h1>
                <p class="hero-subtitle">
                    Comprehensive analysis of ${dashboardData.tools.length} market-leading AI development tools with 
                    ${allData.totalFundingDisplay} in funding, ${allData.totalEnterprises} enterprise customers, 
                    and ${allData.totalNewsArticles} news articles analyzed
                </p>
                
                <div class="hero-stats">
                    <div class="hero-stat">
                        <span class="hero-stat-number">${allData.totalFundingDisplay}</span>
                        <span class="hero-stat-label">Total Funding</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-number">${allData.totalEnterprises.toLocaleString()}</span>
                        <span class="hero-stat-label">Enterprise Customers</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-number">${allData.totalGithubStars.toLocaleString()}</span>
                        <span class="hero-stat-label">GitHub Stars</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-number">${allData.totalFeatures.toLocaleString()}</span>
                        <span class="hero-stat-label">Features Tracked</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-number">${allData.totalNewsArticles.toLocaleString()}</span>
                        <span class="hero-stat-label">News Articles</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-number">${allData.totalRedditPosts.toLocaleString()}</span>
                        <span class="hero-stat-label">Reddit Discussions</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="container">
        <div class="main-content">
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">Market Leaders</h2>
                    <p class="section-subtitle">
                        Comprehensive analysis of each tool with complete financial, technical, and community data
                    </p>
                </div>
                
                <div class="tools-grid">
                    ${generateComprehensiveToolCards(dashboardData.tools)}
                </div>
            </section>

            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">Investment Intelligence</h2>
                    <p class="section-subtitle">
                        Valuations, funding rounds, and market position analysis
                    </p>
                </div>
                
                <div class="investment-grid">
                    ${generateInvestmentCards(dashboardData)}
                </div>
            </section>

            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">Market Intelligence</h2>
                    <p class="section-subtitle">
                        Recent developments and strategic insights from ${allData.totalNewsArticles} analyzed articles
                    </p>
                </div>
                
                <div class="news-grid">
                    ${generateNewsCards(dashboardData.recentNews.slice(0, 8))}
                </div>
            </section>
        </div>
    </div>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                Strategic Market Intelligence Platform • ${allData.totalNewsArticles} articles analyzed • 
                ${allData.totalRedditPosts} community discussions • ${allData.totalGithubStars.toLocaleString()} GitHub stars tracked
            </div>
        </div>
    </footer>

    <script>
        // Add scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.tool-card, .investment-card, .news-item').forEach(el => {
            observer.observe(el);
        });
    </script>
</body>
</html>`;

function generateComprehensiveToolCards(tools) {
    return tools.map(tool => {
        const snapshot = tool.snapshots?.[0];
        if (!snapshot) return '';
        
        const basicInfo = snapshot.basic_info || {};
        const techDetails = snapshot.technical_details || {};
        const companyInfo = snapshot.company_info || {};
        const communityMetrics = snapshot.community_metrics || {};
        const rawData = snapshot.raw_data || {};
        
        // Extract ALL the data
        const valuation = companyInfo.valuation;
        const funding = companyInfo.total_funding_amount;
        const enterprises = companyInfo.list_of_companies_using_tool || [];
        const features = techDetails.feature_list || [];
        const testimonials = companyInfo.testimonials || [];
        const githubData = rawData.github_data || {};
        const newsArticles = rawData.news_data?.articles || [];
        const redditData = rawData.reddit_data?.search_results || [];
        
        // Calculate metrics
        const fundingAmount = funding ? parseInt(funding.replace(/[^0-9]/g, '')) / 1000000 : 0;
        const githubStars = githubData.stars || 0;
        const githubForks = githubData.forks || 0;
        const redditMentions = communityMetrics.reddit_mentions || 0;
        
        const websiteUrl = tool.urls?.find(url => url.url_type === 'website')?.url;
        const githubUrl = tool.github_url;
        
        return `
            <div class="tool-card">
                <div class="tool-header">
                    <div class="tool-info">
                        <h3>${tool.name}</h3>
                        <div class="tool-company">${tool.company_name} • ${tool.legal_company_name}</div>
                    </div>
                    ${valuation ? `<div class="tool-valuation">${valuation}</div>` : ''}
                </div>
                
                <div class="tool-metrics">
                    <div class="tool-metric">
                        <div class="tool-metric-value">$${fundingAmount.toFixed(0)}M</div>
                        <div class="tool-metric-label">Funding</div>
                    </div>
                    <div class="tool-metric">
                        <div class="tool-metric-value">${enterprises.length}</div>
                        <div class="tool-metric-label">Enterprises</div>
                    </div>
                    <div class="tool-metric">
                        <div class="tool-metric-value">${githubStars.toLocaleString()}</div>
                        <div class="tool-metric-label">GitHub ⭐</div>
                    </div>
                    <div class="tool-metric">
                        <div class="tool-metric-value">${features.length}</div>
                        <div class="tool-metric-label">Features</div>
                    </div>
                </div>
                
                <div class="tool-description">
                    ${basicInfo.description || tool.description}
                </div>
                
                ${features.length > 0 ? `
                <div class="tool-features">
                    <div class="tool-features-title">Key Features (${features.length})</div>
                    <div class="features-grid">
                        ${features.slice(0, 8).map(feature => `<div class="feature-tag">${feature}</div>`).join('')}
                        ${features.length > 8 ? `<div class="feature-tag">+${features.length - 8} more</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${enterprises.length > 0 ? `
                <div class="tool-enterprises">
                    <div class="tool-features-title">Enterprise Customers (${enterprises.length})</div>
                    <div class="enterprises-grid">
                        ${enterprises.slice(0, 8).map(company => `<div class="enterprise-tag">${company}</div>`).join('')}
                        ${enterprises.length > 8 ? `<div class="enterprise-tag">+${enterprises.length - 8} more</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="tool-footer">
                    <div class="tool-links">
                        ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" class="tool-link">Website</a>` : ''}
                        ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="tool-link">GitHub</a>` : ''}
                        ${newsArticles.length > 0 ? `<span class="tool-link">${newsArticles.length} articles</span>` : ''}
                        ${redditData.length > 0 ? `<span class="tool-link">${redditData.length} Reddit posts</span>` : ''}
                    </div>
                    <a href="tools/${tool.id}.html" class="view-details">Complete Analysis</a>
                </div>
            </div>
        `;
    }).join('');
}

function generateInvestmentCards(data) {
    const valuations = data.marketMetrics.valuations.slice(0, 5);
    
    return `
        <div class="investment-card">
            <h3>Valuation Leaders</h3>
            ${valuations.map((company, index) => `
                <div class="ranking-item">
                    <div class="ranking-left">
                        <div class="ranking-number">${index + 1}</div>
                        <div class="ranking-name">${company.name}</div>
                    </div>
                    <div class="ranking-value">$${(company.valuation / 1000000000).toFixed(1)}B</div>
                </div>
            `).join('')}
        </div>
        
        <div class="investment-card">
            <h3>Community Engagement</h3>
            ${data.marketMetrics.communityEngagement.slice(0, 5).map((tool, index) => `
                <div class="ranking-item">
                    <div class="ranking-left">
                        <div class="ranking-number">${index + 1}</div>
                        <div class="ranking-name">${tool.name}</div>
                    </div>
                    <div class="ranking-value">${tool.mentions + tool.stars} total</div>
                </div>
            `).join('')}
        </div>
        
        <div class="investment-card">
            <h3>Market Metrics</h3>
            <div class="ranking-item">
                <div class="ranking-name">Total Funding Tracked</div>
                <div class="ranking-value">${data.overview.totalFunding}</div>
            </div>
            <div class="ranking-item">
                <div class="ranking-name">Enterprise Customers</div>
                <div class="ranking-value">${allData.totalEnterprises}</div>
            </div>
            <div class="ranking-item">
                <div class="ranking-name">GitHub Stars</div>
                <div class="ranking-value">${allData.totalGithubStars.toLocaleString()}</div>
            </div>
            <div class="ranking-item">
                <div class="ranking-name">Features Tracked</div>
                <div class="ranking-value">${allData.totalFeatures}</div>
            </div>
            <div class="ranking-item">
                <div class="ranking-name">News Articles</div>
                <div class="ranking-value">${allData.totalNewsArticles}</div>
            </div>
        </div>
    `;
}

function generateNewsCards(news) {
    return news.map(item => `
        <div class="news-item">
            <div class="news-title">${item.title}</div>
            <div class="news-meta">
                <span>${item.source} • ${item.tool}</span>
                <span>${new Date(item.date).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// Write the ultimate dashboard
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

fs.writeFileSync(path.join(docsDir, 'index.html'), html);
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

console.log('✅ Ultimate executive dashboard created!');
console.log('🎨 Premium design with gradients, shadows, and animations');
console.log('📊 ALL data now displayed:');
console.log(`   • Total funding: ${allData.totalFundingDisplay}`);
console.log(`   • Enterprise customers: ${allData.totalEnterprises}`);
console.log(`   • GitHub stars: ${allData.totalGithubStars.toLocaleString()}`);
console.log(`   • Features tracked: ${allData.totalFeatures}`);
console.log(`   • News articles: ${allData.totalNewsArticles}`);
console.log(`   • Reddit posts: ${allData.totalRedditPosts}`);
console.log(`   • Testimonials: ${allData.totalTestimonials}`);
console.log('🚀 Ready for executive consumption!');