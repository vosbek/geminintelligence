// components/curation/EditableField.tsx - Reusable editable field component
'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditableFieldProps {
  value: string | string[];
  type: 'text' | 'textarea' | 'array';
  placeholder?: string;
  onSave: (value: any) => void;
  onCancel?: () => void;
}

export default function EditableField({ 
  value, 
  type, 
  placeholder, 
  onSave, 
  onCancel 
}: EditableFieldProps) {
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const renderArrayField = () => {
    const arrayValue = Array.isArray(editValue) ? editValue : [];
    const displayValue = arrayValue.join('\n');
    
    return (
      <div className="space-y-2">
        <textarea
          value={displayValue}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(line => line.trim());
            setEditValue(lines);
          }}
          placeholder={placeholder || 'Enter items, one per line'}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500">Enter one item per line</p>
      </div>
    );
  };

  const renderTextField = () => (
    <input
      type="text"
      value={editValue as string}
      onChange={(e) => setEditValue(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );

  const renderTextareaField = () => (
    <textarea
      value={editValue as string}
      onChange={(e) => setEditValue(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );

  return (
    <div className="space-y-2">
      {type === 'array' && renderArrayField()}
      {type === 'text' && renderTextField()}
      {type === 'textarea' && renderTextareaField()}
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <CheckIcon className="h-4 w-4 mr-1" />
          Save
        </button>
      </div>
    </div>
  );
}