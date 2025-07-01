const fs = require('fs');
const path = require('path');

// Load the dashboard data
const dataPath = path.join(__dirname, 'github-pages', 'data', 'dashboard-data.json');
const dashboardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('📊 Creating comprehensive executive dashboard...');
console.log(`Data loaded: ${dashboardData.tools.length} tools, ${dashboardData.overview.totalFunding} total funding`);

// Create comprehensive executive dashboard
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Intelligence Platform | Executive Dashboard</title>
    <meta name="description" content="Comprehensive intelligence on AI developer tools and market trends for executive decision-making">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { font-family: 'Inter', system-ui, sans-serif; }
        
        .executive-gradient {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 25%, #6366f1 50%, #8b5cf6 75%, #a855f7 100%);
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .metric-card {
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .tool-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .tool-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: #6366f1;
        }
        
        .tool-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .tool-card:hover::before {
            opacity: 1;
        }
        
        .valuation-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-weight: 600;
        }
        
        .funding-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            font-weight: 600;
        }
        
        .category-badge {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            font-weight: 500;
        }
        
        .feature-tag {
            background: #f3f4f6;
            color: #374151;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            border: 1px solid #d1d5db;
        }
        
        .news-item {
            border-left: 4px solid #6366f1;
            background: #f8fafc;
            padding: 1rem;
            margin-bottom: 0.75rem;
            border-radius: 0 0.5rem 0.5rem 0;
        }
        
        .chart-container {
            background: white;
            border-radius: 0.75rem;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }
        
        .executive-nav {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .animate-fade-in {
            animation: fadeIn 0.6s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .grid-executive {
            display: grid;
            gap: 2rem;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        }
        
        .metric-grid {
            display: grid;
            gap: 1.5rem;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
        
        @media (max-width: 768px) {
            .grid-executive { grid-template-columns: 1fr; }
            .metric-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="executive-nav sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                        <span class="text-white font-bold text-lg">AI</span>
                    </div>
                    <div>
                        <span class="text-xl font-bold text-gray-900">AI Intelligence Platform</span>
                        <div class="text-xs text-gray-600">Executive Dashboard</div>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">Last Updated: ${new Date(dashboardData.overview.lastUpdated).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="executive-gradient text-white py-20 px-4">
        <div class="max-w-7xl mx-auto text-center animate-fade-in">
            <h1 class="text-6xl font-bold mb-6">AI Developer Tools Market Intelligence</h1>
            <p class="text-xl text-blue-100 max-w-4xl mx-auto mb-8">
                Comprehensive analysis of ${dashboardData.overview.totalTools} leading AI development tools with ${dashboardData.overview.totalFunding} in tracked funding across ${dashboardData.overview.categories.length} market categories
            </p>
            <div class="flex justify-center space-x-6">
                <div class="text-center">
                    <div class="text-3xl font-bold">${dashboardData.overview.totalTools}</div>
                    <div class="text-blue-200">Tools Analyzed</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${dashboardData.overview.totalFunding}</div>
                    <div class="text-blue-200">Total Funding</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold">${dashboardData.overview.categories.length}</div>
                    <div class="text-blue-200">Categories</div>
                </div>
            </div>
        </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 py-12">
        <!-- Executive Summary -->
        <section class="mb-16 animate-fade-in">
            <h2 class="text-4xl font-bold text-gray-900 mb-8 text-center">Executive Summary</h2>
            
            <div class="metric-grid mb-12">
                ${generateMetricCards(dashboardData)}
            </div>

            <div class="glass-card rounded-2xl p-8">
                <h3 class="text-2xl font-bold text-gray-900 mb-6">Key Market Insights</h3>
                <div class="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 mb-4">Strategic Opportunities</h4>
                        <ul class="space-y-3 text-gray-700">
                            <li class="flex items-start"><span class="text-blue-600 font-bold mr-2">•</span>AI coding tools achieving billion-dollar valuations in record time</li>
                            <li class="flex items-start"><span class="text-blue-600 font-bold mr-2">•</span>Enterprise adoption accelerating across Fortune 500 companies</li>
                            <li class="flex items-start"><span class="text-blue-600 font-bold mr-2">•</span>Strong developer community engagement driving organic growth</li>
                            <li class="flex items-start"><span class="text-blue-600 font-bold mr-2">•</span>Multiple distinct market segments emerging with unique value propositions</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 mb-4">Risk Considerations</h4>
                        <ul class="space-y-3 text-gray-700">
                            <li class="flex items-start"><span class="text-red-500 font-bold mr-2">•</span>High valuations may outpace revenue generation capabilities</li>
                            <li class="flex items-start"><span class="text-red-500 font-bold mr-2">•</span>Competitive pressure from tech giants (Microsoft, Google)</li>
                            <li class="flex items-start"><span class="text-red-500 font-bold mr-2">•</span>Rapid technology evolution creating disruption risk</li>
                            <li class="flex items-start"><span class="text-red-500 font-bold mr-2">•</span>Regulatory uncertainty around AI development tools</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Market Leaders -->
        <section class="mb-16">
            <h2 class="text-4xl font-bold text-gray-900 mb-8 text-center">Market Leaders</h2>
            <div class="grid-executive">
                ${generateToolCards(dashboardData.tools)}
            </div>
        </section>

        <!-- Market Analysis Charts -->
        <section class="mb-16">
            <h2 class="text-4xl font-bold text-gray-900 mb-8 text-center">Market Analysis</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="chart-container">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">Funding by Category</h3>
                    <canvas id="fundingChart" width="400" height="300"></canvas>
                </div>
                <div class="chart-container">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">Tool Distribution</h3>
                    <canvas id="categoryChart" width="400" height="300"></canvas>
                </div>
            </div>
        </section>

        <!-- Recent Intelligence -->
        <section class="mb-16">
            <h2 class="text-4xl font-bold text-gray-900 mb-8 text-center">Recent Market Intelligence</h2>
            <div class="grid lg:grid-cols-2 gap-8">
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-6">Latest News & Developments</h3>
                    ${generateNewsItems(dashboardData.recentNews.slice(0, 5))}
                </div>
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-6">Market Trends</h3>
                    <div class="space-y-4">
                        <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <h4 class="font-semibold text-blue-900">"Vibe Coding" Revolution</h4>
                            <p class="text-blue-800 text-sm">AI-powered natural language programming becoming mainstream development approach</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h4 class="font-semibold text-green-900">Enterprise Integration</h4>
                            <p class="text-green-800 text-sm">Major corporations adopting AI coding tools for development workflows</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                            <h4 class="font-semibold text-purple-900">Funding Acceleration</h4>
                            <p class="text-purple-800 text-sm">Record-breaking funding rounds with billion-dollar valuations</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Investment Analysis -->
        <section class="mb-16">
            <h2 class="text-4xl font-bold text-gray-900 mb-8 text-center">Investment Landscape</h2>
            <div class="glass-card rounded-2xl p-8">
                <div class="grid lg:grid-cols-3 gap-8">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Valuation Leaders</h3>
                        ${generateValuationLeaders(dashboardData.marketMetrics.valuations)}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Community Engagement</h3>
                        ${generateCommunityMetrics(dashboardData.marketMetrics.communityEngagement)}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 mb-4">Market Categories</h3>
                        ${generateCategoryBreakdown(dashboardData.overview.categories, dashboardData.tools)}
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <div class="mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span class="text-white font-bold text-xl">AI</span>
                </div>
                <h3 class="text-xl font-bold">AI Intelligence Platform</h3>
            </div>
            <p class="text-gray-400 mb-2">Professional market intelligence for strategic decision making</p>
            <p class="text-gray-500 text-sm">Last updated: ${new Date().toLocaleDateString()} • Data sources: GitHub, News, Community, Financial</p>
        </div>
    </footer>

    <script>
        // Chart data
        const fundingData = ${JSON.stringify(dashboardData.marketMetrics.fundingByCategory)};
        const categoryData = ${JSON.stringify(dashboardData.overview.categories.map(cat => ({
            category: cat,
            count: dashboardData.tools.filter(tool => tool.category === cat).length
        })))};

        // Initialize charts
        document.addEventListener('DOMContentLoaded', function() {
            // Funding by Category Chart
            const fundingCtx = document.getElementById('fundingChart').getContext('2d');
            new Chart(fundingCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(fundingData).map(cat => cat.replace('_', ' ')),
                    datasets: [{
                        label: 'Funding (Millions USD)',
                        data: Object.values(fundingData).map(val => val / 1000000),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Funding (Millions USD)'
                            }
                        }
                    }
                }
            });

            // Category Distribution Chart
            const categoryCtx = document.getElementById('categoryChart').getContext('2d');
            new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.map(item => item.category.replace('_', ' ')),
                    datasets: [{
                        data: categoryData.map(item => item.count),
                        backgroundColor: [
                            'rgba(99, 102, 241, 0.8)',
                            'rgba(139, 92, 246, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Animate elements on scroll
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in');
                    }
                });
            }, observerOptions);

            document.querySelectorAll('section').forEach(section => {
                observer.observe(section);
            });
        });
    </script>
