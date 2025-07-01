import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import Navigation from '@/components/layout/Navigation'

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
      pricing_model: Record<string, string>
      deployment_options: string[]
    }
    company_info: {
      valuation: string | null
      list_of_companies_using_tool: string[]
    }
    community_metrics: {
      reddit_mentions: number
    }
  }>
}

async function getToolsData() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    return data.tools as Tool[]
  } catch (error) {
    return []
  }
}

export default async function ToolsPage() {
  const tools = await getToolsData()
  const categories = [...new Set(tools.map(tool => tool.category))]

  return (
    <div className="min-h-screen bg-executive-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl executive-heading mb-4">AI Developer Tools</h1>
          <p className="text-lg executive-text max-w-3xl mx-auto">
            Comprehensive directory of AI-powered development tools with detailed intelligence and market analysis.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="mb-8">
          <h2 className="text-xl executive-subheading mb-4">Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <span key={category} className="category-badge">
                {category.replace('_', ' ')} ({tools.filter(t => t.category === category).length})
              </span>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const snapshot = tool.snapshots?.[0]
            const hasValuation = snapshot?.company_info?.valuation
            const enterpriseUsers = snapshot?.company_info?.list_of_companies_using_tool?.length || 0
            
            return (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <div className="tool-card h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-executive-900">{tool.name}</h3>
                      <p className="text-sm text-executive-600">{tool.company_name}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="category-badge">{tool.category.replace('_', ' ')}</span>
                      {hasValuation && (
                        <span className="valuation-badge text-xs">
                          Valued
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-executive-700 text-sm mb-4 line-clamp-3">
                    {snapshot?.basic_info?.description || tool.description}
                  </p>

                  {/* Key Metrics */}
                  <div className="space-y-2 mb-4">
                    {enterpriseUsers > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-executive-600">Enterprise Users:</span>
                        <span className="font-medium">{enterpriseUsers}</span>
                      </div>
                    )}
                    {snapshot?.community_metrics?.reddit_mentions > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-executive-600">Reddit Mentions:</span>
                        <span className="font-medium">{snapshot.community_metrics.reddit_mentions}</span>
                      </div>
                    )}
                    {snapshot?.technical_details?.deployment_options?.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-executive-600">Platforms:</span>
                        <span className="font-medium">{snapshot.technical_details.deployment_options.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Info */}
                  {snapshot?.technical_details?.pricing_model && 
                   Object.keys(snapshot.technical_details.pricing_model).length > 0 && (
                    <div className="pt-4 border-t border-executive-200">
                      <h4 className="text-sm font-medium text-executive-900 mb-2">Pricing</h4>
                      <div className="space-y-1">
                        {Object.entries(snapshot.technical_details.pricing_model).slice(0, 2).map(([plan, price]) => (
                          <div key={plan} className="flex justify-between text-xs">
                            <span className="text-executive-600">{plan}:</span>
                            <span className="font-medium">{price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-right">
                    <span className="text-accent-600 hover:text-accent-700 font-medium text-sm">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}