'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';

interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  transactionDate: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  bankAccount?: {
    id: string;
    accountNumber: string;
    bankName: string;
    balance: number;
  };
}

export default function AdminWithdrawalsPage() {
  const confirmDialog = useConfirmDialog();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, itemsPerPage]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.admin.getPendingWithdrawals({
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });
      setWithdrawals(response.data.data.withdrawals);
      setTotal(response.data.data.total || response.data.data.withdrawals.length);
    } catch (err: any) {
      console.error('Failed to fetch withdrawals:', err);
      setError(err.response?.data?.message || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await api.admin.approveTransaction(id);
      await fetchWithdrawals();
      confirmDialog.confirm(
        'Success',
        'Withdrawal approved successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to approve withdrawal:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to approve withdrawal',
        () => {},
        'destructive',
        false,
        false,
        'OK'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || !rejectingId) return;

    try {
      setProcessingId(rejectingId);
      await api.admin.rejectTransaction(rejectingId, rejectReason);
      await fetchWithdrawals();
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
      confirmDialog.confirm(
        'Success',
        'Withdrawal rejected successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to reject withdrawal:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to reject withdrawal',
        () => {},
        'destructive',
        false,
        false,
        'OK'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-secondary/10 text-secondary">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Withdrawals</h1>
        <p className="text-gray-600 mt-2">Review and approve withdrawal requests</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests ({total})</CardTitle>
          <CardDescription>All pending withdrawal requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Items Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          {withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          £{withdrawal.amount.toLocaleString()}
                        </h3>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">User:</span>{' '}
                          {withdrawal.user.firstName} {withdrawal.user.lastName} ({withdrawal.user.email})
                        </p>
                        {withdrawal.bankAccount && (
                          <>
                            <p>
                              <span className="font-medium">Account:</span>{' '}
                              {withdrawal.bankAccount.bankName} - ****
                              {withdrawal.bankAccount.accountNumber.slice(-4)}
                            </p>
                            <p>
                              <span className="font-medium">Available Balance:</span>{' '}
                              £{withdrawal.bankAccount.balance.toLocaleString()}
                            </p>
                          </>
                        )}
                        {withdrawal.description && (
                          <p>
                            <span className="font-medium">Description:</span> {withdrawal.description}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Requested:</span>{' '}
                          {new Date(withdrawal.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {withdrawal.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal.id)}
                          disabled={processingId === withdrawal.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectClick(withdrawal.id)}
                              disabled={processingId === withdrawal.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending withdrawals</p>
            </div>
          )}

          {/* Pagination */}
          {withdrawals.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, total)} of {total} withdrawals
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(total / itemsPerPage) || 1}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(Math.ceil(total / itemsPerPage) || 1, prev + 1))
                  }
                  disabled={currentPage >= Math.ceil(total / itemsPerPage) || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Reject Withdrawal</h2>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this withdrawal:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processingId === rejectingId}
                  variant="destructive"
                  className="flex-1"
                >
                  {processingId === rejectingId ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setRejectingId(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={processingId === rejectingId}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.dialog}
    </div>
  );
}

