import { promises as fs } from 'fs'
import path from 'path'
import { format, parseISO } from 'date-fns'

interface NewsItem {
  title: string
  source: string
  date: string
  tool: string
  company: string
}

interface NewsData {
  recentNews: NewsItem[]
}

async function getNewsData(): Promise<NewsData> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboard-data.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return { recentNews: [] }
  }
}

export default async function NewsHighlights() {
  const data = await getNewsData()
  const recentNews = data.recentNews.slice(0, 10)

  // Group news by source for diversity
  const newsBySource = recentNews.reduce((acc, news) => {
    if (!acc[news.source]) acc[news.source] = []
    acc[news.source].push(news)
    return acc
  }, {} as Record<string, NewsItem[]>)

  return (
    <div className="space-y-8">
      {/* Recent Headlines */}
      <div className="chart-container">
        <h3 className="text-xl executive-subheading mb-6">Recent Market Intelligence</h3>
        <div className="space-y-4">
          {recentNews.map((news, index) => (
            <div key={index} className="news-item">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-medium text-executive-900 line-clamp-2 flex-1 mr-4">
                  {news.title}
                </h4>
                <span className="text-sm text-executive-500 whitespace-nowrap">
                  {format(parseISO(news.date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-accent-600">{news.source}</span>
                <span className="text-sm text-executive-500">•</span>
                <span className="text-sm text-executive-600">{news.tool}</span>
                <span className="text-sm text-executive-500">•</span>
                <span className="text-sm text-executive-500">{news.company}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Sources Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="executive-card p-6">
          <h3 className="text-lg executive-subheading mb-4">Media Coverage</h3>
          <div className="space-y-3">
            {Object.entries(newsBySource)
              .sort(([,a], [,b]) => b.length - a.length)
              .slice(0, 5)
              .map(([source, articles]) => (
                <div key={source} className="flex justify-between items-center">
                  <span className="text-executive-700">{source}</span>
                  <span className="text-sm font-medium text-accent-600">
                    {articles.length} article{articles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="executive-card p-6">
          <h3 className="text-lg executive-subheading mb-4">Coverage Trends</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-executive-700">Total Articles Tracked</span>
              <span className="font-medium text-executive-900">{recentNews.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-executive-700">Unique Sources</span>
              <span className="font-medium text-executive-900">{Object.keys(newsBySource).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-executive-700">Companies Mentioned</span>
              <span className="font-medium text-executive-900">
                {[...new Set(recentNews.map(news => news.company))].length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-executive-700">Tools Featured</span>
              <span className="font-medium text-executive-900">
                {[...new Set(recentNews.map(news => news.tool))].length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Summary */}
      <div className="executive-card p-6 bg-gradient-to-r from-executive-50 to-accent-50">
        <h3 className="text-lg executive-subheading mb-4">Intelligence Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Key Themes</h4>
            <ul className="text-executive-700 space-y-1 text-sm">
              <li>• &ldquo;Vibe coding&rdquo; emerging as industry trend</li>
              <li>• Enterprise adoption accelerating</li>
              <li>• Significant funding rounds completed</li>
              <li>• AI coding tools becoming mainstream</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-executive-900 mb-2">Market Signals</h4>
            <ul className="text-executive-700 space-y-1 text-sm">
              <li>• High media attention and coverage</li>
              <li>• Major tech company endorsements</li>
              <li>• Competitive hiring and talent acquisition</li>
              <li>• Platform integrations expanding</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}