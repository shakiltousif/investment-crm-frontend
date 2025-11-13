'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

interface InvestmentApplication {
  id: string;
  referenceNumber: string;
  status: 'PENDING' | 'APPROVED' | 'ALLOCATED' | 'REJECTED' | 'CANCELLED';
  requestedAmount: number;
  requestedQuantity?: number;
  allocatedAmount?: number;
  allocatedQuantity?: number;
  notes?: string;
  submittedAt: string;
  allocatedAt?: string;
  marketplaceItem: {
    id: string;
    name: string;
    type: string;
    symbol?: string;
    currentPrice: number;
    currency: string;
    applicationDeadline?: string;
    ipoStatus?: string;
  };
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<InvestmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'ALLOCATED' | 'REJECTED'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await api.investmentProducts.getApplications(params);
      setApplications(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'APPROVED':
      case 'ALLOCATED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-secondary" />;
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'APPROVED':
      case 'ALLOCATED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Enrollments</h1>
          <p className="text-gray-600 mt-2">Track your investment account enrollments</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'PENDING', 'APPROVED', 'ALLOCATED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Items Per Page */}
      {applications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Items Per Page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, applications.length)} of {applications.length} enrollments
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrollments Found</h3>
              <p className="text-gray-600">
                {filter === 'all'
                ? "You haven't submitted any investment enrollments yet."
                : `No ${filter.toLowerCase()} enrollments found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {applications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(application.status)}
                    <div>
                      <CardTitle className="text-lg">{application.marketplaceItem.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Reference: <span className="font-mono">{application.referenceNumber}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(application.status)}>
                    {application.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Investment Type</p>
                    <p className="font-medium">{application.marketplaceItem.type.replace('_', ' ')}</p>
                  </div>
                  {application.marketplaceItem.symbol && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Symbol</p>
                      <p className="font-medium">{application.marketplaceItem.symbol}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Requested Amount</p>
                    <p className="font-medium">
                      {application.marketplaceItem.currency} {Number(application.requestedAmount).toLocaleString()}
                    </p>
                  </div>
                  {application.requestedQuantity && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Requested Quantity</p>
                      <p className="font-medium">{Number(application.requestedQuantity).toLocaleString()}</p>
                    </div>
                  )}
                  {application.allocatedAmount && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Allocated Amount</p>
                      <p className="font-medium text-green-600">
                        {application.marketplaceItem.currency} {Number(application.allocatedAmount).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {application.allocatedQuantity && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Allocated Quantity</p>
                      <p className="font-medium text-green-600">
                        {Number(application.allocatedQuantity).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submitted</p>
                    <p className="font-medium">
                      {new Date(application.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(application.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {application.allocatedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Allocated</p>
                      <p className="font-medium">
                        {new Date(application.allocatedAt).toLocaleDateString()} at{' '}
                        {new Date(application.allocatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>

                {application.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-gray-900">{application.notes}</p>
                  </div>
                )}

                {application.marketplaceItem.applicationDeadline && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Enrollment Deadline:{' '}
                      <span className="font-medium">
                        {new Date(application.marketplaceItem.applicationDeadline).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {applications.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(applications.length / itemsPerPage)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(applications.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(applications.length / itemsPerPage)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}

