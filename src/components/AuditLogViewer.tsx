'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  timestamp: string;
  changes?: Record<string, any>;
}

interface AuditLogViewerProps {
  userId?: string;
}

export default function AuditLogViewer({ userId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    status: '',
    limit: 20,
    offset: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1,
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (userId) params.append('userId', userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/audit-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      setLogs(response.data.data.data);
      setPagination({
        total: response.data.data.pagination.total,
        pages: response.data.data.pagination.pages,
        currentPage: Math.floor(filters.offset / filters.limit) + 1,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset to first page
    }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/audit-logs/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          responseType: 'blob',
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to export logs', err);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'SUCCESS' ? 'text-green-600' : 'text-secondary';
  };

  const getStatusBg = (status: string) => {
    return status === 'SUCCESS' ? 'bg-green-50' : 'bg-secondary/10';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Action</label>
          <input
            type="text"
            placeholder="Filter by action"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Resource</label>
          <input
            type="text"
            placeholder="Filter by resource"
            value={filters.resource}
            onChange={(e) => handleFilterChange('resource', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Limit</label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No audit logs found</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Resource</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={`border-b ${getStatusBg(log.status)}`}>
                    <td className="px-4 py-3 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.resource}
                      {log.resourceId && <span className="text-gray-500"> ({log.resourceId})</span>}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Showing {logs.length} of {pagination.total} logs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    offset: Math.max(0, prev.offset - prev.limit),
                  }))
                }
                disabled={filters.offset === 0}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.currentPage} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    offset: prev.offset + prev.limit,
                  }))
                }
                disabled={pagination.currentPage >= pagination.pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

