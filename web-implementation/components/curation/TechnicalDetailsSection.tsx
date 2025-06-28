// components/curation/TechnicalDetailsSection.tsx - Technical details with inline editing
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolDetailData } from '@/types/database';
import EditableField from '@/components/curation/EditableField';

interface TechnicalDetailsSectionProps {
  data: ToolDetailData;
}

export default function TechnicalDetailsSection({ data }: TechnicalDetailsSectionProps) {
  const { snapshot, curated_data } = data;
  const technicalDetails = snapshot?.technical_details;
  
  // Get curated version if available
  const curatedTechnical = curated_data.find(c => c.section_name === 'technical_details')?.curated_content;

  const [editingField, setEditingField] = useState<string | null>(null);

  if (!technicalDetails && !curatedTechnical) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No technical details available</p>
        <p className="text-sm mt-2">Run the intelligence collection pipeline to generate data</p>
      </div>
    );
  }

  const displayData = curatedTechnical || technicalDetails;

  const renderFeatureList = () => {
    const features = displayData?.feature_list || [];
    
    if (editingField === 'feature_list') {
      return (
        <EditableField
          value={features}
          type="array"
          placeholder="Enter features, one per line"
          onSave={(value) => {
            // Save to database
            console.log('Saving features:', value);
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
      );
    }

    return (
      <div className="space-y-2">
        {features.length > 0 ? (
          <ul className="space-y-1">
            {features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No features listed</p>
        )}
        
        <button
          onClick={() => setEditingField('feature_list')}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2"
        >
          Edit Features
        </button>
      </div>
    );
  };

  const renderTechnologyStack = () => {
    const stack = displayData?.technology_stack || [];
    
    if (editingField === 'technology_stack') {
      return (
        <EditableField
          value={stack}
          type="array"
          placeholder="Enter technologies, one per line"
          onSave={(value) => {
            console.log('Saving tech stack:', value);
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
      );
    }

    return (
      <div className="space-y-2">
        {stack.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stack.map((tech: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No technology stack information</p>
        )}
        
        <button
          onClick={() => setEditingField('technology_stack')}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2"
        >
          Edit Technology Stack
        </button>
      </div>
    );
  };

  const renderPricingModel = () => {
    const pricing = displayData?.pricing_model;
    
    if (!pricing || Object.keys(pricing).length === 0) {
      return <p className="text-gray-500 italic">No pricing information available</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(pricing).map(([tier, details]) => (
          <div key={tier} className="bg-gray-50 rounded p-3">
            <div className="font-medium text-gray-900 capitalize">{tier}</div>
            <div className="text-gray-700 text-sm mt-1">{details as string}</div>
          </div>
        ))}
      </div>
    );
  };

  const sections = [
    {
      title: 'Features',
      content: renderFeatureList(),
    },
    {
      title: 'Technology Stack',
      content: renderTechnologyStack(),
    },
    {
      title: 'Pricing Model',
      content: renderPricingModel(),
    },
    {
      title: 'Comparable Tools',
      content: (
        <div className="flex flex-wrap gap-2">
          {displayData?.comparable_tools?.map((tool: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              {tool}
            </span>
          )) || <span className="text-gray-500 italic">No comparable tools listed</span>}
        </div>
      ),
    },
    {
      title: 'Unique Differentiators',
      content: (
        <ul className="space-y-1">
          {displayData?.unique_differentiators?.map((diff: string, index: number) => (
            <li key={index} className="flex items-start">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700">{diff}</span>
            </li>
          )) || <span className="text-gray-500 italic">No differentiators listed</span>}
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Technical Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
            {section.content}
          </div>
        ))}
      </div>

      {/* Pros and Cons */}
      {displayData?.pros_and_cons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Pros</h3>
            <ul className="space-y-2">
              {displayData.pros_and_cons.pros?.map((pro: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">{pro}</span>
                </li>
              )) || <span className="text-gray-500 italic">No pros listed</span>}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cons</h3>
            <ul className="space-y-2">
              {displayData.pros_and_cons.cons?.map((con: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">{con}</span>
                </li>
              )) || <span className="text-gray-500 italic">No cons listed</span>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}