'use client';

import { ToolDetailData } from '@/types/database';
import { Youtube, Link as LinkIcon, Book, Rss } from 'lucide-react';

interface ResourcesSectionProps {
  data: ToolDetailData;
}

interface Resource {
  type: string;
  link: string;
  title?: string;
}

const iconMap: { [key: string]: React.ReactNode } = {
  'Official Website': <LinkIcon className="w-4 h-4 text-blue-500" />,
  'Documentation': <Book className="w-4 h-4 text-green-500" />,
  'Blog': <Rss className="w-4 h-4 text-orange-500" />,
  'YouTube Video': <Youtube className="w-4 h-4 text-red-500" />,
  'default': <LinkIcon className="w-4 h-4 text-gray-500" />,
};

// Function to format the resource type for display
const formatType = (type: string) => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
};

export default function ResourcesSection({ data }: ResourcesSectionProps) {
  const { snapshot, urls } = data;

  const resources: Resource[] = [];

  // 1. Add primary URLs from the tool_urls table
  if (urls && urls.length > 0) {
    urls.forEach(urlInfo => {
      resources.push({
        type: formatType(urlInfo.url_type),
        link: urlInfo.url,
        title: urlInfo.url,
      });
    });
  }

  // 2. Add case studies
  if (snapshot?.community_metrics?.case_studies) {
    snapshot.community_metrics.case_studies.forEach(study => {
      // Check if the case study is a URL or just text
      const isUrl = study.startsWith('http');
      resources.push({
        type: 'Case Study',
        link: isUrl ? study : '#',
        title: study,
      });
    });
  }
  
  // 3. Extract links from raw data
  const rawData = snapshot?.raw_data;
  if (rawData) {
    // Reddit Mentions
    if (rawData.reddit_data?.search_results) {
      rawData.reddit_data.search_results.forEach((item: any) => {
        resources.push({
          type: 'Reddit Mention',
          link: item.url,
          title: item.title,
        });
      });
    }
    // Hacker News Mentions
    if (rawData.hackernews_data?.hits) {
      rawData.hackernews_data.hits.forEach((item: any) => {
        if (item.url) {
          resources.push({
            type: 'Hacker News',
            link: item.url,
            title: item.title,
          });
        }
      });
    }
    // Dev.to Articles
    if (rawData.devto_data?.articles) {
        rawData.devto_data.articles.forEach((item: any) => {
            resources.push({
                type: 'Dev.to Article',
                link: item.url,
                title: item.title,
            });
        });
    }
    // Medium Articles
    if (rawData.medium_data?.posts) {
        rawData.medium_data.posts.forEach((item: any) => {
            resources.push({
                type: 'Medium Article',
                link: item.url,
                title: item.title,
            });
        });
    }
  }
  
  const uniqueResources = Array.from(new Map(resources.map(r => [r.link, r])).values());

  if (uniqueResources.length === 0) {
    return (
        <div className="text-center py-8 text-gray-500">
            <p>No external resources or links available.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">External Resources</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link / Title
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniqueResources.map((resource, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 hover:underline"
                    >
                      {resource.title || resource.link}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 