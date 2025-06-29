'use client';
import { ToolDetailData } from '@/types/database';

export default function CommunityMetricsSection({ data }: { data: ToolDetailData }) {
  const metrics = data.snapshot?.community_metrics;
  
  if (!metrics) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Community Metrics</h2>
        <div className="text-gray-500 text-center py-8">
          No community metrics available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Community Metrics</h2>
      
      {/* GitHub Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.github_stars && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{metrics.github_stars.toLocaleString()}</div>
            <div className="text-sm text-gray-600">GitHub Stars</div>
            <div className="text-xs text-gray-400 mt-1">⭐ Community approval</div>
          </div>
        )}
        
        {metrics.github_forks && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.github_forks.toLocaleString()}</div>
            <div className="text-sm text-gray-600">GitHub Forks</div>
            <div className="text-xs text-gray-400 mt-1">🍴 Developer adoption</div>
          </div>
        )}
        
        {metrics.github_last_commit_date && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Date(metrics.github_last_commit_date).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-600">Last Commit</div>
            <div className="text-xs text-gray-400 mt-1">🔄 Active development</div>
          </div>
        )}
      </div>

      {/* Community Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.reddit_mentions && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-orange-600">{metrics.reddit_mentions.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Reddit Mentions</div>
          </div>
        )}
        
        {metrics.hacker_news_mentions_count && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-purple-600">{metrics.hacker_news_mentions_count}</div>
            <div className="text-sm text-gray-600">HackerNews</div>
          </div>
        )}
        
        {metrics.stackoverflow_questions_count && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-blue-600">{metrics.stackoverflow_questions_count}</div>
            <div className="text-sm text-gray-600">StackOverflow</div>
          </div>
        )}
        
        {metrics.devto_articles_count && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-indigo-600">{metrics.devto_articles_count}</div>
            <div className="text-sm text-gray-600">Dev.to Articles</div>
          </div>
        )}
      </div>

      {/* Package Stats */}
      {(metrics.npm_packages_count || metrics.pypi_packages_count || metrics.npm_weekly_downloads) && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">Package Ecosystem</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.npm_packages_count && (
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{metrics.npm_packages_count}</div>
                <div className="text-sm text-gray-600">NPM Packages</div>
              </div>
            )}
            {metrics.pypi_packages_count !== undefined && (
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{metrics.pypi_packages_count}</div>
                <div className="text-sm text-gray-600">PyPI Packages</div>
              </div>
            )}
            {metrics.npm_weekly_downloads && (
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{metrics.npm_weekly_downloads.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Weekly Downloads</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enterprise Adoption */}
      {metrics.list_of_companies_using_tool && metrics.list_of_companies_using_tool.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">
            Enterprise Adoption ({metrics.list_of_companies_using_tool.length} companies)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {metrics.list_of_companies_using_tool.map((company, index) => (
              <div key={index} className="bg-gray-50 rounded px-3 py-2 text-sm text-center font-medium">
                {company}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {metrics.testimonials && metrics.testimonials.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">
            Community Testimonials ({metrics.testimonials.length} reviews)
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {metrics.testimonials.slice(0, 6).map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-700 italic">"{testimonial}"</div>
              </div>
            ))}
            {metrics.testimonials.length > 6 && (
              <div className="text-center text-sm text-gray-500">
                And {metrics.testimonials.length - 6} more testimonials...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(metrics.producthunt_ranking || metrics.medium_articles_count) && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Content & Rankings</h3>
            <div className="space-y-2">
              {metrics.producthunt_ranking && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ProductHunt Ranking:</span>
                  <span className="font-medium">#{metrics.producthunt_ranking}</span>
                </div>
              )}
              {metrics.medium_articles_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Medium Articles:</span>
                  <span className="font-medium">{metrics.medium_articles_count}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(metrics.reddit_sentiment_score || metrics.case_studies?.length) && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Community Sentiment</h3>
            <div className="space-y-2">
              {metrics.reddit_sentiment_score && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reddit Sentiment:</span>
                  <span className={`font-medium ${metrics.reddit_sentiment_score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.reddit_sentiment_score > 0 ? '+' : ''}{metrics.reddit_sentiment_score}
                  </span>
                </div>
              )}
              {metrics.case_studies && metrics.case_studies.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Case Studies:</span>
                  <span className="font-medium">{metrics.case_studies.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}