// components/dashboard/ToolCard.tsx - Tool overview cards
'use client';

import Link from 'next/link';
import { AITool } from '@/types/database';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';

interface ToolCardProps {
  tool: AITool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const getStatusIcon = () => {
    if (tool.run_status === 'processed' && tool.has_intelligence) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (tool.run_status === 'processing') {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (tool.run_status === 'processed' && tool.has_intelligence) {
      return 'Intelligence Available';
    } else if (tool.run_status === 'processing') {
      return 'Processing...';
    } else {
      return 'No Intelligence';
    }
  };

  const getStatusColor = () => {
    if (tool.run_status === 'processed' && tool.has_intelligence) {
      return 'text-green-600 bg-green-50';
    } else if (tool.run_status === 'processing') {
      return 'text-yellow-600 bg-yellow-50';
    } else {
      return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tool.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {tool.description || 'No description available'}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Category:</span>
                <span className="text-gray-900">{tool.category}</span>
              </div>
              
              {tool.company_name && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-20">Company:</span>
                  <span className="text-gray-900">{tool.company_name}</span>
                </div>
              )}
              
              {tool.last_run && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-20">Last Run:</span>
                  <span className="text-gray-900">
                    {new Date(tool.last_run).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          <Link
            href={`/tool/${tool.id}`}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}