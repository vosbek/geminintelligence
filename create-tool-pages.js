const fs = require('fs');
const path = require('path');

// Load the dashboard data
const dataPath = path.join(__dirname, 'github-pages', 'data', 'dashboard-data.json');
const dashboardData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔧 Creating individual tool detail pages...');

// Create tools directory
const toolsDir = path.join(__dirname, 'docs', 'tools');
if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
}

// Create index page for tools
const toolsIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Tools Directory | AI Intelligence Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>* { font-family: 'Inter', system-ui, sans-serif; }</style>
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="../index.html" class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <span class="text-white font-bold text-sm">AI</span>
                        </div>
                        <span class="text-xl font-bold text-gray-900">AI Intelligence Platform</span>
                    </a>
                </div>
                <div class="flex items-center">
                    <a href="../index.html" class="text-blue-600 hover:text-blue-700 font-medium">← Back to Dashboard</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">AI Developer Tools Directory</h1>
            <p class="text-lg text-gray-600 max-w-3xl mx-auto">
                Comprehensive profiles of ${dashboardData.tools.length} leading AI development tools with detailed market intelligence and analysis.
            </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${dashboardData.tools.map(tool => {
                const snapshot = tool.snapshots && tool.snapshots[0];
                if (!snapshot) return '';
                
                const valuation = snapshot.company_info?.valuation;
                const enterprises = snapshot.company_info?.list_of_companies_using_tool || [];
                
                return `
                    <a href="${tool.id}.html" class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 block">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${tool.name}</h3>
                                <p class="text-gray-600">${tool.company_name}</p>
                            </div>
                            <span class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                ${tool.category.replace('_', ' ')}
                            </span>
                        </div>
                        
                        <p class="text-gray-700 text-sm mb-4 line-clamp-3">${snapshot.basic_info?.description || tool.description}</p>
                        
                        <div class="flex justify-between items-center text-sm">
                            <div class="flex items-center space-x-4 text-gray-500">
                                ${enterprises.length > 0 ? `<span>${enterprises.length} enterprises</span>` : ''}
                                ${snapshot.community_metrics?.reddit_mentions ? `<span>${snapshot.community_metrics.reddit_mentions} mentions</span>` : ''}
                            </div>
                            ${valuation ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">${valuation}</span>` : ''}
                        </div>
                        
                        <div class="mt-4 text-blue-600 font-medium text-sm">View Details →</div>
                    </a>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(toolsDir, 'index.html'), toolsIndexHtml);

// Create individual tool pages
dashboardData.tools.forEach(tool => {
    const snapshot = tool.snapshots && tool.snapshots[0];
    if (!snapshot) return;
    
    const websiteUrl = tool.urls.find(url => url.url_type === 'website')?.url;
    const blogUrl = tool.urls.find(url => url.url_type === 'blog')?.url;
    const changelogUrl = tool.urls.find(url => url.url_type === 'changelog')?.url;
    
    const toolHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tool.name} - AI Tool Analysis | AI Intelligence Platform</title>
    <meta name="description" content="Comprehensive analysis of ${tool.name} by ${tool.company_name} - features, pricing, market position, and enterprise adoption">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { font-family: 'Inter', system-ui, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="../index.html" class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <span class="text-white font-bold text-sm">AI</span>
                        </div>
                        <span class="text-xl font-bold text-gray-900">AI Intelligence Platform</span>
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="index.html" class="text-gray-600 hover:text-gray-900">Tools Directory</a>
                    <a href="../index.html" class="text-blue-600 hover:text-blue-700 font-medium">← Dashboard</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="gradient-bg text-white py-16">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center">
                <h1 class="text-5xl font-bold mb-4">${tool.name}</h1>
                <p class="text-xl text-blue-100 mb-2">${tool.company_name} • ${tool.legal_company_name}</p>
                <p class="text-lg text-blue-200 max-w-4xl mx-auto mb-8">${snapshot.basic_info?.description || tool.description}</p>
                
                <div class="flex justify-center space-x-4">
                    ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">Visit Website</a>` : ''}
                    ${tool.github_url ? `<a href="${tool.github_url}" target="_blank" class="bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors">GitHub</a>` : ''}
                </div>
            </div>
        </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid lg:grid-cols-3 gap-8">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Key Features -->
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
                    <div class="grid md:grid-cols-2 gap-4">
                        ${(snapshot.technical_details?.feature_list || []).map(feature => `
                            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <span class="text-gray-700 text-sm">${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Unique Differentiators -->
                ${(snapshot.technical_details?.unique_differentiators?.length > 0) ? `
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Unique Differentiators</h2>
                    <div class="space-y-4">
                        ${snapshot.technical_details.unique_differentiators.map(diff => `
                            <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <span class="text-gray-700">${diff}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Market Position -->
                ${snapshot.technical_details?.market_positioning ? `
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Market Positioning</h2>
                    <p class="text-gray-700 leading-relaxed">${snapshot.technical_details.market_positioning}</p>
                </div>
                ` : ''}

                <!-- Enterprise Adoption -->
                ${(snapshot.company_info?.list_of_companies_using_tool?.length > 0) ? `
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Enterprise Adoption</h2>
                    <p class="text-gray-600 mb-6">${snapshot.company_info.list_of_companies_using_tool.length} companies using this tool</p>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${snapshot.company_info.list_of_companies_using_tool.map(company => `
                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                                <span class="font-medium text-gray-900 text-sm">${company}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Customer Testimonials -->
                ${(snapshot.company_info?.testimonials?.length > 0) ? `
                <div class="bg-white rounded-xl p-8 shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Customer Testimonials</h2>
                    <div class="space-y-6">
                        ${snapshot.company_info.testimonials.slice(0, 3).map(testimonial => `
                            <blockquote class="bg-blue-50 border-l-4 border-blue-500 pl-6 py-4 rounded-r-lg">
                                <p class="text-gray-700 italic">"${testimonial}"</p>
                            </blockquote>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Quick Stats -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Category</span>
                            <span class="font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">${tool.category.replace('_', ' ')}</span>
                        </div>
                        ${snapshot.company_info?.valuation ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">Valuation</span>
                            <span class="font-medium text-green-600">${snapshot.company_info.valuation}</span>
                        </div>
                        ` : ''}
                        ${snapshot.company_info?.total_funding_amount ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total Funding</span>
                            <span class="font-medium text-blue-600">$${(parseInt(snapshot.company_info.total_funding_amount.replace(/[^0-9]/g, '')) / 1000000).toFixed(0)}M</span>
                        </div>
                        ` : ''}
                        ${snapshot.company_info?.business_model ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">Business Model</span>
                            <span class="font-medium">${snapshot.company_info.business_model}</span>
                        </div>
                        ` : ''}
                        ${snapshot.community_metrics?.reddit_mentions ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">Reddit Mentions</span>
                            <span class="font-medium">${snapshot.community_metrics.reddit_mentions}</span>
                        </div>
                        ` : ''}
                        ${snapshot.community_metrics?.github_stars ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600">GitHub Stars</span>
                            <span class="font-medium">⭐ ${snapshot.community_metrics.github_stars.toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Technical Details -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Technical Details</h3>
                    <div class="space-y-4">
                        ${(snapshot.technical_details?.deployment_options?.length > 0) ? `
                        <div>
                            <span class="text-sm text-gray-600 block mb-2">Deployment Options</span>
                            <div class="flex flex-wrap gap-1">
                                ${snapshot.technical_details.deployment_options.map(option => 
                                    `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">${option}</span>`
                                ).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${(snapshot.technical_details?.supported_languages?.length > 0) ? `
                        <div>
                            <span class="text-sm text-gray-600 block mb-2">Supported Languages</span>
                            <div class="flex flex-wrap gap-1">
                                ${snapshot.technical_details.supported_languages.map(lang => 
                                    `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">${lang}</span>`
                                ).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Pricing -->
                ${(snapshot.technical_details?.pricing_model && Object.keys(snapshot.technical_details.pricing_model).length > 0) ? `
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Pricing</h3>
                    <div class="space-y-3">
                        ${Object.entries(snapshot.technical_details.pricing_model).map(([plan, price]) => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span class="text-gray-700 font-medium">${plan}</span>
                                <span class="text-gray-900 font-bold">${price}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Competitors -->
                ${(snapshot.technical_details?.comparable_tools?.length > 0) ? `
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Comparable Tools</h3>
                    <div class="space-y-2">
                        ${snapshot.technical_details.comparable_tools.map(competitor => `
                            <div class="text-gray-700 text-sm py-1">${competitor}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Links -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Official Links</h3>
                    <div class="space-y-3">
                        ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" class="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            <span class="text-blue-700 font-medium">Website</span>
                            <span class="text-blue-600">→</span>
                        </a>` : ''}
                        ${tool.github_url ? `<a href="${tool.github_url}" target="_blank" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span class="text-gray-700 font-medium">GitHub</span>
                            <span class="text-gray-600">→</span>
                        </a>` : ''}
                        ${blogUrl ? `<a href="${blogUrl}" target="_blank" class="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                            <span class="text-green-700 font-medium">Blog</span>
                            <span class="text-green-600">→</span>
                        </a>` : ''}
                        ${changelogUrl ? `<a href="${changelogUrl}" target="_blank" class="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                            <span class="text-purple-700 font-medium">Changelog</span>
                            <span class="text-purple-600">→</span>
                        </a>` : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-8">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-gray-400">AI Intelligence Platform • Professional market intelligence</p>
        </div>
    </footer>
</body>
</html>`;
    
    fs.writeFileSync(path.join(toolsDir, `${tool.id}.html`), toolHtml);
});

console.log(`✅ Created ${dashboardData.tools.length} tool detail pages`);
console.log('📁 Files created in /docs/tools/ directory');
console.log('🔧 Tool pages include:');
console.log('   • Comprehensive feature analysis');
console.log('   • Enterprise adoption metrics');
console.log('   • Customer testimonials');
console.log('   • Technical specifications');
console.log('   • Pricing information');
console.log('   • Market positioning');
console.log('   • Official links and resources');