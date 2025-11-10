'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentPreviewModalProps {
  document: {
    id: string;
    fileName: string;
    fileUrl: string;
    downloadUrl?: string;
    mimeType: string;
    fileSize: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export default function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'unsupported'>('unsupported');

  useEffect(() => {
    if (isOpen && document) {
      loadPreview();
    } else {
      // Cleanup
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  }, [isOpen, document]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');

      // Determine preview type
      if (document.mimeType.startsWith('image/')) {
        setPreviewType('image');
      } else if (document.mimeType === 'application/pdf') {
        setPreviewType('pdf');
      } else {
        setPreviewType('unsupported');
        setLoading(false);
        return;
      }

      // Get the download URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const downloadUrl = document.downloadUrl || `${apiUrl}/api/documents/${document.id}/download`;
      
      // Get auth token
      const token = localStorage.getItem('accessToken');
      
      // Fetch the file
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load document');
      }

      // Create blob URL for preview
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      console.error('Preview load error:', err);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = () => {
    if (document.mimeType.startsWith('image/')) {
      return <ImageIcon className="h-12 w-12 text-blue-500" />;
    } else if (document.mimeType === 'application/pdf') {
      return <FileText className="h-12 w-12 text-red-500" />;
    }
    return <File className="h-12 w-12 text-gray-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{document.fileName}</h2>
              <p className="text-sm text-gray-600">
                {formatFileSize(document.fileSize)} • {document.mimeType}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onDownload && (
              <Button
                onClick={onDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 mb-4">{getFileIcon()}</div>
                <p className="text-secondary mb-2">{error}</p>
                <p className="text-sm text-gray-600">This file type cannot be previewed</p>
                {onDownload && (
                  <Button
                    onClick={onDownload}
                    className="mt-4 bg-primary hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Instead
                  </Button>
                )}
              </div>
            </div>
          ) : previewType === 'unsupported' ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                {getFileIcon()}
                <p className="text-gray-600 mt-4 mb-2">Preview not available for this file type</p>
                <p className="text-sm text-gray-500">{document.mimeType}</p>
                {onDownload && (
                  <Button
                    onClick={onDownload}
                    className="mt-4 bg-primary hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                )}
              </div>
            </div>
          ) : previewType === 'image' && previewUrl ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={previewUrl}
                alt={document.fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : previewType === 'pdf' && previewUrl ? (
            <div className="w-full h-full min-h-[500px]">
              <iframe
                src={previewUrl}
                className="w-full h-full min-h-[500px] border rounded-lg"
                title={document.fileName}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

