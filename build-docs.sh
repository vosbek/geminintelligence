#!/bin/bash

echo "🚀 Building AI Intelligence Executive Dashboard for GitHub Pages..."

# Navigate to the github-pages directory
cd github-pages

echo "📊 Building data..."
npm run build:data

echo "🏗️ Building Next.js application..."
npm run build

# Check if docs directory exists, if not create it
if [ ! -d "../docs" ]; then
    mkdir ../docs
fi

# Copy the built files to docs directory
echo "📁 Copying files to docs directory..."
cp -r .next/static ../docs/
cp -r .next/server ../docs/
cp -r public/* ../docs/ 2>/dev/null || :

# Create a simple index.html for the main page
echo "📝 Creating index.html..."
cat > ../docs/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Intelligence Platform | Executive Dashboard</title>
    <meta name="description" content="Comprehensive intelligence on AI developer tools and market trends for executive decision-making">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'executive': {
                            50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 
                            400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 
                            800: '#1e293b', 900: '#0f172a'
                        },
                        'accent': {
                            50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 
                            400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 
                            800: '#1e40af', 900: '#1e3a8a'
                        }
                    },
                    fontFamily: {
                        'executive': ['Inter', 'system-ui', 'sans-serif']
                    }
                }
            }
        }
    </script>
    <style>
        .executive-card { @apply bg-white shadow-lg rounded-lg border border-executive-200 hover:shadow-xl transition-shadow duration-200; }
        .executive-heading { @apply text-executive-900 font-bold tracking-tight; }
        .executive-subheading { @apply text-executive-700 font-semibold; }
        .executive-text { @apply text-executive-600 leading-relaxed; }
        .metric-card { @apply bg-white shadow-lg rounded-lg border border-executive-200 p-6 text-center; }
        .metric-value { @apply text-3xl font-bold text-executive-900 mb-2; }
        .metric-label { @apply text-sm font-medium text-executive-600 uppercase tracking-wide; }
        .category-badge { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800; }
        .funding-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800; }
        .valuation-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800; }
        .dashboard-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .metric-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    </style>
</head>
<body class="bg-executive-50 font-executive">
    <div class="min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg border-b border-executive-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center mr-3">
                            <span class="text-white font-bold text-sm">AI</span>
                        </div>
                        <span class="text-xl font-bold text-executive-900">Intelligence Platform</span>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="dashboard-header text-white py-16 px-4">
            <div class="max-w-7xl mx-auto text-center">
                <h1 class="text-5xl font-bold mb-4">AI Intelligence Platform</h1>
                <p class="text-xl text-white opacity-90 max-w-3xl mx-auto">
                    Comprehensive market intelligence on AI developer tools. 
                    Data-driven insights for strategic decision making.
                </p>
            </div>
        </section>

        <div class="max-w-7xl mx-auto px-4 py-12">
            <!-- Executive Summary -->
            <section class="mb-12">
                <div class="text-center mb-8">
                    <h2 class="text-3xl executive-heading mb-4">Executive Summary</h2>
                    <p class="text-lg executive-text max-w-3xl mx-auto">
                        Current state of the AI developer tools market based on comprehensive intelligence 
                        gathering across multiple data sources.
                    </p>
                </div>
                
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">9</div>
                        <div class="metric-label">AI Tools Tracked</div>
                        <p class="text-sm text-executive-500 mt-2">Comprehensive market coverage</p>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$1.1B</div>
                        <div class="metric-label">Total Funding</div>
                        <p class="text-sm text-executive-500 mt-2">Across all tracked companies</p>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">5</div>
                        <div class="metric-label">Market Categories</div>
                        <p class="text-sm text-executive-500 mt-2">Tool classification segments</p>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$10B</div>
                        <div class="metric-label">Market Leader</div>
                        <p class="text-sm text-executive-500 mt-2">Cursor valuation</p>
                    </div>
                </div>

                <div class="mt-8 p-6 bg-accent-50 border border-accent-200 rounded-lg">
                    <h3 class="text-lg font-semibold text-accent-900 mb-2">Key Insights</h3>
                    <ul class="text-executive-700 space-y-2">
                        <li>• AI coding tools represent a rapidly growing market segment with significant venture investment</li>
                        <li>• Market leaders have achieved multi-billion dollar valuations in record time</li>
                        <li>• Strong community engagement and enterprise adoption driving growth</li>
                        <li>• Diverse technology approaches across categories from IDEs to code completion</li>
                    </ul>
                </div>
            </section>

            <!-- Market Leaders -->
            <section class="mb-12">
                <h2 class="text-3xl executive-heading mb-8">Market Leaders</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="market-leaders">
                    <!-- Will be populated by JavaScript -->
                </div>
            </section>

            <!-- Recent Intelligence -->
            <section class="mb-12">
                <h2 class="text-3xl executive-heading mb-8">Recent Intelligence</h2>
                <div class="executive-card p-6">
                    <h3 class="text-xl executive-subheading mb-4">Key Market Developments</h3>
                    <div class="space-y-4">
                        <div class="border-b border-executive-200 pb-4">
                            <h4 class="text-lg font-medium text-executive-900 mb-2">
                                "Vibe Coding" Emerges as Industry Trend
                            </h4>
                            <p class="text-executive-600 text-sm">AI-powered coding tools enabling intuitive, natural language programming workflows gaining mainstream adoption</p>
                        </div>
                        <div class="border-b border-executive-200 pb-4">
                            <h4 class="text-lg font-medium text-executive-900 mb-2">
                                Enterprise Adoption Accelerating
                            </h4>
                            <p class="text-executive-600 text-sm">Major corporations including Amazon, Stripe, and Samsung integrating AI coding tools into development workflows</p>
                        </div>
                        <div>
                            <h4 class="text-lg font-medium text-executive-900 mb-2">
                                Significant Funding Rounds Completed
                            </h4>
                            <p class="text-executive-600 text-sm">Multiple companies achieving billion-dollar valuations with Series C funding rounds exceeding $900M</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Footer -->
        <footer class="bg-executive-900 text-white py-8 px-4">
            <div class="max-w-7xl mx-auto text-center">
                <p class="text-executive-300">
                    AI Intelligence Platform • Updated: ${new Date().toLocaleDateString()}
                </p>
                <p class="text-executive-400 text-sm mt-2">
                    Professional market intelligence for strategic decision making
                </p>
            </div>
        </footer>
    </div>

    <script>
        // Load and display market leaders
        const marketLeaders = [
            { name: "Cursor", company: "Anysphere", valuation: "$10B", category: "AI IDE" },
            { name: "Replit", company: "Replit", valuation: "$3B", category: "Cloud IDE" },
            { name: "GitHub Copilot", company: "Microsoft", category: "Code Completion" }
        ];

        const container = document.getElementById('market-leaders');
        marketLeaders.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'executive-card p-6';
            card.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-executive-900">${tool.name}</h3>
                        <p class="text-sm text-executive-600">${tool.company}</p>
                    </div>
                    <span class="category-badge">${tool.category}</span>
                </div>
                <div class="valuation-badge">${tool.valuation}</div>
            `;
            container.appendChild(card);
        });
    </script>
</body>
</html>
EOF

# Create .nojekyll file to bypass Jekyll processing
touch ../docs/.nojekyll

echo "✅ Build completed! Dashboard is ready in the /docs folder."
echo "📋 Next steps:"
echo "   1. Go to your GitHub repository settings"
echo "   2. Navigate to Pages section"
echo "   3. Set source to 'Deploy from a branch'"
echo "   4. Select 'main' branch and '/docs' folder"
echo "   5. Your dashboard will be available at: https://[username].github.io/[repository]/"