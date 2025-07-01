#!/bin/bash

echo "🎯 Deploying Executive Business Intelligence Dashboard..."

# Check if we're in the right directory
if [ ! -f "create-executive-intelligence.js" ]; then
    echo "❌ Error: Run this script from the root directory"
    exit 1
fi

echo "📊 Building executive business intelligence dashboard..."
node create-executive-intelligence.js

echo "🔧 Creating comprehensive tool intelligence pages..."
node create-comprehensive-tools.js

echo "📁 Dashboard deployment complete!"
echo ""
echo "🎯 EXECUTIVE DASHBOARD FEATURES:"
echo ""
echo "📊 MAIN DASHBOARD (/docs/index.html):"
echo "   • $1.1B total funding tracked"
echo "   • 38 enterprise customers identified"
echo "   • $900M average Series C funding"
echo "   • Fortune 500 market penetration analysis"
echo "   • Investment intelligence with valuation rankings"
echo "   • Market signals and business intelligence"
echo ""
echo "🔧 TOOL INTELLIGENCE (/docs/tools/):"
echo "   • 9 comprehensive tool profiles"
echo "   • Complete financial and business metrics"
echo "   • Enterprise customer lists (Amazon, Stripe, Samsung, etc.)"
echo "   • Customer testimonials with attribution"
echo "   • Technical specifications and features"
echo "   • Funding history and valuation data"
echo "   • Recent news and market coverage"
echo ""
echo "💼 BUSINESS VALUE:"
echo "   • Actionable investment intelligence"
echo "   • Enterprise adoption patterns"
echo "   • Competitive positioning analysis"
echo "   • Market trend identification"
echo "   • Strategic decision support"
echo ""
echo "🚀 DEPLOYMENT STEPS:"
echo "   1. git add docs/"
echo "   2. git commit -m 'Deploy executive business intelligence dashboard'"
echo "   3. git push origin main"
echo "   4. Enable GitHub Pages: Settings → Pages → main branch → /docs folder"
echo "   5. Access at: https://[username].github.io/[repository]/"
echo ""
echo "✅ Executive dashboard ready for deployment!"