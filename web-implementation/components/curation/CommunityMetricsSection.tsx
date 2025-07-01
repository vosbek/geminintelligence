'use client';
import { ToolDetailData } from '@/types/database';
import { useState } from 'react';
import EditableField from './EditableField';

export default function CommunityMetricsSection({ data }: { data: ToolDetailData }) {
  const { tool, snapshot, curated_data } = data;
  const metrics = snapshot?.community_metrics;

  const curatedMetrics = curated_data.find(c => c.section_name === 'community_metrics')?.curated_content;
  const displayData = curatedMetrics || metrics;
  
  const [editMode, setEditMode] = useState(false);

  const handleSave = async (sectionData: any) => {
    try {
      const response = await fetch(`/api/tool/${tool.id}/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_name: 'community_metrics',
          curated_content: sectionData,
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      alert('Community metrics saved!');
      setEditMode(false);
    } catch (error) {
      console.error(error);
      alert('Error saving community metrics');
    }
  };

  if (!displayData) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Community Metrics</h2>
        <div className="text-gray-500 text-center py-8">
          No community metrics available
        </div>
      </div>
    );
  }

  const renderMetric = (label: string, value: number | undefined, field: string, isCurrency = false) => (
    <div className="bg-white rounded-lg border p-4 text-center">
        {editMode ? (
            <EditableField
                value={value?.toLocaleString() || '0'}
                type="text"
                onSave={(val) => handleSave({ ...displayData, [field]: Number(val.replace(/,/g, '')) })}
            />
        ) : (
            <div className="text-2xl font-bold">{value ? (isCurrency ? '$' : '') + value.toLocaleString() : 'N/A'}</div>
        )}
        <div className="text-sm text-gray-600">{label}</div>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Community Metrics</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            editMode
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {editMode ? 'Cancel' : 'Edit Section'}
        </button>
      </div>
      
      {/* GitHub Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderMetric("GitHub Stars", displayData.github_stars, 'github_stars')}
        {renderMetric("GitHub Forks", displayData.github_forks, 'github_forks')}
        <div className="bg-white rounded-lg border p-4 text-center">
            {editMode ? (
                <EditableField
                    value={displayData.github_last_commit_date ? new Date(displayData.github_last_commit_date).toLocaleDateString() : ''}
                    type="text"
                    onSave={(value) => handleSave({ ...displayData, github_last_commit_date: new Date(value).toISOString() })}
                />
            ) : (
                <div className="text-2xl font-bold text-green-600">
                    {displayData.github_last_commit_date ? new Date(displayData.github_last_commit_date).toLocaleDateString() : 'N/A'}
                </div>
            )}
            <div className="text-sm text-gray-600">Last Commit</div>
            <div className="text-xs text-gray-400 mt-1">🔄 Active development</div>
        </div>
      </div>

      {/* YouTube Engagement */}
      <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">YouTube Presence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderMetric('YouTube Mentions', displayData.youtube_mention_count, 'youtube_mention_count')}
            {renderMetric('YouTube Tutorials', displayData.youtube_tutorial_count, 'youtube_tutorial_count')}
            <div className="text-center">
                <div className="text-sm text-gray-600">YouTube Sentiment</div>
                {editMode ? (
                    <EditableField 
                        value={displayData.youtube_sentiment?.toString() || '0'} 
                        type="text"
                        onSave={(value) => handleSave({ ...displayData, youtube_sentiment: Number(value) })}
                    />
                ) : (
                    <div className={`text-lg font-bold ${displayData.youtube_sentiment && displayData.youtube_sentiment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {displayData.youtube_sentiment ? (displayData.youtube_sentiment > 0 ? 'Positive' : 'Negative/Mixed') : 'N/A'}
                    </div>
                )}
            </div>
          </div>
        </div>

      {/* Community Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {renderMetric("Reddit Mentions", displayData.reddit_mentions, 'reddit_mentions')}
        {renderMetric("HackerNews", displayData.hacker_news_mentions_count, 'hacker_news_mentions_count')}
        {renderMetric("StackOverflow", displayData.stackoverflow_questions_count, 'stackoverflow_questions_count')}
        {renderMetric("Dev.to Articles", displayData.devto_articles_count, 'devto_articles_count')}
      </div>

      {/* Package Stats */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-4">Package Ecosystem</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderMetric("NPM Packages", displayData.npm_packages_count, 'npm_packages_count')}
            {renderMetric("PyPI Packages", displayData.pypi_packages_count, 'pypi_packages_count')}
            {renderMetric("Weekly Downloads", displayData.npm_weekly_downloads, 'npm_weekly_downloads')}
        </div>
      </div>

      {/* Enterprise Adoption */}
      <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">
            Enterprise Adoption
          </h3>
          {editMode ? (
            <EditableField 
                type="array" 
                value={displayData.list_of_companies_using_tool || []} 
                onSave={(values) => handleSave({...displayData, list_of_companies_using_tool: values})} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayData.list_of_companies_using_tool?.map((company: string, index: number) => (
                <div key={index} className="bg-gray-50 rounded px-3 py-2 text-sm text-center font-medium">
                    {company}
                </div>
                ))}
            </div>
          )}
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-4">
            Community Testimonials
        </h3>
        {editMode ? (
            <EditableField 
                type="array" 
                value={displayData.testimonials || []} 
                onSave={(values) => handleSave({...displayData, testimonials: values})} />
        ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {displayData.testimonials?.slice(0, 6).map((testimonial: string, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700 italic">"{testimonial}"</div>
                </div>
                ))}
                {displayData.testimonials && displayData.testimonials.length > 6 && (
                <div className="text-center text-sm text-gray-500">
                    And {displayData.testimonials.length - 6} more testimonials...
                </div>
                )}
            </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Content & Rankings</h3>
            <div className="space-y-2">
                {renderMetric("ProductHunt Ranking", displayData.producthunt_ranking, 'producthunt_ranking')}
                {renderMetric("Medium Articles", displayData.medium_articles_count, 'medium_articles_count')}
            </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Community Sentiment</h3>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-600">Reddit Sentiment:</span>
                    {editMode ? (
                        <EditableField 
                            value={displayData.reddit_sentiment_score?.toString() || '0'} 
                            type="text"
                            onSave={(value) => handleSave({ ...displayData, reddit_sentiment_score: Number(value) })}
                        />
                    ) : (
                        <span className={`font-medium ${displayData.reddit_sentiment_score && displayData.reddit_sentiment_score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {displayData.reddit_sentiment_score ? (displayData.reddit_sentiment_score > 0 ? '+' : '') + displayData.reddit_sentiment_score : 'N/A'}
                        </span>
                    )}
                </div>
                 <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Case Studies</h3>
                    {editMode ? (
                        <EditableField 
                            type="array" 
                            value={displayData.case_studies || []} 
                            onSave={(values) => handleSave({...displayData, case_studies: values})} 
                        />
                    ) : (
                         <div className="flex justify-between">
                            <span className="text-gray-600">Case Studies:</span>
                            <span className="font-medium">{displayData.case_studies?.length || 0}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}