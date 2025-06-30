'use client';
import { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  ArrowPathIcon, 
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import AddToolForm from './AddToolForm';

interface ScraperStatus {
  isRunning: boolean;
  progress: {
    total: number;
    running: number;
    completed: number;
    errors: number;
    percentage: number;
  };
  tools: Array<{
    id: number;
    name: string;
    status: string;
    lastRun: string;
    recentlyUpdated: boolean;
  }>;
  recentSnapshots: Array<{
    id: number;
    toolId: number;
    toolName: string;
    date: string;
    reviewStatus: string;
    hasChanges: boolean;
  }>;
}

export default function ScraperControls() {
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Fetch status on component mount and periodically if running
  useEffect(() => {
    fetchStatus();
    
    // Poll status every 10 seconds if scrapers are running
    const interval = setInterval(() => {
      if (status?.isRunning) {
        fetchStatus();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [status?.isRunning]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/snapshots/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const startWeeklyRun = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/snapshots/run-all', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Started weekly run for ${data.toolsCount} tools`);
        fetchStatus(); // Refresh status immediately
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`❌ Failed to start weekly run: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTool = async (toolId: number, toolName: string) => {
    try {
      const response = await fetch(`/api/snapshots/run-tool/${toolId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`🔄 Started refresh for ${toolName}`);
        fetchStatus(); // Refresh status immediately
      } else {
        setMessage(`❌ Error refreshing ${toolName}: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`❌ Failed to refresh ${toolName}: ${errorMessage}`);
    }
  };

  const getStatusIcon = (toolStatus: string) => {
    switch (toolStatus) {
      case 'processed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'update':
        return <ClockIcon className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!status) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Intelligence Scraper Controls</h2>
            <p className="text-gray-600">Manage AI tool data collection and snapshots</p>
          </div>
          
          <div className="flex space-x-3">
            <AddToolForm />
            <button
              onClick={startWeeklyRun}
              disabled={isLoading || status.isRunning}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isLoading || status.isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {isLoading ? 'Starting...' : status.isRunning ? 'Running...' : 'Start Weekly Intelligence Run'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {status.isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{status.progress.completed}/{status.progress.total} tools completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${status.progress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            {message}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{status.progress.total}</div>
            <div className="text-sm text-gray-600">Total Tools</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{status.progress.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{status.progress.running}</div>
            <div className="text-sm text-gray-600">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{status.progress.errors}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      </div>

      {/* Individual Tool Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Tool Controls</h3>
        <div className="space-y-3">
          {status.tools.map((tool) => (
            <div key={tool.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(tool.status)}
                <div>
                  <div className="font-medium text-gray-900">{tool.name}</div>
                  <div className="text-sm text-gray-500">
                    Status: {tool.status} 
                    {tool.lastRun && ` • Last run: ${new Date(tool.lastRun).toLocaleString()}`}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => refreshTool(tool.id, tool.name)}
                disabled={tool.status === 'update'}
                className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-colors ${
                  tool.status === 'update'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${tool.status === 'update' ? 'animate-spin' : ''}`} />
                {tool.status === 'update' ? 'Running...' : 'Refresh'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {status.recentSnapshots.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Intelligence Updates</h3>
          <div className="space-y-2">
            {status.recentSnapshots.slice(0, 10).map((snapshot) => (
              <div key={snapshot.id} className="flex items-center justify-between p-2 border-l-4 border-blue-200 bg-blue-50">
                <div>
                  <span className="font-medium">{snapshot.toolName}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {new Date(snapshot.date).toLocaleString()}
                  </span>
                  {snapshot.hasChanges && (
                    <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                      Changes Detected
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  snapshot.reviewStatus === 'pending_review' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {snapshot.reviewStatus.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}