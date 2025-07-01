'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import CuratorControls from '@/components/curator/CuratorControls';
import RepositoryCard from '@/components/curator/RepositoryCard';
import { CuratedRepository } from '@/types/database';

interface CuratorStats {
  totalRepositories: number;
  totalRuns: number;
  topCategory: { category: string; count: number };
  averageScore: number;
  mcpCompatibleCount: number;
}

interface CuratorData {
  stats: CuratorStats;
  repositories: CuratedRepository[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function CuratorPage() {
  const [data, setData] = useState<CuratorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredRepositories, setFilteredRepositories] = useState<CuratedRepository[]>([]);

  // Load curator data
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curator');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setFilteredRepositories(result.repositories);
      }
    } catch (error) {
      console.error('Error loading curator data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search repositories
  const searchRepositories = async (query: string) => {
    if (!query.trim()) {
      setFilteredRepositories(data?.repositories || []);
      return;
    }

    try {
      const response = await fetch(`/api/curator/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const result = await response.json();
        setFilteredRepositories(result.repositories);
      }
    } catch (error) {
      console.error('Error searching repositories:', error);
    }
  };

  // Filter by category
  const filterByCategory = async (category: string) => {
    if (!category) {
      setFilteredRepositories(data?.repositories || []);
      return;
    }

    try {
      const response = await fetch(`/api/curator/search?category=${encodeURIComponent(category)}`);
      if (response.ok) {
        const result = await response.json();
        setFilteredRepositories(result.repositories);
      }
    } catch (error) {
      console.error('Error filtering by category:', error);
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedCategory('');
    searchRepositories(term);
  };

  // Handle category filter
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm('');
    filterByCategory(category);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setFilteredRepositories(data?.repositories || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = [
    'agentic-ides',
    'code-generation', 
    'mcp-tools',
    'developer-productivity',
    'cli-tools',
    'vscode-extensions'
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading curator data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Developer Tools Curator</h1>
            <p className="text-gray-600">
              AI-powered discovery and curation of trending developer tools and repositories
            </p>
          </div>
        </div>

        {/* Statistics */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.stats.totalRepositories}
              </div>
              <div className="text-sm text-gray-600">Total Repositories</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.stats.mcpCompatibleCount}
              </div>
              <div className="text-sm text-gray-600">MCP Compatible</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.stats.totalRuns}
              </div>
              <div className="text-sm text-gray-600">Curation Runs</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {(data.stats.averageScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-lg font-bold text-indigo-600">
                {data.stats.topCategory.category.replace('-', ' ')}
              </div>
              <div className="text-sm text-gray-600">Top Category ({data.stats.topCategory.count})</div>
            </div>
          </div>
        )}
      </div>

      {/* Curator Controls */}
      <CuratorControls onRunComplete={loadData} />

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('-', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          Showing {filteredRepositories.length} repositories
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedCategory && ` in ${selectedCategory.replace('-', ' ')}`}
        </div>
      </div>

      {/* Repositories Grid */}
      {filteredRepositories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepositories.map((repository) => (
            <RepositoryCard key={repository.id} repository={repository} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {data?.repositories.length === 0 ? 'No repositories found' : 'No results found'}
          </h3>
          <p className="text-gray-600">
            {data?.repositories.length === 0 
              ? 'Run the curator to discover and analyze developer tools.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
} 