</body>
</html>`;

// Helper functions
function generateMetricCards(data) {
    const topValuation = data.marketMetrics.valuations[0];
    return `
        <div class="metric-card rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-gray-900 mb-2">${data.overview.totalTools}</div>
            <div class="text-sm font-medium text-gray-600 uppercase tracking-wide">AI Tools Tracked</div>
            <div class="text-xs text-gray-500 mt-2">Comprehensive market coverage</div>
        </div>
        <div class="metric-card rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-gray-900 mb-2">${data.overview.totalFunding}</div>
            <div class="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Funding</div>
            <div class="text-xs text-gray-500 mt-2">Across all tracked companies</div>
        </div>
        <div class="metric-card rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-gray-900 mb-2">${data.overview.categories.length}</div>
            <div class="text-sm font-medium text-gray-600 uppercase tracking-wide">Market Categories</div>
            <div class="text-xs text-gray-500 mt-2">Tool classification segments</div>
        </div>
        <div class="metric-card rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-gray-900 mb-2">$${topValuation ? (topValuation.valuation / 1000000000).toFixed(1) : 0}B</div>
            <div class="text-sm font-medium text-gray-600 uppercase tracking-wide">Top Valuation</div>
            <div class="text-xs text-gray-500 mt-2">${topValuation ? topValuation.name : 'N/A'}</div>
        </div>
    `;
}

function generateToolCards(tools) {
    return tools.map(tool => {
        const snapshot = tool.snapshots && tool.snapshots[0];
        if (!snapshot) return '';
        
        const valuation = snapshot.company_info?.valuation;
        const funding = snapshot.company_info?.total_funding_amount;
        const enterprises = snapshot.company_info?.list_of_companies_using_tool || [];
        const features = snapshot.technical_details?.feature_list || [];
        const pricing = snapshot.technical_details?.pricing_model || {};
        const testimonials = snapshot.company_info?.testimonials || [];
        
        return `
            <div class="tool-card rounded-xl p-6 h-full">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${tool.name}</h3>
                        <p class="text-gray-600">${tool.company_name}</p>
                        <p class="text-sm text-gray-500">${tool.legal_company_name}</p>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        <span class="category-badge px-3 py-1 rounded-full text-xs">${tool.category.replace('_', ' ')}</span>
                        ${valuation ? `<span class="valuation-badge px-3 py-1 rounded-full text-xs">${valuation}</span>` : ''}
                    </div>
                </div>

                <p class="text-gray-700 mb-4 text-sm leading-relaxed">${snapshot.basic_info?.description || tool.description}</p>

                <div class="mb-4">
                    <h4 class="font-semibold text-gray-900 mb-2 text-sm">Key Features</h4>
                    <div class="flex flex-wrap gap-1">
                        ${features.slice(0, 6).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        ${features.length > 6 ? `<span class="feature-tag">+${features.length - 6} more</span>` : ''}
                    </div>
                </div>

                ${Object.keys(pricing).length > 0 ? `
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-900 mb-2 text-sm">Pricing</h4>
                    <div class="space-y-1">
                        ${Object.entries(pricing).slice(0, 2).map(([plan, price]) => 
                            `<div class="flex justify-between text-xs">
                                <span class="text-gray-600">${plan}:</span>
                                <span class="font-medium">${price}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}

                ${enterprises.length > 0 ? `
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-900 mb-2 text-sm">Enterprise Users (${enterprises.length})</h4>
                    <div class="flex flex-wrap gap-1">
                        ${enterprises.slice(0, 4).map(company => `<span class="feature-tag">${company}</span>`).join('')}
                        ${enterprises.length > 4 ? `<span class="feature-tag">+${enterprises.length - 4} more</span>` : ''}
                    </div>
                </div>
                ` : ''}

                ${testimonials.length > 0 ? `
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-900 mb-2 text-sm">Customer Feedback</h4>
                    <blockquote class="text-xs text-gray-600 italic border-l-2 border-blue-500 pl-2">
                        "${testimonials[0].substring(0, 120)}${testimonials[0].length > 120 ? '...' : ''}"
                    </blockquote>
                </div>
                ` : ''}

                <div class="flex justify-between items-center pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <div>
                        ${snapshot.community_metrics?.reddit_mentions ? `${snapshot.community_metrics.reddit_mentions} Reddit mentions` : ''}
                        ${snapshot.community_metrics?.github_stars ? `• ⭐ ${snapshot.community_metrics.github_stars.toLocaleString()}` : ''}
                    </div>
                    ${funding ? `<span class="funding-badge px-2 py-1 rounded text-xs">$${(parseInt(funding.replace(/[^0-9]/g, '')) / 1000000).toFixed(0)}M funding</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function generateNewsItems(news) {
    return news.map(item => `
        <div class="news-item">
            <h4 class="font-semibold text-gray-900 text-sm mb-1">${item.title}</h4>
            <div class="flex justify-between items-center text-xs text-gray-600">
                <span>${item.source} • ${item.tool}</span>
                <span>${new Date(item.date).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function generateValuationLeaders(valuations) {
    return `
        <div class="space-y-3">
            ${valuations.slice(0, 5).map((company, index) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            ${index + 1}
                        </div>
                        <span class="font-medium text-gray-900 text-sm">${company.name}</span>
                    </div>
                    <span class="text-sm font-bold text-green-600">$${(company.valuation / 1000000000).toFixed(1)}B</span>
                </div>
            `).join('')}
        </div>
    `;
}

function generateCommunityMetrics(engagement) {
    return `
        <div class="space-y-3">
            ${engagement.slice(0, 5).map(tool => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span class="font-medium text-gray-900 text-sm">${tool.name}</span>
                    <div class="text-xs text-gray-600">
                        ${tool.mentions > 0 ? `${tool.mentions} mentions` : ''}
                        ${tool.stars > 0 ? `• ⭐ ${tool.stars}` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function generateCategoryBreakdown(categories, tools) {
    return `
        <div class="space-y-3">
            ${categories.map(category => {
                const count = tools.filter(tool => tool.category === category).length;
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span class="font-medium text-gray-900 text-sm">${category.replace('_', ' ')}</span>
                        <span class="text-sm font-bold text-blue-600">${count} tools</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Write the comprehensive dashboard
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

fs.writeFileSync(path.join(docsDir, 'index.html'), html);
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

console.log('✅ Comprehensive executive dashboard created!');
console.log('📁 Files created in /docs folder');
console.log('📊 Dashboard includes:');
console.log(`   • ${dashboardData.tools.length} detailed tool profiles`);
console.log(`   • ${dashboardData.overview.totalFunding} total funding tracked`);
console.log(`   • ${dashboardData.recentNews.length} recent news items`);
console.log(`   • Interactive charts and visualizations`);
console.log(`   • Professional executive-grade design`);
console.log('🚀 Ready for GitHub Pages deployment!');