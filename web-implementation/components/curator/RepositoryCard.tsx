'use client';

import { StarIcon, CodeBracketIcon, CalendarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { CuratedRepository } from '@/types/database';

interface RepositoryCardProps {
  repository: CuratedRepository;
}

export default function RepositoryCard({ repository }: RepositoryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'agentic-ides': 'bg-purple-100 text-purple-800',
      'code-generation': 'bg-blue-100 text-blue-800',
      'mcp-tools': 'bg-green-100 text-green-800',
      'developer-productivity': 'bg-indigo-100 text-indigo-800',
      'cli-tools': 'bg-gray-100 text-gray-800',
      'vscode-extensions': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {repository.name}
            </h3>
            {repository.mcp_compatible && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                MCP
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {repository.description}
          </p>
        </div>
        
        {/* Final Score */}
        <div className="ml-4 flex-shrink-0">
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(repository.final_score)}`}>
            {(repository.final_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <StarIcon className="h-4 w-4" />
          <span>{repository.star_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <CodeBracketIcon className="h-4 w-4" />
          <span>{repository.language || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDate(repository.last_commit_date)}</span>
        </div>
      </div>

      {/* Category and Installation */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(repository.category)}`}>
          {repository.category.replace('-', ' ')}
        </span>
        
        <div className="text-xs text-gray-500">
          Install: {repository.installation_method}
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-sm font-medium text-gray-900">
            {(repository.developer_relevance_score * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Dev Relevance</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-sm font-medium text-gray-900">
            {(repository.utility_score * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Utility</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          Discovered {formatDate(repository.discovered_at)}
        </div>
        
        <div className="flex space-x-2">
          <a
            href={repository.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <span>GitHub</span>
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
} 