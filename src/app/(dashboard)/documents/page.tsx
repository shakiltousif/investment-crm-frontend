'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, X, Eye } from 'lucide-react';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

interface Document {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  isImportant: boolean;
  createdAt: string;
}

interface Statement {
  id: string;
  period: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'statements'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | Statement | null>(null);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    } else {
      fetchStatements();
    }
  }, [activeTab]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.documents.getAll();
      setDocuments(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await api.documents.getStatements();
      setStatements(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch statements:', err);
      setError(err.response?.data?.message || 'Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;

    if (!fileInput?.files?.[0]) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileInput.files[0]);
      uploadFormData.append('type', formData.get('type') as string);
      if (formData.get('description')) {
        uploadFormData.append('description', formData.get('description') as string);
      }

      await api.documents.upload(uploadFormData);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.documents.delete(id);
      fetchDocuments();
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Center</h1>
        <p className="text-gray-600 mt-2">Manage your documents and statements</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Documents
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statements'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Statements
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>My Documents</CardTitle>
                <CardDescription>Upload and manage your documents</CardDescription>
              </div>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{doc.fileName}</h3>
                          {doc.isImportant && (
                            <Badge className="bg-yellow-100 text-yellow-800">Important</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="capitalize">{doc.type.replace('_', ' ').toLowerCase()}</span>
                          {' • '}
                          {formatFileSize(doc.fileSize)}
                          {' • '}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                            const downloadUrl = doc.downloadUrl || `${apiUrl}/api/documents/${doc.id}/download`;
                            
                            // Get the auth token
                            const token = localStorage.getItem('accessToken');
                            
                            // Fetch the file with authentication
                            const response = await fetch(downloadUrl, {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            });
                            
                            if (!response.ok) {
                              throw new Error('Failed to download file');
                            }
                            
                            // Create blob and download
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (err) {
                            console.error('Download error:', err);
                            alert('Failed to download document. Please try again.');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {!doc.isImportant && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-secondary" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents uploaded yet</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowUploadModal(true)}
                >
                  Upload Your First Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statements Tab */}
      {activeTab === 'statements' && (
        <Card>
          <CardHeader>
            <CardTitle>Statements</CardTitle>
            <CardDescription>Download your account statements</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading statements...</p>
              </div>
            ) : statements.length > 0 ? (
              <div className="space-y-4">
                {statements.map((stmt) => (
                  <div
                    key={stmt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-medium">{stmt.fileName}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          Period: {stmt.period}
                          {' • '}
                          {formatFileSize(stmt.fileSize)}
                          {' • '}
                          {new Date(stmt.uploadedAt).toLocaleDateString()}
                        </div>
                        {stmt.description && (
                          <p className="text-sm text-gray-500 mt-1">{stmt.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDocument(stmt)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                            const downloadUrl = stmt.downloadUrl || `${apiUrl}/api/documents/statements/${stmt.id}/download`;
                          
                          // Get the auth token
                          const token = localStorage.getItem('accessToken');
                          
                          // Fetch the file with authentication
                          const response = await fetch(downloadUrl, {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to download file');
                          }
                          
                          // Create blob and download
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = stmt.fileName;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          console.error('Download error:', err);
                          alert('Failed to download statement. Please try again.');
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No statements available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleFileUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select type...</option>
                    <option value="KYC">KYC Document</option>
                    <option value="IDENTIFICATION">Identification</option>
                    <option value="PROOF_OF_ADDRESS">Proof of Address</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="TAX_DOCUMENT">Tax Document</option>
                    <option value="AGREEMENT">Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={{
            id: previewDocument.id,
            fileName: previewDocument.fileName,
            fileUrl: previewDocument.fileUrl,
            downloadUrl: previewDocument.downloadUrl,
            mimeType: previewDocument.mimeType,
            fileSize: previewDocument.fileSize,
          }}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={async () => {
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
              const downloadUrl = previewDocument.downloadUrl || 
                (activeTab === 'documents' 
                  ? `${apiUrl}/api/documents/${previewDocument.id}/download`
                  : `${apiUrl}/api/documents/statements/${previewDocument.id}/download`);
              
              const token = localStorage.getItem('accessToken');
              
              const response = await fetch(downloadUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (!response.ok) {
                throw new Error('Failed to download file');
              }
              
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = previewDocument.fileName;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (err) {
              console.error('Download error:', err);
              alert('Failed to download document. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
}

