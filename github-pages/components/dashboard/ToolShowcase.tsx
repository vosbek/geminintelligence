import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'

interface Tool {
  id: number
  name: string
  description: string
  company_name: string
  category: string
  github_url: string | null
  snapshots: Array<{
    basic_info: {
      description: string
    }
    technical_details: {
      feature_list: string[]
      unique_differentiators: string[]
      deployment_options: string[]
    }
    company_info: {
      valuation: string | null
      list_of_companies_using_tool: string[]
      testimonials: string[]
    }
    community_metrics: {
      reddit_mentions: number
      github_stars: number | null
    }
  }>
}

interface ShowcaseData {
  tools: Tool[]
  marketMetrics: {
    valuations: Array<{
      name: string
      valuation: number
    }>
  }
}

async function getShowcaseData(): Promise<ShowcaseData> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return {
      tools: [],
      marketMetrics: { valuations: [] }
    }
  }
}

export default async function ToolShowcase() {
  const data = await getShowcaseData()
  
  // Get top tools by various metrics
  const valuationLeaders = data.marketMetrics.valuations.slice(0, 3).map(v => v.name)
  const featuredTools = data.tools
    .filter(tool => tool.snapshots?.length > 0)
    .slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Market Leaders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredTools.map((tool) => {
          const snapshot = tool.snapshots[0]
          const isLeader = valuationLeaders.includes(tool.name)
          
          return (
            <div key={tool.id} className={`tool-card ${isLeader ? 'border-accent-300 bg-accent-50' : ''}`}>
              {isLeader && (
                <div className="flex justify-between items-center mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Market Leader
                  </span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-executive-900">{tool.name}</h3>
                  <p className="text-sm text-executive-600">{tool.company_name}</p>
                </div>
                <span className="category-badge">{tool.category.replace('_', ' ')}</span>
              </div>

              <p className="text-executive-700 text-sm mb-4 line-clamp-3">
                {snapshot.basic_info.description}
              </p>

              {/* Key Features */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-executive-900 mb-2">Key Features</h4>
                <ul className="text-xs text-executive-600 space-y-1">
                  {snapshot.technical_details.feature_list.slice(0, 3).map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>

              {/* Enterprise Adoption */}
              {snapshot.company_info.list_of_companies_using_tool?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-executive-900 mb-2">Enterprise Users</h4>
                  <div className="flex flex-wrap gap-1">
                    {snapshot.company_info.list_of_companies_using_tool.slice(0, 4).map((company, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-executive-100 text-executive-700">
                        {company}
                      </span>
                    ))}
                    {snapshot.company_info.list_of_companies_using_tool.length > 4 && (
                      <span className="text-xs text-executive-500">
                        +{snapshot.company_info.list_of_companies_using_tool.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Community Metrics */}
              <div className="flex justify-between items-center text-sm text-executive-500 pt-4 border-t border-executive-200">
                <div className="flex space-x-4">
                  {snapshot.community_metrics.reddit_mentions > 0 && (
                    <span>{snapshot.community_metrics.reddit_mentions} mentions</span>
                  )}
                  {snapshot.community_metrics.github_stars && (
                    <span>⭐ {snapshot.community_metrics.github_stars.toLocaleString()}</span>
                  )}
                </div>
                <Link 
                  href={`/tools/${tool.id}`}
                  className="text-accent-600 hover:text-accent-700 font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Market Positioning */}
      <div className="executive-card p-6">
        <h3 className="text-xl executive-subheading mb-4">Market Positioning Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Enterprise Leaders</h4>
            <p className="text-executive-600 text-sm mb-3">
              Tools with significant enterprise adoption and proven scalability
            </p>
            <ul className="text-sm space-y-1">
              {featuredTools
                .filter(tool => tool.snapshots[0]?.company_info?.list_of_companies_using_tool?.length > 5)
                .slice(0, 3)
                .map(tool => (
                  <li key={tool.id} className="text-executive-700">• {tool.name}</li>
                ))
              }
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Community Favorites</h4>
            <p className="text-executive-600 text-sm mb-3">
              Strong developer community engagement and adoption
            </p>
            <ul className="text-sm space-y-1">
              {featuredTools
                .filter(tool => tool.snapshots[0]?.community_metrics?.reddit_mentions > 10)
                .slice(0, 3)
                .map(tool => (
                  <li key={tool.id} className="text-executive-700">• {tool.name}</li>
                ))
              }
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Innovation Leaders</h4>
            <p className="text-executive-600 text-sm mb-3">
              Cutting-edge features and unique market differentiators
            </p>
            <ul className="text-sm space-y-1">
              {featuredTools
                .filter(tool => tool.snapshots[0]?.technical_details?.unique_differentiators?.length > 2)
                .slice(0, 3)
                .map(tool => (
                  <li key={tool.id} className="text-executive-700">• {tool.name}</li>
                ))
              }
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}