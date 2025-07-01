import { promises as fs } from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import Link from 'next/link'

interface Tool {
  id: number
  name: string
  description: string
  company_name: string
  legal_company_name: string
  category: string
  github_url: string | null
  urls: Array<{
    url: string
    url_type: string
  }>
  snapshots: Array<{
    basic_info: {
      description: string
      category_classification: string
    }
    technical_details: {
      feature_list: string[]
      pricing_model: Record<string, string>
      comparable_tools: string[]
      unique_differentiators: string[]
      deployment_options: string[]
      supported_languages: string[]
      market_positioning: string
    }
    company_info: {
      valuation: string | null
      funding_rounds: Array<Record<string, string>>
      total_funding_amount: string
      business_model: string
      list_of_companies_using_tool: string[]
      testimonials: string[]
      case_studies: string[]
    }
    community_metrics: {
      reddit_mentions: number
      github_stars: number | null
      github_forks: number | null
    }
    raw_data: {
      news_data: {
        articles: Array<{
          title: string
          source: string
          published_at: string
          url: string
        }>
      }
    }
  }>
}

async function getToolData(id: string): Promise<Tool | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    return data.tools.find((tool: Tool) => tool.id.toString() === id) || null
  } catch (error) {
    return null
  }
}

export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return data.tools.map((tool: Tool) => ({
      id: tool.id.toString()
    }))
  } catch (error) {
    return []
  }
}

