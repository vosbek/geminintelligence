# AI Intelligence Platform - Executive Dashboard

A professional, premium executive dashboard showcasing comprehensive intelligence on AI developer tools. Built for GitHub Pages with Next.js static export.

## 🎯 Purpose

This dashboard provides executives and technical leaders with data-driven insights into the AI developer tools market, including:

- Market overview and trends
- Investment and funding analysis  
- Tool comparisons and deep dives
- Community and enterprise adoption metrics
- Recent news and intelligence

## 🏗️ Architecture

- **Framework**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS with executive-focused design system
- **Charts**: Recharts for data visualizations
- **Deployment**: GitHub Pages with static export
- **Data Source**: Processed from curated AI tools intelligence

## 📊 Data Pipeline

The dashboard processes data from `../database/curated_export.json` through:

1. **Data Transformation**: `scripts/build-data.js` processes raw data
2. **Static Generation**: Creates optimized JSON files for client consumption
3. **Build Integration**: Automatically runs during build process

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build data from curated export
npm run build:data

# Start development server
npm run dev

# Build for production (GitHub Pages)
npm run build:github
```

## 📁 Project Structure

```
github-pages/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard home
│   ├── tools/             # Tool directory and details
│   ├── market/            # Market intelligence
│   └── reports/           # Executive reports
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── layout/           # Navigation and layout
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and data processing
├── scripts/              # Build and data processing scripts
└── data/                 # Generated static data files
```

## 🎨 Design System

The dashboard uses a professional executive-focused design with:

- **Colors**: Executive grays with accent blues
- **Typography**: Inter font family for readability
- **Components**: Modular card-based layouts
- **Responsive**: Mobile-first responsive design
- **Print**: Optimized for report printing

## 📈 Key Features

### Executive Summary
- High-level market metrics
- Total funding and tool counts
- Key insights and trends

### Market Intelligence
- Category breakdowns
- Funding analysis by segment
- Competitive landscape charts

### Tool Profiles
- Detailed tool information
- Feature comparisons
- Enterprise adoption data
- Community metrics

### Investment Tracking
- Valuation leaders
- Funding rounds timeline
- Business model analysis

### News Intelligence
- Recent market coverage
- Source analysis
- Key themes and signals

## 🚀 Deployment

### GitHub Pages Setup

1. **Enable GitHub Pages** in repository settings
2. **Configure workflow** (already included in `.github/workflows/`)
3. **Push changes** to trigger automatic deployment
4. **Access dashboard** at `https://[username].github.io/[repository]/`

### Manual Deployment

```bash
# Build for production
npm run build:github

# Deploy to GitHub Pages (requires gh-pages package)
npm install -g gh-pages
gh-pages -d out
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Set to 'production' for GitHub Pages
- Base path automatically configured for GitHub Pages deployment

### Customization

- **Branding**: Update colors in `tailwind.config.js`
- **Navigation**: Modify `components/layout/Navigation.tsx`
- **Data Source**: Update path in `scripts/build-data.js`

## 📊 Data Updates

To update the dashboard with new data:

1. Update `../database/curated_export.json`
2. Run `npm run build:data`
3. Commit and push changes
4. GitHub Actions will automatically redeploy

## 🔍 Analytics & Monitoring

The dashboard is optimized for:

- **Performance**: Static generation for fast loading
- **SEO**: Proper meta tags and structured data
- **Accessibility**: WCAG compliant design
- **Analytics**: Ready for Google Analytics integration

## 📝 Maintenance

### Regular Updates
- Data refresh (weekly/monthly)
- Dependency updates
- Performance monitoring

### Adding New Features
- New tool categories
- Additional data sources
- Enhanced visualizations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is part of the AI Intelligence Platform and follows the same licensing terms.

---

**Built for executives, by developers. Data-driven insights for strategic decision making.**