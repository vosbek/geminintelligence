'use client';

import React, { useState, useEffect } from 'react';
import { PlayIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ScraperStatus {
  python_available: boolean;
  python_version?: string;
  script_path?: string;
  error?: string;
}

export default function ScraperTrigger() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  // Check scraper status on component mount
  useEffect(() => {
    checkScraperStatus();
  }, []);

  const checkScraperStatus = async () => {
    try {
      const response = await fetch('/api/scraper/run');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check scraper status:', error);
      setStatus({ python_available: false, error: 'Failed to check status' });
    }
  };

  const runScraper = async () => {
    setIsRunning(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/scraper/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      setLastResult(result);

      if (result.success) {
        // Refresh the page or tools list after successful scraping
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to run scraper:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastResult({ 
        success: false, 
        error: 'Failed to run scraper',
        details: errorMessage 
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">AI Tool Scraper</h3>
          <p className="text-sm text-gray-600">
            Run the Python scraper to collect intelligence data for all tools
          </p>
        </div>
        
        <button
          onClick={runScraper}
          disabled={isRunning || !status?.python_available}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isRunning || !status?.python_available
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <PlayIcon className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Scraper...' : 'Run Scraper'}
        </button>
      </div>

      {/* Status Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Environment Status</h4>
        <div className="space-y-2">
          <div className="flex items-center">
            {status?.python_available ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className="text-sm">
              Python: {status?.python_available ? 'Available' : 'Not Available'}
              {status?.python_version && ` (${status.python_version})`}
            </span>
          </div>
          
          {status?.script_path && (
            <div className="text-xs text-gray-600">
              Script: {status.script_path}
            </div>
          )}
          
          {status?.error && (
            <div className="text-xs text-red-600">
              Error: {status.error}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {lastResult && (
        <div className={`rounded-lg p-4 ${
          lastResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {lastResult.success ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`text-sm font-medium ${
              lastResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastResult.success ? 'Scraping Completed Successfully' : 'Scraping Failed'}
            </span>
          </div>
          
          {lastResult.message && (
            <p className="mt-2 text-sm text-gray-700">{lastResult.message}</p>
          )}
          
          {lastResult.error && (
            <p className="mt-2 text-sm text-red-700">{lastResult.error}</p>
          )}
          
          {lastResult.details && (
            <details className="mt-2">
              <summary className="text-sm text-gray-600 cursor-pointer">Show Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {lastResult.details}
              </pre>
            </details>
          )}
          
          {lastResult.output && (
            <details className="mt-2">
              <summary className="text-sm text-gray-600 cursor-pointer">Show Output</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {lastResult.output}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How it works</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Add tools using the "Add New Tool" button above</li>
          <li>Click "Run Scraper" to collect intelligence data from multiple sources</li>
          <li>The Python script will scrape GitHub, Reddit, news, and other sources</li>
          <li>Results will be stored in the database and displayed in the dashboard</li>
          <li>Tools with status "update" or null will be processed</li>
        </ol>
      </div>
    </div>
  );
}