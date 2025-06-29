'use client';
import { ToolDetailData } from '@/types/database';
import { useState } from 'react';

export default function RawDataSection({ data }: { data: ToolDetailData }) {
  const rawData = data.snapshot?.raw_data;
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  if (!rawData) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Raw Data</h2>
        <div className="text-gray-500 text-center py-8">
          No raw data available
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderDataSection = (key: string, value: any) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    const isExpanded = expandedSections.includes(key);
    const isArray = Array.isArray(value);
    const isObject = typeof value === 'object' && !isArray;

    return (
      <div key={key} className="bg-white rounded-lg border">
        <button
          onClick={() => toggleSection(key)}
          className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50"
        >
          <h3 className="font-medium text-gray-900 capitalize">
            {key.replace(/_/g, ' ')}
          </h3>
          <div className="flex items-center space-x-2">
            {isArray && (
              <span className="text-sm text-gray-500">({value.length} items)</span>
            )}
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="border-t p-4">
            {isArray ? (
              <div className="space-y-2">
                {value.slice(0, 10).map((item: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                    {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                  </div>
                ))}
                {value.length > 10 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    And {value.length - 10} more items...
                  </div>
                )}
              </div>
            ) : isObject ? (
              <div className="space-y-2">
                {Object.entries(value).map(([subKey, subValue]) => (
                  <div key={subKey} className="bg-gray-50 rounded p-2">
                    <div className="font-medium text-sm text-gray-700 capitalize">
                      {subKey.replace(/_/g, ' ')}:
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof subValue === 'string' 
                        ? subValue 
                        : JSON.stringify(subValue, null, 2)
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Raw Intelligence Data</h2>
        <button
          onClick={() => setExpandedSections(
            expandedSections.length === Object.keys(rawData).length 
              ? [] 
              : Object.keys(rawData)
          )}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {expandedSections.length === Object.keys(rawData).length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      
      <div className="space-y-4">
        {Object.entries(rawData).map(([key, value]) => renderDataSection(key, value))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Raw Data Overview</h3>
        <div className="text-sm text-blue-800">
          This section contains the unprocessed intelligence data collected from various sources.
          Data includes information from GitHub, Reddit, news articles, developer discussions, and more.
        </div>
      </div>
    </div>
  );
}