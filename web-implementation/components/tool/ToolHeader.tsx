// components/tool/ToolHeader.tsx - Tool detail page header
'use client';

import Link from 'next/link';
import { AITool, ToolSnapshot } from '@/types/database';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  LinkIcon,
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline';

interface ToolHeaderProps {
  tool: AITool;
  snapshot?: ToolSnapshot;
}

export default function ToolHeader({ tool, snapshot }: ToolHeaderProps) {
  const getStatusIcon = () => {
    if (tool.run_status === 'processed' && snapshot) {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    } else if (tool.run_status === 'processing') {
      return <ClockIcon className="h-6 w-6 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-6 w-6 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Back button */}
      <div className="mb-4">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Tool info */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
            {getStatusIcon()}
          </div>
          
          <p className="text-gray-600 text-lg mb-4">
            {tool.description || 'No description available'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Category:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {tool.category}
              </span>
            </div>

            {tool.company_name && (
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Company:</span>
                <span className="text-gray-900">{tool.company_name}</span>
              </div>
            )}

            {tool.github_url && (
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <a 
                  href={tool.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  GitHub Repository
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Status info */}
        <div className="text-right">
          {snapshot && (
            <div className="text-sm text-gray-500">
              <div>Last processed:</div>
              <div className="font-medium text-gray-900">
                {new Date(snapshot.snapshot_date).toLocaleString()}
              </div>
            </div>
          )}
          
          {tool.last_run && (
            <div className="text-sm text-gray-500 mt-2">
              <div>Last run:</div>
              <div className="font-medium text-gray-900">
                {new Date(tool.last_run).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}