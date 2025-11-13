'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Upload, Edit, Trash2, Search, Eye, Download, X, ChevronDown } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';
import { extractErrorMessage } from '@/lib/errorHandling';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Document {
  id: string;
  userId: string;
  user: User;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  status: string;
  uploadedBy: string;
  uploadedByUser: User | null;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
}

export default function AdminDocumentsPage() {
  const confirmDialog = useConfirmDialog();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isImportantFilter, setIsImportantFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    userId: '',
    type: 'KYC',
    description: '',
    isImportant: false,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editFormData, setEditFormData] = useState({
    type: 'KYC',
    description: '',
    isImportant: false,
    status: 'PENDING',
  });
  const [updating, setUpdating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
  }, [currentPage, itemsPerPage, userIdFilter, typeFilter, isImportantFilter, statusFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (userIdFilter) params.userId = userIdFilter;
      if (typeFilter) params.type = typeFilter;
      if (isImportantFilter !== '') {
        params.isImportant = isImportantFilter === 'true';
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.admin.documents.getAll(params);
      const data = response.data.data;
      setDocuments(data.documents || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(extractErrorMessage(err, 'Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.admin.getUsers({ limit: 1000 });
      setUsers(response.data.data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };

  const filteredUsersForSelect = useMemo(() => {
    if (!userSearchTerm) return users;
    const searchLower = userSearchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower)
    );
  }, [users, userSearchTerm]);

  const selectedUserForUpload = useMemo(() => {
    return users.find((u) => u.id === uploadFormData.userId);
  }, [users, uploadFormData.userId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadFormData.userId) {
      setError('Please select a user and file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('userId', uploadFormData.userId);
      formData.append('type', uploadFormData.type);
      if (uploadFormData.description) {
        formData.append('description', uploadFormData.description);
      }
      if (uploadFormData.isImportant) {
        formData.append('isImportant', 'true');
      }

      await api.admin.documents.upload(formData);
      setShowUploadModal(false);
      setUploadFormData({ userId: '', type: 'KYC', description: '', isImportant: false });
      setUploadFile(null);
      setUserSearchTerm('');
      fetchDocuments();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setError(extractErrorMessage(err, 'Failed to upload document'));
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setEditFormData({
      type: document.type,
      description: document.description || '',
      isImportant: document.isImportant,
      status: document.status || 'PENDING',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;

    try {
      setUpdating(true);
      setError('');

      await api.admin.documents.update(editingDocument.id, {
        type: editFormData.type,
        description: editFormData.description || null,
        isImportant: editFormData.isImportant,
        status: editFormData.status,
      });

      setShowEditModal(false);
      setEditingDocument(null);
      fetchDocuments();
    } catch (err: any) {
      console.error('Failed to update document:', err);
      setError(extractErrorMessage(err, 'Failed to update document'));
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (documentId: string, newStatus: string) => {
    try {
      setUpdatingStatus(documentId);
      setError('');

      await api.admin.documents.update(documentId, {
        status: newStatus,
      });

      // Update the document in the local state immediately
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, status: newStatus } : doc))
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(extractErrorMessage(err, 'Failed to update status'));
      // Refresh to get the correct status
      fetchDocuments();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = (document: Document) => {
    confirmDialog.confirm(
      'Delete Document',
      `Are you sure you want to delete "${document.fileName}"? This action cannot be undone.`,
      async () => {
        try {
          await api.admin.documents.delete(document.id);
          fetchDocuments();
        } catch (err: any) {
          console.error('Failed to delete document:', err);
          setError(extractErrorMessage(err, 'Failed to delete document'));
        }
      },
      'destructive',
      false,
      true,
      'Delete'
    );
  };

  const handleDownload = async (doc: Document) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const downloadUrl = doc.downloadUrl || `${apiUrl}/api/documents/${doc.id}/download`;

      const token = localStorage.getItem('accessToken');

      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

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
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-2">Manage all client documents</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="userFilter">User</Label>
              <select
                id="userFilter"
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="typeFilter">Document Type</Label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Types</option>
                <option value="KYC">KYC</option>
                <option value="IDENTIFICATION">Identification</option>
                <option value="PROOF_OF_ADDRESS">Proof of Address</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="TAX_DOCUMENT">Tax Document</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="importantFilter">Important</Label>
              <select
                id="importantFilter"
                value={isImportantFilter}
                onChange={(e) => {
                  setIsImportantFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All</option>
                <option value="true">Important Only</option>
                <option value="false">Not Important</option>
              </select>
            </div>
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div>
              <Label htmlFor="itemsPerPage">Items Per Page</Label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {total > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, total)} of ${total} documents`
              : 'No documents found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">File Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Upload Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Uploaded By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Important</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {doc.user.firstName} {doc.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{doc.user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{getTypeLabel(doc.type)}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{doc.fileName}</div>
                          {doc.description && (
                            <div className="text-sm text-gray-500">{doc.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatFileSize(doc.fileSize)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {doc.uploadedByUser ? (
                            <div>
                              <div className="text-sm">
                                {doc.uploadedByUser.firstName} {doc.uploadedByUser.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{doc.uploadedByUser.email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Unknown</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={doc.status || 'PENDING'}
                            onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                            disabled={updatingStatus === doc.id}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-primary outline-none transition-all ${
                              updatingStatus === doc.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                            } ${getStatusColor(doc.status || 'PENDING')}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{ appearance: 'none', backgroundImage: 'none' }}
                          >
                            <option value="PENDING" className="bg-yellow-100 text-yellow-800">PENDING</option>
                            <option value="VERIFIED" className="bg-green-100 text-green-800">VERIFIED</option>
                            <option value="REJECTED" className="bg-red-100 text-red-800">REJECTED</option>
                            <option value="EXPIRED" className="bg-orange-100 text-orange-800">EXPIRED</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {doc.isImportant && (
                            <Badge className="bg-yellow-100 text-yellow-800">Important</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewDocument(doc)}
                              title="View document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              title="Download document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(doc)}
                              title="Edit document"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(doc)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(total / itemsPerPage)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(total / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(total / itemsPerPage) || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No documents found</div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="uploadUserId">
                User <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <div
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary outline-none flex items-center cursor-pointer bg-white"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {selectedUserForUpload ? (
                    <span className="flex-1 text-gray-900">
                      {selectedUserForUpload.firstName} {selectedUserForUpload.lastName} ({selectedUserForUpload.email})
                    </span>
                  ) : (
                    <span className="flex-1 text-gray-400">Select a user</span>
                  )}
                  <div className="flex items-center gap-2">
                    {selectedUserForUpload && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFormData({ ...uploadFormData, userId: '' });
                          setUserSearchTerm('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setUploadFormData({ ...uploadFormData, userId: '' });
                            setUserSearchTerm('');
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {showUserDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => {
                            setUserSearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {filteredUsersForSelect.length > 0 ? (
                        filteredUsersForSelect.map((user) => (
                          <div
                            key={user.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadFormData({ ...uploadFormData, userId: user.id });
                              setShowUserDropdown(false);
                              setUserSearchTerm('');
                            }}
                          >
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">No users found</div>
                      )}
                    </div>
                  </div>
                )}
                {showUserDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setUserSearchTerm('');
                    }}
                  />
                )}
                <input
                  type="hidden"
                  id="uploadUserId"
                  value={uploadFormData.userId}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="uploadType">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="uploadType"
                value={uploadFormData.type}
                onChange={(e) => setUploadFormData({ ...uploadFormData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
                required
              >
                <option value="KYC">KYC</option>
                <option value="IDENTIFICATION">Identification</option>
                <option value="PROOF_OF_ADDRESS">Proof of Address</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="TAX_DOCUMENT">Tax Document</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="uploadFile">
                File <span className="text-red-500">*</span>
              </Label>
              <Input
                id="uploadFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="uploadDescription">Description</Label>
              <textarea
                id="uploadDescription"
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="uploadImportant"
                checked={uploadFormData.isImportant}
                onChange={(e) => setUploadFormData({ ...uploadFormData, isImportant: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="uploadImportant" className="ml-2">
                Mark as important
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="editType">Document Type</Label>
              <select
                id="editType"
                value={editFormData.type}
                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
              >
                <option value="KYC">KYC</option>
                <option value="IDENTIFICATION">Identification</option>
                <option value="PROOF_OF_ADDRESS">Proof of Address</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="TAX_DOCUMENT">Tax Document</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <textarea
                id="editDescription"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <select
                id="editStatus"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
              >
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="editImportant"
                checked={editFormData.isImportant}
                onChange={(e) => setEditFormData({ ...editFormData, isImportant: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="editImportant" className="ml-2">
                Mark as important
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
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
            await handleDownload(previewDocument);
          }}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.dialog}
    </div>
  );
}

