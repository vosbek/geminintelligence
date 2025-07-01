const fs = require('fs');
const path = require('path');

// Load the dashboard data
const dataPath = path.join(__dirname, 'github-pages', 'data', 'dashboard-data.json');
const dashboardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔧 Creating comprehensive tool intelligence pages...');

// Create tools directory
const toolsDir = path.join(__dirname, 'docs', 'tools');
if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
}

// Create tools index with comprehensive data
const toolsIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Tools Directory | Market Intelligence</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-navy: #0f172a;
            --color-slate: #1e293b;
            --color-blue: #1e40af;
            --color-gray: #64748b;
            --color-light: #f8fafc;
            --color-white: #ffffff;
            --color-green: #059669;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--color-light);
            color: var(--color-navy);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }
        
        .header {
            background: var(--color-white);
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 0;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: inherit;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-slate) 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.125rem;
        }
        
        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-navy);
        }
        
        .nav-link {
            color: var(--color-blue);
            text-decoration: none;
            font-weight: 500;
        }
        
        .hero {
            background: var(--color-white);
            padding: 3rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .hero-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--color-navy);
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .hero-subtitle {
            font-size: 1.125rem;
            color: var(--color-gray);
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        
        .tool-card {
            background: var(--color-white);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 2rem;
            text-decoration: none;
            color: inherit;
            transition: all 0.2s ease;
        }
        
        .tool-card:hover {
            border-color: var(--color-blue);
            box-shadow: 0 4px 20px rgba(30, 64, 175, 0.1);
            transform: translateY(-2px);
        }
        
        .tool-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
        }
        
        .tool-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-navy);
            margin-bottom: 0.25rem;
        }
        
        .tool-company {
            font-size: 0.875rem;
            color: var(--color-gray);
        }
        
        .tool-valuation {
            background: var(--color-green);
            color: white;
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        
        .tool-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .stat {
            text-align: center;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .stat-value {
            font-size: 1rem;
            font-weight: 700;
            color: var(--color-navy);
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: var(--color-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .tool-description {
            color: var(--color-gray);
            font-size: 0.875rem;
            line-height: 1.5;
            margin-bottom: 1rem;
        }
        
        .enterprise-preview {
            font-size: 0.75rem;
            color: var(--color-gray);
            margin-bottom: 1rem;
        }
        
        .view-details {
            color: var(--color-blue);
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2rem;
            }
            
            .tools-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="../index.html" class="logo">
                    <div class="logo-icon">AI</div>
                    <div class="logo-text">Market Intelligence</div>
                </a>
                <a href="../index.html" class="nav-link">← Back to Dashboard</a>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1 class="hero-title">AI Developer Tools Directory</h1>
            <p class="hero-subtitle">
                Comprehensive intelligence on ${dashboardData.tools.length} market-leading AI development tools
                with detailed financial, technical, and enterprise adoption analysis
            </p>
        </div>
    </section>

    <div class="container">
        <div class="tools-grid">
            ${dashboardData.tools.map(tool => {
                const snapshot = tool.snapshots?.[0];
                if (!snapshot) return '';
                
                const valuation = snapshot.company_info?.valuation;
                const funding = snapshot.company_info?.total_funding_amount;
                const enterprises = snapshot.company_info?.list_of_companies_using_tool || [];
                const features = snapshot.technical_details?.feature_list || [];
                const testimonials = snapshot.company_info?.testimonials || [];
                
                const fundingAmount = funding ? parseInt(funding.replace(/[^0-9]/g, '')) / 1000000 : 0;
                
                return `
                    <a href="${tool.id}.html" class="tool-card">
                        <div class="tool-header">
                            <div>
                                <div class="tool-name">${tool.name}</div>
                                <div class="tool-company">${tool.company_name}</div>
                            </div>
                            ${valuation ? `<div class="tool-valuation">${valuation}</div>` : ''}
                        </div>
                        
                        <div class="tool-stats">
                            <div class="stat">
                                <div class="stat-value">$${fundingAmount.toFixed(0)}M</div>
                                <div class="stat-label">Funding</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${enterprises.length}</div>
                                <div class="stat-label">Enterprises</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${features.length}</div>
                                <div class="stat-label">Features</div>
                            </div>
                        </div>
                        
                        <div class="tool-description">
                            ${(snapshot.basic_info?.description || tool.description).substring(0, 150)}...
                        </div>
                        
                        ${enterprises.length > 0 ? `
                        <div class="enterprise-preview">
                            Enterprise customers: ${enterprises.slice(0, 4).join(', ')}${enterprises.length > 4 ? ` +${enterprises.length - 4} more` : ''}
                        </div>
                        ` : ''}
                        
                        <div class="view-details">View Complete Analysis →</div>
                    </a>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(toolsDir, 'index.html'), toolsIndexHtml);

// Create comprehensive individual tool pages
dashboardData.tools.forEach(tool => {
    const snapshot = tool.snapshots?.[0];
    if (!snapshot) return;
    
    const websiteUrl = tool.urls?.find(url => url.url_type === 'website')?.url;
    const githubUrl = tool.github_url;
    const blogUrl = tool.urls?.find(url => url.url_type === 'blog')?.url;
    
    // Extract all available data
    const basicInfo = snapshot.basic_info || {};
    const techDetails = snapshot.technical_details || {};
    const companyInfo = snapshot.company_info || {};
    const communityMetrics = snapshot.community_metrics || {};
    const rawData = snapshot.raw_data || {};
    
    const toolHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tool.name} - Complete Market Intelligence | AI Tools</title>
    <meta name="description" content="Comprehensive analysis of ${tool.name} by ${tool.company_name}: funding, enterprise adoption, technical specifications, and market position">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-navy: #0f172a;
            --color-slate: #1e293b;
            --color-blue: #1e40af;
            --color-gray: #64748b;
            --color-light: #f8fafc;
            --color-white: #ffffff;
            --color-green: #059669;
            --color-red: #dc2626;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--color-light);
            color: var(--color-navy);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }
        
        .header {
            background: var(--color-white);
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 0;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: inherit;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-slate) 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.125rem;
        }
        
        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-navy);
        }
        
        .nav-links {
            display: flex;
            gap: 1.5rem;
        }
        
        .nav-link {
            color: var(--color-blue);
            text-decoration: none;
            font-weight: 500;
        }
        
        .hero {
            background: var(--color-white);
            padding: 3rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .hero-content {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 3rem;
            align-items: center;
        }
        
        .hero-info h1 {
            font-size: 3rem;
            font-weight: 800;
            color: var(--color-navy);
            margin-bottom: 0.5rem;
        }
        
        .hero-company {
            font-size: 1.125rem;
            color: var(--color-gray);
            margin-bottom: 1rem;
        }
        
        .hero-description {
            font-size: 1.125rem;
            color: var(--color-gray);
            line-height: 1.6;
            max-width: 600px;
        }
        
        .hero-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-width: 200px;
        }
        
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: var(--color-blue);
            color: white;
        }
        
        .btn-primary:hover {
            background: #1d4ed8;
        }
        
        .btn-secondary {
            background: var(--color-white);
            color: var(--color-blue);
            border: 1px solid var(--color-blue);
        }
        
        .btn-secondary:hover {
            background: #eff6ff;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 3rem;
            margin: 3rem 0;
        }
        
        .content-section {
            background: var(--color-white);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-navy);
            margin-bottom: 1.5rem;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .feature-item {
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid var(--color-blue);
        }
        
        .feature-title {
            font-weight: 600;
            color: var(--color-navy);
            margin-bottom: 0.25rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        
        .metric-card {
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 8px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-navy);
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            font-size: 0.875rem;
            color: var(--color-gray);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .enterprise-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }
        
        .enterprise-item {
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            color: var(--color-navy);
        }
        
        .testimonial {
            padding: 1.5rem;
            background: #eff6ff;
            border-radius: 8px;
            border-left: 4px solid var(--color-blue);
            margin-bottom: 1rem;
        }
        
        .testimonial-text {
            font-style: italic;
            color: var(--color-slate);
            margin-bottom: 0.5rem;
        }
        
        .testimonial-author {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--color-blue);
        }
        
        .pricing-grid {
            display: grid;
            gap: 1rem;
        }
        
        .pricing-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .pricing-plan {
            font-weight: 600;
            color: var(--color-navy);
        }
        
        .pricing-cost {
            font-weight: 700;
            color: var(--color-green);
        }
        
        .news-item {
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        
        .news-title {
            font-weight: 600;
            color: var(--color-navy);
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
        }
        
        .news-meta {
            font-size: 0.75rem;
            color: var(--color-gray);
        }
        
        @media (max-width: 1024px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .hero-content {
                grid-template-columns: 1fr;
                text-align: center;
            }
        }
        
        @media (max-width: 768px) {
            .hero-info h1 {
                font-size: 2rem;
            }
            
            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="../index.html" class="logo">
                    <div class="logo-icon">AI</div>
                    <div class="logo-text">Market Intelligence</div>
                </a>
                <div class="nav-links">
                    <a href="index.html" class="nav-link">Tools Directory</a>
                    <a href="../index.html" class="nav-link">← Dashboard</a>
                </div>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <div class="hero-info">
                    <h1>${tool.name}</h1>
                    <div class="hero-company">${tool.company_name} • ${tool.legal_company_name}</div>
                    <div class="hero-description">
                        ${basicInfo.description || tool.description}
                    </div>
                </div>
                <div class="hero-actions">
                    ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" class="btn btn-primary">Visit Website</a>` : ''}
                    ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="btn btn-secondary">View on GitHub</a>` : ''}
                </div>
            </div>
        </div>
    </section>

    <div class="container">
        <div class="main-content">
            <div class="main-column">
                <!-- Key Metrics -->
                <div class="content-section">
                    <h2 class="section-title">Business Metrics</h2>
                    <div class="metrics-grid">
                        ${companyInfo.valuation ? `
                        <div class="metric-card">
                            <div class="metric-value">${companyInfo.valuation}</div>
                            <div class="metric-label">Valuation</div>
                        </div>
                        ` : ''}
                        ${companyInfo.total_funding_amount ? `
                        <div class="metric-card">
                            <div class="metric-value">$${(parseInt(companyInfo.total_funding_amount.replace(/[^0-9]/g, '')) / 1000000).toFixed(0)}M</div>
                            <div class="metric-label">Total Funding</div>
                        </div>
                        ` : ''}
                        <div class="metric-card">
                            <div class="metric-value">${(companyInfo.list_of_companies_using_tool || []).length}</div>
                            <div class="metric-label">Enterprise Customers</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${(techDetails.feature_list || []).length}</div>
                            <div class="metric-label">Features</div>
                        </div>
                        ${communityMetrics.reddit_mentions ? `
                        <div class="metric-card">
                            <div class="metric-value">${communityMetrics.reddit_mentions}</div>
                            <div class="metric-label">Reddit Mentions</div>
                        </div>
                        ` : ''}
                        ${communityMetrics.github_stars ? `
                        <div class="metric-card">
                            <div class="metric-value">${communityMetrics.github_stars.toLocaleString()}</div>
                            <div class="metric-label">GitHub Stars</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Features -->
                ${(techDetails.feature_list && techDetails.feature_list.length > 0) ? `
                <div class="content-section">
                    <h2 class="section-title">Features & Capabilities</h2>
                    <div class="features-grid">
                        ${techDetails.feature_list.map(feature => `
                            <div class="feature-item">
                                <div class="feature-title">${feature}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Unique Differentiators -->
                ${(techDetails.unique_differentiators && techDetails.unique_differentiators.length > 0) ? `
                <div class="content-section">
                    <h2 class="section-title">Competitive Advantages</h2>
                    ${techDetails.unique_differentiators.map(diff => `
                        <div class="feature-item" style="margin-bottom: 1rem;">
                            <div class="feature-title">${diff}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Enterprise Adoption -->
                ${(companyInfo.list_of_companies_using_tool && companyInfo.list_of_companies_using_tool.length > 0) ? `
                <div class="content-section">
                    <h2 class="section-title">Enterprise Customers (${companyInfo.list_of_companies_using_tool.length})</h2>
                    <div class="enterprise-grid">
                        ${companyInfo.list_of_companies_using_tool.map(company => `
                            <div class="enterprise-item">${company}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Customer Testimonials -->
                ${(companyInfo.testimonials && companyInfo.testimonials.length > 0) ? `
                <div class="content-section">
                    <h2 class="section-title">Customer Testimonials</h2>
                    ${companyInfo.testimonials.slice(0, 5).map(testimonial => {
                        const parts = testimonial.split(' - ');
                        const text = parts[0];
                        const author = parts[1] || '';
                        return `
                            <div class="testimonial">
                                <div class="testimonial-text">"${text}"</div>
                                ${author ? `<div class="testimonial-author">— ${author}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                ` : ''}

                <!-- Market Position -->
                ${techDetails.market_positioning ? `
                <div class="content-section">
                    <h2 class="section-title">Market Position</h2>
                    <p style="color: var(--color-gray); line-height: 1.6;">${techDetails.market_positioning}</p>
                </div>
                ` : ''}
            </div>

            <div class="sidebar">
                <!-- Company Info -->
                <div class="content-section">
                    <h3 class="section-title">Company Information</h3>
                    <div style="space-y: 1rem;">
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Legal Name</div>
                            <div style="color: var(--color-gray);">${tool.legal_company_name}</div>
                        </div>
                        ${companyInfo.business_model ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Business Model</div>
                            <div style="color: var(--color-gray);">${companyInfo.business_model}</div>
                        </div>
                        ` : ''}
                        ${companyInfo.company_stage ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Company Stage</div>
                            <div style="color: var(--color-gray);">${companyInfo.company_stage}</div>
                        </div>
                        ` : ''}
                        ${companyInfo.last_funding_date ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Last Funding</div>
                            <div style="color: var(--color-gray);">${new Date(companyInfo.last_funding_date).toLocaleDateString()}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Funding Rounds -->
                ${(companyInfo.funding_rounds && companyInfo.funding_rounds.length > 0) ? `
                <div class="content-section">
                    <h3 class="section-title">Funding History</h3>
                    ${companyInfo.funding_rounds.map(round => {
                        const [roundType, amount] = Object.entries(round)[0];
                        return `
                            <div class="pricing-item">
                                <div class="pricing-plan">${roundType}</div>
                                <div class="pricing-cost">${amount}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ` : ''}

                <!-- Pricing -->
                ${(techDetails.pricing_model && Object.keys(techDetails.pricing_model).length > 0) ? `
                <div class="content-section">
                    <h3 class="section-title">Pricing</h3>
                    <div class="pricing-grid">
                        ${Object.entries(techDetails.pricing_model).map(([plan, price]) => `
                            <div class="pricing-item">
                                <div class="pricing-plan">${plan}</div>
                                <div class="pricing-cost">${price}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Technical Details -->
                <div class="content-section">
                    <h3 class="section-title">Technical Details</h3>
                    <div style="space-y: 1rem;">
                        ${tool.category ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Category</div>
                            <div style="color: var(--color-gray);">${tool.category.replace('_', ' ')}</div>
                        </div>
                        ` : ''}
                        ${(techDetails.deployment_options && techDetails.deployment_options.length > 0) ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Deployment</div>
                            <div style="color: var(--color-gray);">${techDetails.deployment_options.join(', ')}</div>
                        </div>
                        ` : ''}
                        ${(techDetails.supported_languages && techDetails.supported_languages.length > 0) ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Languages</div>
                            <div style="color: var(--color-gray);">${techDetails.supported_languages.join(', ')}</div>
                        </div>
                        ` : ''}
                        ${techDetails.update_frequency ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-weight: 600; color: var(--color-navy);">Update Frequency</div>
                            <div style="color: var(--color-gray);">${techDetails.update_frequency}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Recent News -->
                ${(rawData.news_data && rawData.news_data.articles && rawData.news_data.articles.length > 0) ? `
                <div class="content-section">
                    <h3 class="section-title">Recent News</h3>
                    ${rawData.news_data.articles.slice(0, 5).map(article => `
                        <div class="news-item">
                            <div class="news-title">${article.title}</div>
                            <div class="news-meta">${article.source} • ${new Date(article.published_at).toLocaleDateString()}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Official Links -->
                <div class="content-section">
                    <h3 class="section-title">Official Links</h3>
                    <div style="space-y: 0.5rem;">
                        ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" class="btn btn-secondary" style="display: block; margin-bottom: 0.5rem;">Website</a>` : ''}
                        ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="btn btn-secondary" style="display: block; margin-bottom: 0.5rem;">GitHub</a>` : ''}
                        ${blogUrl ? `<a href="${blogUrl}" target="_blank" class="btn btn-secondary" style="display: block; margin-bottom: 0.5rem;">Blog</a>` : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(toolsDir, `${tool.id}.html`), toolHtml);
});

console.log(`✅ Created comprehensive intelligence for ${dashboardData.tools.length} tools`);
console.log('📊 Each tool page includes:');
console.log('   • Complete business metrics and financial data');
console.log('   • Comprehensive feature analysis');
console.log('   • Enterprise customer lists');
console.log('   • Customer testimonials with attribution');
console.log('   • Funding history and valuation data');
console.log('   • Technical specifications');
console.log('   • Recent news and market coverage');
console.log('   • Professional design focused on business intelligence');