// components/curation/ScreenshotsSection.tsx - Screenshot upload and management
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { ToolDetailData } from '@/types/database';
import { 
  PhotoIcon, 
  TrashIcon, 
  CloudArrowUpIcon 
} from '@heroicons/react/24/outline';

interface ScreenshotsSectionProps {
  data: ToolDetailData;
}

export default function ScreenshotsSection({ data }: ScreenshotsSectionProps) {
  const { tool, screenshots } = data;
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        setUploadProgress(`Uploading ${file.name}...`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('toolId', tool.id.toString());
        formData.append('description', ''); // Could add description input
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        // Refresh the page to show new screenshot
        window.location.reload();
        
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    setUploading(false);
    setUploadProgress('');
  }, [tool.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const deleteScreenshot = async (screenshotId: number) => {
    if (!confirm('Are you sure you want to delete this screenshot?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/screenshot/${screenshotId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete screenshot');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete screenshot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Screenshots</h2>
        <p className="text-gray-600 text-sm">
          Upload screenshots of the tool interface, features, or documentation
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {uploading ? (
          <div>
            <p className="text-gray-600">{uploadProgress}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
            </div>
          </div>
        ) : isDragActive ? (
          <p className="text-gray-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag 'n' drop images here, or click to select files
            </p>
            <p className="text-gray-400 text-sm">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Screenshots Grid */}
      {screenshots && screenshots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenshots.map((screenshot) => (
            <div key={screenshot.id} className="bg-white border rounded-lg overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={`/uploads/${screenshot.filename}`}
                  alt={screenshot.description || screenshot.original_name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {screenshot.original_name}
                    </h4>
                    {screenshot.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {screenshot.description}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-2">
                      Uploaded {new Date(screenshot.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => deleteScreenshot(screenshot.id)}
                    className="ml-2 p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete screenshot"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>No screenshots uploaded yet</p>
          <p className="text-sm mt-1">Upload images to showcase this tool</p>
        </div>
      )}
    </div>
  );
}