'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/errorHandling';
import {
  AlertCircle,
  MessageSquare,
  File,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  X,
  Upload,
} from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';

interface ProblemReport {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  attachmentCount: number;
  responseCount: number;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
  responses?: Array<{
    id: string;
    message: string;
    isAdminResponse: boolean;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
    attachments: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
    }>;
  }>;
}

export default function AdminProblemReportsPage() {
  const confirmDialog = useConfirmDialog();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseFiles, setResponseFiles] = useState<File[]>([]);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: '',
    userId: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [currentPage, itemsPerPage, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.userId) params.userId = filters.userId;

      const response = await api.admin.problemReports.getAll(params);
      const data = response.data.data || response.data;
      setReports(data.reports || data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch problem reports:', err);
      setError(extractErrorMessage(err, 'Failed to fetch problem reports'));
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (reportId: string) => {
    try {
      const response = await api.admin.problemReports.getById(reportId);
      const report = response.data.data || response.data;
      setSelectedReport(report);
      setShowViewModal(true);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  const handleRespond = async () => {
    if (!selectedReport || !responseMessage.trim()) return;

    try {
      setSubmittingResponse(true);
      const formData = new FormData();
      formData.append('message', responseMessage);
      responseFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.admin.problemReports.respond(selectedReport.id, formData);
      setResponseMessage('');
      setResponseFiles([]);
      setShowRespondModal(false);
      await fetchReports();
      if (selectedReport) {
        await handleView(selectedReport.id);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleResolve = async (reportId: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Resolve Problem Report',
      message: 'Are you sure you want to mark this problem report as resolved?',
    });

    if (!confirmed) return;

    try {
      await api.admin.problemReports.updateStatus(reportId, { status: 'RESOLVED' });
      await fetchReports();
      if (selectedReport && selectedReport.id === reportId) {
        await handleView(reportId);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  const handleReopen = async (reportId: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Reopen Problem Report',
      message: 'Are you sure you want to reopen this problem report?',
    });

    if (!confirmed) return;

    try {
      await api.admin.problemReports.updateStatus(reportId, { status: 'OPEN' });
      await fetchReports();
      if (selectedReport && selectedReport.id === reportId) {
        await handleView(reportId);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'RESOLVED') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          <CheckCircle className="h-3 w-3" />
          Resolved
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
        <XCircle className="h-3 w-3" />
        Open
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${colors[priority] || colors.MEDIUM}`}
      >
        {priority}
      </span>
    );
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problem Reports</h1>
          <p className="mt-1 text-gray-600">Manage and respond to user problem reports</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value });
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => {
            setFilters({ ...filters, category: e.target.value });
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          <option value="TECHNICAL">Technical</option>
          <option value="ACCOUNT">Account</option>
          <option value="TRANSACTION">Transaction</option>
          <option value="INVESTMENT">Investment</option>
          <option value="DOCUMENT">Document</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => {
            setFilters({ ...filters, priority: e.target.value });
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Table */}
      {loading && reports.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-gray-600">Loading problem reports...</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600">No problem reports found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {report.user.firstName} {report.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{report.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{report.subject}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-gray-900">{report.category}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getPriorityBadge(report.priority)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(report.status)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(report.id)}
                        className="text-primary hover:text-primary/80"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {report.status === 'OPEN' && (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.admin.problemReports.getById(report.id);
                                const reportData = response.data.data || response.data;
                                setSelectedReport(reportData);
                                setShowRespondModal(true);
                              } catch (err: any) {
                                setError(extractErrorMessage(err));
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Respond"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as Resolved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {report.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleReopen(report.id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Reopen"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-xl font-semibold">{selectedReport.subject}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedReport(null);
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-4">
              {/* Report Info */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  {getStatusBadge(selectedReport.status)}
                  {getPriorityBadge(selectedReport.priority)}
                  <span className="text-sm text-gray-500">
                    Created: {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600">User: </span>
                  <span className="font-medium">
                    {selectedReport.user.firstName} {selectedReport.user.lastName} (
                    {selectedReport.user.email})
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-gray-700">{selectedReport.description}</p>
              </div>

              {/* Attachments */}
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Attachments</h3>
                  <div className="space-y-2">
                    {selectedReport.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${attachment.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <File className="h-4 w-4" />
                        {attachment.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses */}
              {selectedReport.responses && selectedReport.responses.length > 0 && (
                <div>
                  <h3 className="mb-4 font-semibold">Responses</h3>
                  <div className="space-y-4">
                    {selectedReport.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`rounded-lg p-4 ${
                          response.isAdminResponse
                            ? 'border-l-4 border-blue-500 bg-blue-50'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <span className="font-medium">
                            {response.user.firstName} {response.user.lastName}
                            {response.isAdminResponse && (
                              <span className="ml-2 rounded bg-blue-200 px-2 py-0.5 text-xs text-blue-800">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-700">{response.message}</p>
                        {response.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {response.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${attachment.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <File className="h-3 w-3" />
                                {attachment.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showRespondModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Respond to Report</h2>
              <button
                onClick={() => {
                  setShowRespondModal(false);
                  setResponseMessage('');
                  setResponseFiles([]);
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response..."
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setResponseFiles(Array.from(e.target.files));
                  }
                }}
                className="mb-3"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRespondModal(false);
                    setResponseMessage('');
                    setResponseFiles([]);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  disabled={!responseMessage.trim() || submittingResponse}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submittingResponse ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
