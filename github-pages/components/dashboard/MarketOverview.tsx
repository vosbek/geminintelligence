import { promises as fs } from 'fs'
import path from 'path'
import MarketCharts from './MarketCharts'

interface MarketData {
  overview: {
    categories: string[]
  }
  marketMetrics: {
    fundingByCategory: Record<string, number>
    valuations: Array<{
      name: string
      valuation: number
      category: string
    }>
  }
  tools: Array<{
    name: string
    category: string
    company_name: string
  }>
}

// This needs to be a server component to read files
async function getMarketData(): Promise<MarketData> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return {
      overview: { categories: [] },
      marketMetrics: { fundingByCategory: {}, valuations: [] },
      tools: []
    }
  }
}


export default async function MarketOverview() {
  const data = await getMarketData()

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {data.overview.categories.map((category) => {
          const toolCount = data.tools.filter(tool => tool.category === category).length
          const categoryFunding = data.marketMetrics.fundingByCategory[category] || 0
          
          return (
            <div key={category} className="executive-card p-6">
              <h3 className="text-lg font-semibold text-executive-900 mb-2">
                {category.replace('_', ' ')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-executive-600">Tools:</span>
                  <span className="font-medium">{toolCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-executive-600">Funding:</span>
                  <span className="font-medium">
                    ${categoryFunding ? (categoryFunding / 1000000).toFixed(0) : 0}M
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <MarketCharts data={data} />
    </div>
  )
}