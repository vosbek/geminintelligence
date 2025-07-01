import { promises as fs } from 'fs'
import path from 'path'

interface DashboardData {
  overview: {
    totalTools: number
    totalFunding: string
    categories: string[]
    lastUpdated: string
  }
  marketMetrics: {
    valuations: Array<{
      name: string
      valuation: number
      category: string
    }>
  }
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    return {
      overview: {
        totalTools: 0,
        totalFunding: '$0',
        categories: [],
        lastUpdated: new Date().toISOString()
      },
      marketMetrics: {
        valuations: []
      }
    }
  }
}

export default async function ExecutiveSummary() {
  const data = await getDashboardData()
  const topValuation = data.marketMetrics.valuations[0]

  const metrics = [
    {
      label: 'AI Tools Tracked',
      value: data.overview.totalTools.toString(),
      description: 'Comprehensive market coverage'
    },
    {
      label: 'Total Funding',
      value: data.overview.totalFunding,
      description: 'Across all tracked companies'
    },
    {
      label: 'Market Categories',
      value: data.overview.categories.length.toString(),
      description: 'Tool classification segments'
    },
    {
      label: 'Market Leader',
      value: topValuation ? `$${(topValuation.valuation / 1000000000).toFixed(1)}B` : 'N/A',
      description: topValuation ? `${topValuation.name} valuation` : 'No data available'
    }
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl executive-heading mb-4">Executive Summary</h2>
        <p className="text-lg executive-text max-w-3xl mx-auto">
          Current state of the AI developer tools market based on comprehensive intelligence 
          gathering across multiple data sources.
        </p>
      </div>
      
      <div className="metric-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            <p className="text-sm text-executive-500 mt-2">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-accent-50 border border-accent-200 rounded-lg">
        <h3 className="text-lg font-semibold text-accent-900 mb-2">Key Insights</h3>
        <ul className="text-executive-700 space-y-2">
          <li>• AI coding tools represent a rapidly growing market segment with significant venture investment</li>
          <li>• Market leaders have achieved multi-billion dollar valuations in record time</li>
          <li>• Strong community engagement and enterprise adoption driving growth</li>
          <li>• Diverse technology approaches across categories from IDEs to code completion</li>
        </ul>
      </div>
    </div>
  )
}