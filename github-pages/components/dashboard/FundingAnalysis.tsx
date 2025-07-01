import { promises as fs } from 'fs'
import path from 'path'

interface FundingData {
  marketMetrics: {
    valuations: Array<{
      name: string
      valuation: number
      category: string
      company?: string
    }>
  }
  tools: Array<{
    name: string
    company_name: string
    snapshots: Array<{
      company_info: {
        funding_rounds: Array<Record<string, string>>
        total_funding_amount: string
        valuation: string | null
        business_model: string
      }
    }>
  }>
}

async function getFundingData(): Promise<FundingData> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return {
      marketMetrics: { valuations: [] },
      tools: []
    }
  }
}

export default async function FundingAnalysis() {
  const data = await getFundingData()

  // Sort valuations by amount
  const topValuations = data.marketMetrics.valuations.slice(0, 5)

  // Extract funding rounds information
  const fundingRounds = data.tools
    .filter(tool => tool.snapshots?.[0]?.company_info?.funding_rounds?.length > 0)
    .map(tool => ({
      name: tool.name,
      company: tool.company_name,
      rounds: tool.snapshots[0].company_info.funding_rounds,
      totalFunding: tool.snapshots[0].company_info.total_funding_amount,
      businessModel: tool.snapshots[0].company_info.business_model
    }))

  return (
    <div className="space-y-8">
      {/* Valuation Leaders */}
      <div className="chart-container">
        <h3 className="text-xl executive-subheading mb-6">Valuation Leaders</h3>
        <div className="space-y-4">
          {topValuations.map((company, index) => (
            <div key={company.name} className="flex items-center justify-between p-4 bg-executive-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-executive-900">{company.name}</h4>
                  <p className="text-sm text-executive-600">{company.category.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="valuation-badge">
                  ${(company.valuation / 1000000000).toFixed(1)}B
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funding Rounds */}
      <div className="chart-container">
        <h3 className="text-xl executive-subheading mb-6">Recent Funding Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-executive-200">
            <thead className="bg-executive-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-executive-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-executive-500 uppercase tracking-wider">
                  Latest Round
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-executive-500 uppercase tracking-wider">
                  Total Funding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-executive-500 uppercase tracking-wider">
                  Business Model
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-executive-200">
              {fundingRounds.map((company) => {
                const latestRound = company.rounds[company.rounds.length - 1]
                const [roundType, amount] = Object.entries(latestRound)[0]
                
                return (
                  <tr key={company.name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-executive-900">{company.name}</div>
                        <div className="text-sm text-executive-500">{company.company}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="funding-badge">
                        {roundType} • {amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-executive-900">
                      {company.totalFunding ? 
                        `$${(parseInt(company.totalFunding.replace(/[^0-9]/g, '')) / 1000000).toFixed(0)}M` : 
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-executive-500">
                      {company.businessModel || 'N/A'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Insights */}
      <div className="executive-card p-6 bg-gradient-to-r from-accent-50 to-purple-50">
        <h3 className="text-xl executive-subheading mb-4">Investment Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Market Trends</h4>
            <ul className="text-executive-700 space-y-1 text-sm">
              <li>• Rapid valuation growth in AI coding segment</li>
              <li>• Strong Series A to Series C progression</li>
              <li>• Enterprise adoption driving valuations</li>
              <li>• Competitive funding landscape</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Risk Factors</h4>
            <ul className="text-executive-700 space-y-1 text-sm">
              <li>• High valuations relative to revenue</li>
              <li>• Competitive market dynamics</li>
              <li>• Technology disruption risk</li>
              <li>• Regulatory uncertainty</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}