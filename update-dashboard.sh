#!/bin/bash

echo "🚀 Updating AI Intelligence Executive Dashboard..."

# Check if we're in the right directory
if [ ! -f "create-executive-dashboard.js" ]; then
    echo "❌ Error: Run this script from the root directory where create-executive-dashboard.js exists"
    exit 1
fi

# Check if dashboard data exists
if [ ! -f "github-pages/data/dashboard-data.json" ]; then
    echo "📊 Building dashboard data first..."
    cd github-pages
    npm run build:data
    cd ..
fi

echo "🏗️ Generating comprehensive executive dashboard..."
node create-executive-dashboard.js

echo "🔧 Creating detailed tool pages..."
node create-tool-pages.js

echo "📁 Dashboard files created in /docs folder:"
echo "   📊 Main Dashboard: docs/index.html"
echo "   🛠️  Tools Directory: docs/tools/index.html"
echo "   📄 Individual Pages: docs/tools/[1-9].html"

echo ""
echo "✅ Executive Dashboard Update Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review the updated dashboard: open docs/index.html in browser"
echo "   2. Push to GitHub: git add docs/ && git commit -m 'Update dashboard' && git push"
echo "   3. View live: https://[username].github.io/[repository]/"
echo ""
echo "📊 Dashboard Features:"
echo "   • 9 comprehensive tool profiles"
echo "   • \$1.1B total funding tracked"
echo "   • Interactive charts and visualizations"
echo "   • Enterprise adoption metrics"
echo "   • Customer testimonials"
echo "   • Market intelligence and trends"
echo "   • Professional executive-grade design"