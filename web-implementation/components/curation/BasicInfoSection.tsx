// components/curation/BasicInfoSection.tsx - Basic info curation
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolDetailData } from '@/types/database';
import EditableField from '@/components/curation/EditableField';

interface BasicInfoSectionProps {
  data: ToolDetailData;
}

export default function BasicInfoSection({ data }: BasicInfoSectionProps) {
  const { tool, snapshot, curated_data } = data;
  const basicInfo = snapshot?.basic_info;
  
  // Get curated version if available
  const curatedBasicInfo = curated_data.find(c => c.section_name === 'basic_info')?.curated_content;

  const [editMode, setEditMode] = useState(false);

  if (!basicInfo && !curatedBasicInfo) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No basic information available</p>
        <p className="text-sm mt-2">Run the intelligence collection pipeline to generate data</p>
      </div>
    );
  }

  const displayData = curatedBasicInfo || basicInfo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            editMode
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {editMode ? 'Save Changes' : 'Edit Section'}
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          {editMode ? (
            <EditableField
              value={displayData?.description || ''}
              type="textarea"
              placeholder="Enter tool description..."
              onSave={(value) => {
                // Save to database - will implement API call
                console.log('Saving description:', value);
              }}
            />
          ) : (
            <div className="bg-gray-50 rounded-md p-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm">
                {displayData?.description || 'No description available'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Category Classification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Classification
          </label>
          {editMode ? (
            <EditableField
              value={displayData?.category_classification || ''}
              type="text"
              placeholder="e.g., AI_IDE, CODE_COMPLETION, CHAT_ASSISTANT"
              onSave={(value) => {
                console.log('Saving category:', value);
              }}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {displayData?.category_classification?.split(',').map((category: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {category.trim()}
                </span>
              )) || (
                <span className="text-gray-500 italic">No categories defined</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source Info */}
      <div className="border-t pt-4">
        <div className="text-sm text-gray-500">
          <div className="flex justify-between">
            <span>
              Source: {curatedBasicInfo ? 'Manually Curated' : 'AI Generated'}
            </span>
            {snapshot && (
              <span>
                Generated: {new Date(snapshot.snapshot_date).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}