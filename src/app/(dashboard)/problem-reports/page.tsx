'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/errorHandling';
import { AlertCircle, MessageSquare, File, Calendar, CheckCircle, XCircle, Send } from 'lucide-react';

interface ProblemReport {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
  responses: Array<{
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

export default function ProblemReportsPage() {
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseFiles, setResponseFiles] = useState<File[]>([]);
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated, statusFilter, currentPage, itemsPerPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await api.problemReports.getAll(params);
      const data = response.data.data || response.data;
      setReports(data.reports || data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Problem reports fetch error:', err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (reportId: string) => {
    try {
      const response = await api.problemReports.getById(reportId);
      const report = response.data.data || response.data;
      setSelectedReport(report);
      setShowDetails(true);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReport || !responseMessage.trim()) return;

    try {
      setSubmittingResponse(true);
      const formData = new FormData();
      formData.append('message', responseMessage);
      responseFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.problemReports.respond(selectedReport.id, formData);
      setResponseMessage('');
      setResponseFiles([]);
      await fetchReports();
      if (selectedReport) {
        await handleViewDetails(selectedReport.id);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'RESOLVED') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Resolved
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  const paginatedReports = reports;
  const totalPages = Math.ceil(total / itemsPerPage);

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading problem reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problem Reports</h1>
          <p className="text-gray-600 mt-1">View and manage your problem reports</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No problem reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(report.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{report.subject}</h3>
                    {getStatusBadge(report.status)}
                    {getPriorityBadge(report.priority)}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    {report.attachments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <File className="h-4 w-4" />
                        {report.attachments.length} file(s)
                      </span>
                    )}
                    {report.responses.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {report.responses.length} response(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
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
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">{selectedReport.subject}</h2>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedReport(null);
                  setResponseMessage('');
                  setResponseFiles([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Report Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {getStatusBadge(selectedReport.status)}
                  {getPriorityBadge(selectedReport.priority)}
                  <span className="text-sm text-gray-500">
                    Created: {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {/* Attachments */}
              {selectedReport.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Attachments</h3>
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
              <div>
                <h3 className="font-semibold mb-4">Responses</h3>
                <div className="space-y-4">
                  {selectedReport.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg ${
                        response.isAdminResponse ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">
                          {response.user.firstName} {response.user.lastName}
                          {response.isAdminResponse && (
                            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
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

              {/* Response Form */}
              {selectedReport.status === 'OPEN' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Add Response</h3>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-3"
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
                  <button
                    onClick={handleSubmitResponse}
                    disabled={!responseMessage.trim() || submittingResponse}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submittingResponse ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

