// components/curation/TechnicalDetailsSection.tsx - Technical details with inline editing
'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolDetailData } from '@/types/database';
import EditableField from '@/components/curation/EditableField';
import PricingTierCard from './PricingTierCard';

interface TechnicalDetailsSectionProps {
  data: ToolDetailData;
}

export default function TechnicalDetailsSection({ data }: TechnicalDetailsSectionProps) {
  const { tool, snapshot, curated_data } = data;
  const techDetails = snapshot?.technical_details;
  
  // Get curated version if available
  const curatedTechDetails = curated_data.find(c => c.section_name === 'technical_details')?.curated_content;

  const [editMode, setEditMode] = useState(false);
  const [pricingJsonError, setPricingJsonError] = useState<string | null>(null);

  const handleSave = async (sectionData: any) => {
    try {
      const response = await fetch(`/api/tool/${tool.id}/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_name: 'technical_details',
          curated_content: sectionData,
        }),
      });
      if (!response.ok) throw new Error('Failed to save technical details');
      alert('Technical details saved!');
      setEditMode(false);
    } catch (error) {
      console.error(error);
      alert('Error saving technical details');
    }
  };

  const displayData = curatedTechDetails || techDetails;

  if (!displayData) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Technical Details</h2>
        <div className="text-gray-500 text-center py-8">
          No technical details available
        </div>
      </div>
    );
  }

  const renderArrayField = (label: string, field: keyof typeof displayData, placeholder: string = 'Enter items, one per line') => {
    const fieldData = displayData?.[field];
    const items = Array.isArray(fieldData) ? fieldData : [];
    
    return (
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-2">{label}</h4>
        {editMode ? (
          <EditableField
            type="array"
            value={items}
            onSave={(values) => handleSave({ ...displayData, [field]: values })}
            placeholder={placeholder}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.length > 0 ? (
              items.map((item: string, index: number) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{item}</span>
              ))
            ) : (
              <span className="text-sm text-gray-500">N/A</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Technical Details</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            editMode
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {editMode ? 'Cancel' : 'Edit Section'}
        </button>
      </div>

      {/* Feature List & Tech Stack */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderArrayField("Feature List", "feature_list")}
            {renderArrayField("Technology Stack", "technology_stack")}
        </div>
      </div>
      
      {/* Pricing Model */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-3">Pricing Model</h3>
        {editMode ? (
            <div>
                <EditableField
                    type="textarea"
                    value={JSON.stringify(displayData.pricing_model, null, 2)}
                    onSave={(value) => {
                        try {
                            const parsedJson = JSON.parse(value);
                            handleSave({ ...displayData, pricing_model: parsedJson });
                            setPricingJsonError(null);
                        } catch (e) {
                            setPricingJsonError("Invalid JSON format.");
                            alert("Error: Invalid JSON format for pricing model.");
                        }
                    }}
                />
                {pricingJsonError && <p className="text-red-500 text-sm mt-1">{pricingJsonError}</p>}
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(displayData.pricing_model) && displayData.pricing_model.map((tier: any, index: number) => (
              <PricingTierCard key={index} tier={tier} />
            ))}
          </div>
        )}
      </div>

      {/* Supported Technologies */}
      <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">Supported Technologies</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderArrayField("Languages", "supported_languages")}
            {renderArrayField("Frameworks & Libraries", "frameworks_and_libraries")}
            {renderArrayField("IDEs", "ides")}
          </div>
      </div>

      {/* AI Model & Code Analysis */}
      <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-4">AI & Code Intelligence</h3>
          <div className="space-y-4">
              <div>
                <span className="text-gray-600 block mb-1">Model Integration:</span>
                {editMode ? <EditableField type="textarea" value={displayData.model_integration_capabilities || ''} onSave={(val) => handleSave({...displayData, model_integration_capabilities: val})} /> : <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{displayData.model_integration_capabilities || 'N/A'}</p>}
              </div>
              <div>
                <span className="text-gray-600">Context Window:</span>
                {editMode ? <EditableField type="text" value={displayData.context_window_size?.toString() || ''} onSave={(val) => handleSave({...displayData, context_window_size: Number(val)})} /> : <span className="font-medium ml-2">{displayData.context_window_size?.toLocaleString() || 'N/A'} tokens</span>}
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Code Quality & Analysis:</span>
                {editMode ? <EditableField type="textarea" value={displayData.code_quality_and_analysis || ''} onSave={(val) => handleSave({...displayData, code_quality_and_analysis: val})} /> : <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{displayData.code_quality_and_analysis || 'N/A'}</p>}
              </div>
          </div>
      </div>

      {/* Security & Deployment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-4">
            {renderArrayField("Security & Privacy", "security_and_privacy_features")}
          </div>
          <div className="bg-white rounded-lg border p-4">
            {renderArrayField("Deployment Options", "deployment_options")}
          </div>
      </div>

       {/* API & Data */}
       <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-3">API Access & Data</h3>
        <div className="space-y-4">
            <div>
                <span className="text-gray-600 mr-2">API Access:</span>
                {editMode ? (
                    <button onClick={() => handleSave({...displayData, api_access: !displayData.api_access})} className={`px-3 py-1 text-sm rounded ${displayData.api_access ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        Toggle to: {displayData.api_access ? 'No' : 'Yes'}
                    </button>
                ) : (
                    <span className={`font-medium ${displayData.api_access ? 'text-green-600' : 'text-red-600'}`}>
                        {displayData.api_access ? 'Yes' : 'No'}
                    </span>
                )}
            </div>
            {renderArrayField("Data Sources", "data_sources")}
        </div>
       </div>

    </div>
  );
}