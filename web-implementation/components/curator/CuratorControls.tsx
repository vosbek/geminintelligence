'use client';

import { useState } from 'react';
import { PlayIcon, Cog6ToothIcon, InformationCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CuratorConfig {
  minStars: number;
  daysBack: number;
  debug: boolean;
  lowerThresholds: boolean;
}

interface CuratorControlsProps {
  onRunComplete?: () => void;
}

export default function CuratorControls({ onRunComplete }: CuratorControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<CuratorConfig>({
    minStars: 10,
    daysBack: 7,
    debug: false,
    lowerThresholds: false
  });
  const [lastResult, setLastResult] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRunCurator = async () => {
    setIsRunning(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/curator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      setLastResult(result);
      
      if (result.success && onRunComplete) {
        onRunComplete();
      }
    } catch (error) {
      console.error('Error running curator:', error);
      setLastResult({
        success: false,
        error: 'Failed to run curator: ' + (error as Error).message
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Curator Agent</h2>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stars
            </label>
            <input
              type="number"
              value={config.minStars}
              onChange={(e) => setConfig({...config, minStars: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Back
            </label>
            <input
              type="number"
              value={config.daysBack}
              onChange={(e) => setConfig({...config, daysBack: parseInt(e.target.value) || 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="30"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="debug"
                checked={config.debug}
                onChange={(e) => setConfig({...config, debug: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isRunning}
              />
              <label htmlFor="debug" className="text-sm text-gray-700">
                Enable debug logging
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowerThresholds"
                checked={config.lowerThresholds}
                onChange={(e) => setConfig({...config, lowerThresholds: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isRunning}
              />
              <label htmlFor="lowerThresholds" className="text-sm text-gray-700">
                Use lower quality thresholds (for testing)
              </label>
            </div>
          </div>
        )}

        {/* Run Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleRunCurator}
            disabled={isRunning}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
              isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Running Curator...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Run Curator</span>
              </>
            )}
          </button>
          
          {isRunning && (
            <div className="text-sm text-gray-500 flex items-center space-x-1">
              <InformationCircleIcon className="h-4 w-4" />
              <span>This may take up to 5 minutes</span>
            </div>
          )}
        </div>

        {/* Results */}
        {lastResult && (
          <div className={`p-4 rounded-lg ${
            lastResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`font-medium ${
              lastResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastResult.success ? 'Success!' : 'Error'}
            </div>
            <div className={`text-sm mt-1 ${
              lastResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {lastResult.message || lastResult.error}
            </div>
            
            {lastResult.output && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  View Output
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {lastResult.output}
                </pre>
              </details>
            )}
            
            {lastResult.params && (
              <div className="mt-2 text-xs text-gray-600">
                Ran with: {lastResult.params.minStars} min stars, {lastResult.params.daysBack} days back
                {lastResult.params.debug && ', debug enabled'}
                {lastResult.params.lowerThresholds && ', lower thresholds'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 