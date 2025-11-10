'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';

interface Deposit {
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

export default function AdminDepositsPage() {
  const confirmDialog = useConfirmDialog();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.admin.getPendingDeposits({ limit: 100 });
      setDeposits(response.data.data.deposits);
    } catch (err: any) {
      console.error('Failed to fetch deposits:', err);
      setError(err.response?.data?.message || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await api.admin.approveTransaction(id);
      await fetchDeposits();
      confirmDialog.confirm(
        'Success',
        'Deposit approved successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to approve deposit:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to approve deposit',
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
      await fetchDeposits();
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
      confirmDialog.confirm(
        'Success',
        'Deposit rejected successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to reject deposit:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to reject deposit',
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

  const handleViewDetails = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'REJECTED':
      case 'FAILED':
        return <Badge className="bg-secondary/10 text-secondary">Rejected</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading && deposits.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Deposits</h1>
        <p className="text-gray-600 mt-2">Review and approve deposit requests</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests ({deposits.length})</CardTitle>
          <CardDescription>All pending deposit requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          {deposits.length > 0 ? (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          £{deposit.amount.toLocaleString()}
                        </h3>
                        {getStatusBadge(deposit.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">User:</span>{' '}
                          {deposit.user.firstName} {deposit.user.lastName} ({deposit.user.email})
                        </p>
                        {deposit.bankAccount && (
                          <>
                            <p>
                              <span className="font-medium">Account:</span>{' '}
                              {deposit.bankAccount.bankName} - ****
                              {deposit.bankAccount.accountNumber.slice(-4)}
                            </p>
                            <p>
                              <span className="font-medium">Current Balance:</span>{' '}
                              £{deposit.bankAccount.balance.toLocaleString()}
                            </p>
                          </>
                        )}
                        {deposit.description && (
                          <p>
                            <span className="font-medium">Description:</span> {deposit.description}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Requested:</span>{' '}
                          {new Date(deposit.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {deposit.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(deposit)}
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(deposit.id)}
                          disabled={processingId === deposit.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(deposit.id)}
                          disabled={processingId === deposit.id}
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
              <p className="text-gray-500">No pending deposits</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Deposit Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDeposit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <p className="text-lg font-semibold text-gray-900">
                      £{selectedDeposit.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {getStatusBadge(selectedDeposit.status)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Information</label>
                  <p className="text-gray-900">
                    {selectedDeposit.user.firstName} {selectedDeposit.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedDeposit.user.email}</p>
                </div>

                {selectedDeposit.bankAccount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                    <p className="text-gray-900">
                      {selectedDeposit.bankAccount.bankName} - ****
                      {selectedDeposit.bankAccount.accountNumber.slice(-4)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Balance: £{selectedDeposit.bankAccount.balance.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedDeposit.transactionDate || selectedDeposit.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <p className="text-gray-900">
                      {new Date(selectedDeposit.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedDeposit.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{selectedDeposit.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {selectedDeposit.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => {
                        handleApprove(selectedDeposit.id);
                        setShowDetailsModal(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleRejectClick(selectedDeposit.id);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDeposit(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Reject Deposit</h2>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this deposit:</p>
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

