import Navigation from '@/components/layout/Navigation'
import { promises as fs } from 'fs'
import path from 'path'

async function getReportData() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return null
  }
}

export default async function ReportsPage() {
  const data = await getReportData()

  return (
    <div className="min-h-screen bg-executive-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl executive-heading mb-4">Executive Reports</h1>
          <p className="text-lg executive-text max-w-3xl mx-auto">
            Comprehensive market intelligence reports for strategic decision making.
          </p>
        </div>

        <div className="space-y-8">
          {/* Executive Summary Report */}
          <div className="executive-card p-8">
            <h2 className="text-2xl executive-subheading mb-6">Market Summary Report</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-executive-900 mb-2">
                  {data?.overview?.totalTools || 0}
                </div>
                <div className="text-sm text-executive-600">AI Tools Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-executive-900 mb-2">
                  {data?.overview?.totalFunding || '$0'}
                </div>
                <div className="text-sm text-executive-600">Total Funding</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-executive-900 mb-2">
                  {data?.overview?.categories?.length || 0}
                </div>
                <div className="text-sm text-executive-600">Market Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-executive-900 mb-2">
                  {data?.marketMetrics?.valuations?.length || 0}
                </div>
                <div className="text-sm text-executive-600">Valued Companies</div>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-executive-900 mb-3">Key Findings</h3>
              <ul className="text-executive-700 space-y-2">
                <li>The AI developer tools market has attracted significant venture capital investment, with total tracked funding exceeding $1B</li>
                <li>Market leaders have achieved multi-billion dollar valuations, indicating strong investor confidence in the sector</li>
                <li>Enterprise adoption is accelerating, with major companies integrating AI coding tools into their development workflows</li>
                <li>Multiple distinct categories have emerged, from AI-powered IDEs to specialized code completion tools</li>
                <li>Community engagement metrics show strong developer adoption and enthusiasm for these tools</li>
              </ul>
            </div>

            <div className="mt-8 p-4 bg-accent-50 border border-accent-200 rounded-lg">
              <h4 className="font-semibold text-accent-900 mb-2">Report Methodology</h4>
              <p className="text-accent-800 text-sm">
                This report is based on comprehensive data collection from 11 sources including GitHub, 
                news articles, community discussions, financial data, and company websites. 
                Data is processed using advanced AI analysis to extract structured intelligence.
              </p>
            </div>
          </div>

          {/* Competitive Analysis */}
          <div className="executive-card p-8">
            <h2 className="text-2xl executive-subheading mb-6">Competitive Landscape Analysis</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-executive-900 mb-3">Market Leaders by Valuation</h3>
                <div className="space-y-3">
                  {data?.marketMetrics?.valuations?.slice(0, 5).map((company: any, index: number) => (
                    <div key={company.name} className="flex justify-between items-center p-3 bg-executive-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-accent-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-executive-900">{company.name}</span>
                      </div>
                      <span className="text-executive-600">
                        ${(company.valuation / 1000000000).toFixed(1)}B
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-executive-900 mb-3">Strategic Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-executive-900 mb-2">Investment Opportunities</h4>
                    <ul className="text-executive-700 text-sm space-y-1">
                      <li>• Early-stage AI coding startups with unique technology</li>
                      <li>• Specialized tools for enterprise development workflows</li>
                      <li>• Integration platforms connecting multiple AI services</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-executive-900 mb-2">Risk Considerations</h4>
                    <ul className="text-executive-700 text-sm space-y-1">
                      <li>• High valuations may not be sustainable long-term</li>
                      <li>• Intense competition from tech giants</li>
                      <li>• Rapid technology evolution and disruption risk</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="executive-card p-8 text-center">
            <h2 className="text-2xl executive-subheading mb-4">Download Reports</h2>
            <p className="text-executive-600 mb-6">
              Access detailed PDF reports and data exports for further analysis.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-accent-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-700 transition-colors">
                Download Executive Summary
              </button>
              <button className="bg-executive-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-executive-800 transition-colors">
                Download Market Analysis
              </button>
              <button className="border border-executive-300 text-executive-700 px-6 py-3 rounded-lg font-medium hover:bg-executive-50 transition-colors">
                Export Data (JSON)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}