export default async function ToolDetailPage({ params }: { params: { id: string } }) {
  const tool = await getToolData(params.id)

  if (!tool) {
    notFound()
  }

  const snapshot = tool.snapshots[0]
  const websiteUrl = tool.urls.find(url => url.url_type === 'website')?.url

  return (
    <div className="min-h-screen bg-executive-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link href="/tools" className="text-accent-600 hover:text-accent-700 font-medium">
            ← Back to Tools
          </Link>
        </div>

        {/* Tool Header */}
        <div className="executive-card p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-4xl executive-heading">{tool.name}</h1>
                <span className="category-badge">{tool.category.replace('_', ' ')}</span>
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="text-lg text-executive-600">
                  <span className="font-medium">Company:</span> {tool.company_name}
                </p>
                <p className="text-lg text-executive-600">
                  <span className="font-medium">Legal Name:</span> {tool.legal_company_name}
                </p>
              </div>

              <p className="text-executive-700 text-lg leading-relaxed">
                {snapshot.basic_info.description}
              </p>
            </div>

            <div className="lg:ml-8 mt-6 lg:mt-0 space-y-4">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-accent-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-accent-700 transition-colors"
                >
                  Visit Website →
                </a>
              )}
              {tool.github_url && (
                <a
                  href={tool.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-executive-700 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-executive-800 transition-colors"
                >
                  View on GitHub →
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Features */}
            <div className="executive-card p-6">
              <h2 className="text-2xl executive-subheading mb-4">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {snapshot.technical_details.feature_list.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-accent-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-executive-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique Differentiators */}
            {snapshot.technical_details.unique_differentiators?.length > 0 && (
              <div className="executive-card p-6">
                <h2 className="text-2xl executive-subheading mb-4">Unique Differentiators</h2>
                <ul className="space-y-3">
                  {snapshot.technical_details.unique_differentiators.map((diff, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-executive-700">{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Market Positioning */}
            {snapshot.technical_details.market_positioning && (
              <div className="executive-card p-6">
                <h2 className="text-2xl executive-subheading mb-4">Market Positioning</h2>
                <p className="text-executive-700 leading-relaxed">
                  {snapshot.technical_details.market_positioning}
                </p>
              </div>
            )}

            {/* Enterprise Adoption */}
            {snapshot.company_info.list_of_companies_using_tool?.length > 0 && (
              <div className="executive-card p-6">
                <h2 className="text-2xl executive-subheading mb-4">Enterprise Adoption</h2>
                <p className="text-executive-600 mb-4">
                  {snapshot.company_info.list_of_companies_using_tool.length} companies using this tool
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {snapshot.company_info.list_of_companies_using_tool.map((company, index) => (
                    <div key={index} className="bg-executive-50 border border-executive-200 rounded-lg p-3 text-center">
                      <span className="text-sm font-medium text-executive-900">{company}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials */}
            {snapshot.company_info.testimonials?.length > 0 && (
              <div className="executive-card p-6">
                <h2 className="text-2xl executive-subheading mb-4">Customer Testimonials</h2>
                <div className="space-y-4">
                  {snapshot.company_info.testimonials.slice(0, 3).map((testimonial, index) => (
                    <blockquote key={index} className="bg-executive-50 border-l-4 border-accent-600 pl-4 py-3">
                      <p className="text-executive-700 italic">&ldquo;{testimonial}&rdquo;</p>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Information */}
            <div className="executive-card p-6">
              <h3 className="text-xl executive-subheading mb-4">Company Information</h3>
              <div className="space-y-3">
                {snapshot.company_info.valuation && (
                  <div>
                    <span className="text-sm text-executive-600">Valuation</span>
                    <p className="font-semibold text-executive-900">{snapshot.company_info.valuation}</p>
                  </div>
                )}
                {snapshot.company_info.total_funding_amount && (
                  <div>
                    <span className="text-sm text-executive-600">Total Funding</span>
                    <p className="font-semibold text-executive-900">
                      ${(parseInt(snapshot.company_info.total_funding_amount.replace(/[^0-9]/g, '')) / 1000000).toFixed(0)}M
                    </p>
                  </div>
                )}
                {snapshot.company_info.business_model && (
                  <div>
                    <span className="text-sm text-executive-600">Business Model</span>
                    <p className="font-semibold text-executive-900">{snapshot.company_info.business_model}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="executive-card p-6">
              <h3 className="text-xl executive-subheading mb-4">Technical Details</h3>
              <div className="space-y-3">
                {snapshot.technical_details.deployment_options?.length > 0 && (
                  <div>
                    <span className="text-sm text-executive-600">Deployment</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {snapshot.technical_details.deployment_options.map((option, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-executive-100 text-executive-700">
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {snapshot.technical_details.supported_languages?.length > 0 && (
                  <div>
                    <span className="text-sm text-executive-600">Languages</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {snapshot.technical_details.supported_languages.map((lang, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-accent-100 text-accent-700">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            {snapshot.technical_details.pricing_model && 
             Object.keys(snapshot.technical_details.pricing_model).length > 0 && (
              <div className="executive-card p-6">
                <h3 className="text-xl executive-subheading mb-4">Pricing</h3>
                <div className="space-y-3">
                  {Object.entries(snapshot.technical_details.pricing_model).map(([plan, price]) => (
                    <div key={plan} className="flex justify-between items-center">
                      <span className="text-executive-700">{plan}</span>
                      <span className="font-semibold text-executive-900">{price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Metrics */}
            <div className="executive-card p-6">
              <h3 className="text-xl executive-subheading mb-4">Community</h3>
              <div className="space-y-3">
                {snapshot.community_metrics.reddit_mentions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-executive-600">Reddit Mentions</span>
                    <span className="font-medium">{snapshot.community_metrics.reddit_mentions}</span>
                  </div>
                )}
                {snapshot.community_metrics.github_stars && (
                  <div className="flex justify-between">
                    <span className="text-executive-600">GitHub Stars</span>
                    <span className="font-medium">{snapshot.community_metrics.github_stars.toLocaleString()}</span>
                  </div>
                )}
                {snapshot.community_metrics.github_forks && (
                  <div className="flex justify-between">
                    <span className="text-executive-600">GitHub Forks</span>
                    <span className="font-medium">{snapshot.community_metrics.github_forks.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Competitors */}
            {snapshot.technical_details.comparable_tools?.length > 0 && (
              <div className="executive-card p-6">
                <h3 className="text-xl executive-subheading mb-4">Competitors</h3>
                <ul className="space-y-2">
                  {snapshot.technical_details.comparable_tools.map((competitor, index) => (
                    <li key={index} className="text-executive-700">{competitor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}