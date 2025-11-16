'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Download, X, ChevronDown, Search } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';
import { extractErrorMessage } from '@/lib/errorHandling';
import { Label } from '@/components/ui/label';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Statement {
  id: string;
  userId: string;
  user: User;
  period: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  status: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
}

export default function AdminStatementsPage() {
  const confirmDialog = useConfirmDialog();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [previewStatement, setPreviewStatement] = useState<Statement | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    fetchStatements();
    fetchUsers();
  }, [currentPage, itemsPerPage, userIdFilter, periodFilter, statusFilter]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (userIdFilter) params.userId = userIdFilter;
      if (periodFilter) params.period = periodFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.admin.statements.getAll(params);
      const data = response.data.data;
      setStatements(data.statements || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch statements:', err);
      setError(extractErrorMessage(err, 'Failed to fetch statements'));
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

  const handleStatusChange = async (statementId: string, newStatus: string) => {
    try {
      setUpdatingStatus(statementId);
      setError('');

      await api.admin.statements.updateStatus(statementId, {
        status: newStatus,
      });

      // Update the statement in the local state immediately
      setStatements((prev) =>
        prev.map((stmt) => (stmt.id === statementId ? { ...stmt, status: newStatus } : stmt))
      );

      confirmDialog.confirm(
        'Success',
        'Statement status updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(extractErrorMessage(err, 'Failed to update status'));
      // Refresh to get the correct status
      fetchStatements();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDownload = async (stmt: Statement) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const downloadUrl = stmt.downloadUrl || `${apiUrl}/api/documents/statements/${stmt.id}/download`;

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
      a.download = stmt.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download statement. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage all client statements</h1>
        <p className="text-gray-600 mt-2">View and manage all client statements</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="userFilter">User</Label>
              <div className="relative">
                <Input
                  id="userFilter"
                  type="text"
                  placeholder="Search user..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  className="mt-1"
                />
                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setUserIdFilter('');
                        setUserSearchTerm('');
                        setShowUserDropdown(false);
                        setCurrentPage(1);
                      }}
                    >
                      All Users
                    </div>
                    {filteredUsersForSelect.map((user) => (
                      <div
                        key={user.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setUserIdFilter(user.id);
                          setUserSearchTerm(`${user.firstName} ${user.lastName} (${user.email})`);
                          setShowUserDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        {user.firstName} {user.lastName} ({user.email})
                      </div>
                    ))}
                  </div>
                )}
                {showUserDropdown && (
                  <div
                    className="fixed inset-0 z-5"
                    onClick={() => setShowUserDropdown(false)}
                  />
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="periodFilter">Period</Label>
              <Input
                id="periodFilter"
                type="text"
                placeholder="e.g., January 2024"
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none mt-1"
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

      {/* Statements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Statements</CardTitle>
          <CardDescription>
            {total > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, total)} of ${total} statements`
              : 'No statements found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading statements...</p>
            </div>
          ) : statements.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">File Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Upload Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statements.map((stmt) => (
                      <tr key={stmt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">
                              {stmt.user.firstName} {stmt.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{stmt.user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{stmt.period}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{stmt.fileName}</div>
                          {stmt.description && (
                            <div className="text-sm text-gray-500">{stmt.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatFileSize(stmt.fileSize)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(stmt.uploadedAt || stmt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={stmt.status || 'PENDING'}
                            onChange={(e) => handleStatusChange(stmt.id, e.target.value)}
                            disabled={updatingStatus === stmt.id}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-primary outline-none transition-all ${
                              updatingStatus === stmt.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                            } ${getStatusColor(stmt.status || 'PENDING')}`}
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
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewStatement(stmt)}
                              title="View statement"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(stmt)}
                              title="Download statement"
                            >
                              <Download className="h-4 w-4" />
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
            <div className="text-center py-8 text-gray-500">No statements found</div>
          )}
        </CardContent>
      </Card>

      {/* Statement Preview Modal */}
      {previewStatement && (
        <DocumentPreviewModal
          document={{
            id: previewStatement.id,
            fileName: previewStatement.fileName,
            fileUrl: previewStatement.fileUrl,
            downloadUrl: previewStatement.downloadUrl,
            mimeType: previewStatement.mimeType,
            fileSize: previewStatement.fileSize,
          }}
          isOpen={!!previewStatement}
          onClose={() => setPreviewStatement(null)}
          onDownload={async () => {
            await handleDownload(previewStatement);
          }}
        />
      )}
    </div>
  );
}

