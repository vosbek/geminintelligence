// components/curation/EnterprisePositionSection.tsx - Enterprise positioning analysis
'use client';

import { useState } from 'react';
import { ToolDetailData } from '@/types/database';
import EditableField from '@/components/curation/EditableField';

interface EnterprisePositionSectionProps {
  data: ToolDetailData;
}

export default function EnterprisePositionSection({ data }: EnterprisePositionSectionProps) {
  const { tool, enterprise_position } = data;
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    market_position: enterprise_position?.market_position || '',
    competitive_advantages: enterprise_position?.competitive_advantages || '',
    target_enterprises: enterprise_position?.target_enterprises || '',
    implementation_complexity: enterprise_position?.implementation_complexity || '',
    strategic_notes: enterprise_position?.strategic_notes || '',
  });

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tool/${tool.id}/enterprise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditMode(false);
        window.location.reload();
      } else {
        alert('Failed to save enterprise position');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save enterprise position');
    }
  };

  const sections = [
    {
      key: 'market_position',
      label: 'Market Position',
      placeholder: 'Describe where this tool fits in the enterprise AI landscape...',
      description: 'Overall positioning relative to competitors and market segments'
    },
    {
      key: 'competitive_advantages',
      label: 'Competitive Advantages',
      placeholder: 'Key differentiators that give this tool an edge in enterprise environments...',
      description: 'Unique features or capabilities that set it apart'
    },
    {
      key: 'target_enterprises',
      label: 'Target Enterprises',
      placeholder: 'Types of enterprises that would benefit most from this tool...',
      description: 'Company size, industry, use cases, and ideal customer profiles'
    },
    {
      key: 'implementation_complexity',
      label: 'Implementation Complexity',
      placeholder: 'Assessment of how difficult it is to implement and adopt...',
      description: 'Technical requirements, training needs, integration challenges'
    },
    {
      key: 'strategic_notes',
      label: 'Strategic Notes',
      placeholder: 'Additional strategic insights, partnerships, future outlook...',
      description: 'High-level strategic considerations for enterprise decision-makers'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Enterprise Position</h2>
          <p className="text-gray-600 text-sm mt-1">
            Strategic analysis for enterprise adoption and positioning
          </p>
        </div>
        <button
          onClick={editMode ? handleSave : () => setEditMode(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            editMode
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {editMode ? 'Save All Changes' : 'Edit Position'}
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.key} className="bg-gray-50 rounded-lg p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {section.label}
              </label>
              <p className="text-xs text-gray-500">
                {section.description}
              </p>
            </div>

            {editMode ? (
              <textarea
                value={formData[section.key as keyof typeof formData]}
                onChange={(e) => setFormData({
                  ...formData,
                  [section.key]: e.target.value
                })}
                placeholder={section.placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="bg-white rounded border p-3 min-h-[100px]">
                {formData[section.key as keyof typeof formData] ? (
                  <div className="whitespace-pre-wrap text-gray-900">
                    {formData[section.key as keyof typeof formData]}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No {section.label.toLowerCase()} analysis provided
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Metadata */}
      {enterprise_position && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Last updated: {new Date(enterprise_position.updated_at).toLocaleString()}</span>
              <span>Created: {new Date(enterprise_position.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines */}
      {!enterprise_position && !editMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Enterprise Analysis Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Consider enterprise-specific features (SSO, admin controls, compliance)</li>
            <li>• Evaluate total cost of ownership and ROI potential</li>
            <li>• Assess integration complexity with existing enterprise systems</li>
            <li>• Identify key decision-makers and stakeholders</li>
            <li>• Consider scalability and enterprise-grade support</li>
          </ul>
        </div>
      )}
    </div>
  );
}