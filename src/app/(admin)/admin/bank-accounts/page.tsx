'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreditCard, Edit, Trash2, Search, Eye, CheckCircle, XCircle, Star, Plus, X, ChevronDown } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';
import { extractErrorMessage } from '@/lib/errorHandling';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface BankAccount {
  id: string;
  userId: string;
  user: User;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string | null;
  accountType: string;
  currency: string;
  balance: number;
  isVerified: boolean;
  verifiedAt: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBankAccountsPage() {
  const confirmDialog = useConfirmDialog();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>('');
  const [isPrimaryFilter, setIsPrimaryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    bankCode: '',
    accountType: 'Savings',
    currency: 'GBP',
    balance: '',
    isVerified: false,
    isPrimary: false,
  });
  const [creating, setCreating] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editFormData, setEditFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    bankCode: '',
    accountType: 'Savings',
    currency: 'GBP',
    balance: '',
    isVerified: false,
    isPrimary: false,
  });
  const [updating, setUpdating] = useState(false);

  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null);

  useEffect(() => {
    fetchBankAccounts();
    fetchUsers();
  }, [currentPage, itemsPerPage, userIdFilter, isVerifiedFilter, isPrimaryFilter, searchTerm]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (userIdFilter) params.userId = userIdFilter;
      if (isVerifiedFilter !== '') {
        params.isVerified = isVerifiedFilter === 'true';
      }
      if (isPrimaryFilter !== '') {
        params.isPrimary = isPrimaryFilter === 'true';
      }
      if (searchTerm) params.search = searchTerm;

      const response = await api.admin.bankAccounts.getAll(params);
      const data = response.data.data;
      setBankAccounts(data.bankAccounts || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch bank accounts:', err);
      setError(extractErrorMessage(err, 'Failed to fetch bank accounts'));
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

  const selectedUserForCreate = useMemo(() => {
    return users.find((u) => u.id === createFormData.userId);
  }, [users, createFormData.userId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.userId) {
      setError('Please select a user');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const data: any = {
        userId: createFormData.userId,
        accountHolderName: createFormData.accountHolderName,
        accountNumber: createFormData.accountNumber,
        bankName: createFormData.bankName,
        accountType: createFormData.accountType,
        currency: createFormData.currency,
        isVerified: createFormData.isVerified,
        isPrimary: createFormData.isPrimary,
      };

      if (createFormData.bankCode) {
        data.bankCode = createFormData.bankCode;
      }
      if (createFormData.balance) {
        data.balance = parseFloat(createFormData.balance);
      }

      await api.admin.bankAccounts.create(data);
      setShowCreateModal(false);
      resetCreateForm();
      fetchBankAccounts();
    } catch (err: any) {
      console.error('Failed to create bank account:', err);
      setError(extractErrorMessage(err, 'Failed to create bank account'));
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setEditFormData({
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      bankCode: account.bankCode || '',
      accountType: account.accountType,
      currency: account.currency,
      balance: account.balance.toString(),
      isVerified: account.isVerified,
      isPrimary: account.isPrimary,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setUpdating(true);
      setError('');

      const data: any = {
        accountHolderName: editFormData.accountHolderName,
        accountNumber: editFormData.accountNumber,
        bankName: editFormData.bankName,
        accountType: editFormData.accountType,
        currency: editFormData.currency,
        balance: parseFloat(editFormData.balance),
        isVerified: editFormData.isVerified,
        isPrimary: editFormData.isPrimary,
      };

      if (editFormData.bankCode) {
        data.bankCode = editFormData.bankCode;
      } else {
        data.bankCode = null;
      }

      await api.admin.bankAccounts.update(editingAccount.id, data);
      setShowEditModal(false);
      setEditingAccount(null);
      fetchBankAccounts();
    } catch (err: any) {
      console.error('Failed to update bank account:', err);
      setError(extractErrorMessage(err, 'Failed to update bank account'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog.confirm({
      title: 'Delete Bank Account',
      message: 'Are you sure you want to delete this bank account? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await api.admin.bankAccounts.delete(id);
      fetchBankAccounts();
    } catch (err: any) {
      console.error('Failed to delete bank account:', err);
      setError(extractErrorMessage(err, 'Failed to delete bank account'));
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.admin.bankAccounts.verify(id);
      fetchBankAccounts();
    } catch (err: any) {
      console.error('Failed to verify bank account:', err);
      setError(extractErrorMessage(err, 'Failed to verify bank account'));
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.admin.bankAccounts.setPrimary(id);
      fetchBankAccounts();
    } catch (err: any) {
      console.error('Failed to set primary bank account:', err);
      setError(extractErrorMessage(err, 'Failed to set primary bank account'));
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      userId: '',
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      bankCode: '',
      accountType: 'Savings',
      currency: 'GBP',
      balance: '',
      isVerified: false,
      isPrimary: false,
    });
    setUserSearchTerm('');
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Account Management</h1>
          <p className="text-gray-600 mt-2">Manage bank accounts for all users</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bank Account
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
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
              <Label>User</Label>
              <select
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
              <Label>Verification Status</Label>
              <select
                value={isVerifiedFilter}
                onChange={(e) => {
                  setIsVerifiedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <div>
              <Label>Primary Status</Label>
              <select
                value={isPrimaryFilter}
                onChange={(e) => {
                  setIsPrimaryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All</option>
                <option value="true">Primary</option>
                <option value="false">Non-Primary</option>
              </select>
            </div>
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Bank name, account number, holder name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Per Page */}
      {bankAccounts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">Items Per Page:</Label>
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} accounts
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts Table */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bank accounts...</p>
          </div>
        </div>
      ) : bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Accounts Found</h3>
            <p className="text-gray-600">
              {searchTerm || userIdFilter || isVerifiedFilter || isPrimaryFilter
                ? 'No bank accounts match your filters.'
                : "No bank accounts have been created yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Holder</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {account.user.firstName} {account.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{account.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.accountHolderName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.bankName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.bankCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {maskAccountNumber(account.accountNumber)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.accountType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(account.balance, account.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {account.isVerified ? (
                              <Badge className="bg-green-100 text-green-800 w-fit">Verified</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 w-fit">Pending</Badge>
                            )}
                            {account.isPrimary && (
                              <Badge className="bg-blue-100 text-blue-800 w-fit">Primary</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingAccount(account)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(account)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!account.isVerified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerify(account.id)}
                                className="h-8 w-8 p-0 text-green-600"
                                title="Verify"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {!account.isPrimary && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetPrimary(account.id)}
                                className="h-8 w-8 p-0 text-blue-600"
                                title="Set Primary"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(account.id)}
                              className="h-8 w-8 p-0 text-red-600"
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
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bank Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* User Selection */}
              <div>
                <Label>User *</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                  >
                    <span>
                      {selectedUserForCreate
                        ? `${selectedUserForCreate.firstName} ${selectedUserForCreate.lastName} (${selectedUserForCreate.email})`
                        : 'Select a user'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {showUserDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      <div className="p-2">
                        <Input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="mb-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {filteredUsersForSelect.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setCreateFormData({ ...createFormData, userId: user.id });
                              setShowUserDropdown(false);
                              setUserSearchTerm('');
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                          >
                            {user.firstName} {user.lastName} ({user.email})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Account Holder Name *</Label>
                <Input
                  type="text"
                  value={createFormData.accountHolderName}
                  onChange={(e) => setCreateFormData({ ...createFormData, accountHolderName: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label>Account Number *</Label>
                <Input
                  type="text"
                  value={createFormData.accountNumber}
                  onChange={(e) => setCreateFormData({ ...createFormData, accountNumber: e.target.value })}
                  required
                  placeholder="1234567890"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    type="text"
                    value={createFormData.bankName}
                    onChange={(e) => setCreateFormData({ ...createFormData, bankName: e.target.value })}
                    required
                    placeholder="Bank of America"
                  />
                </div>
                <div>
                  <Label>Sort Code</Label>
                  <Input
                    type="text"
                    value={createFormData.bankCode}
                    onChange={(e) => setCreateFormData({ ...createFormData, bankCode: e.target.value })}
                    placeholder="BOFA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Type *</Label>
                  <select
                    value={createFormData.accountType}
                    onChange={(e) => setCreateFormData({ ...createFormData, accountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option>Savings</option>
                    <option>Checking</option>
                    <option>Money Market</option>
                    <option>Investment</option>
                  </select>
                </div>
                <div>
                  <Label>Currency *</Label>
                  <select
                    value={createFormData.currency}
                    onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option>GBP</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>JPY</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Initial Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createFormData.balance}
                  onChange={(e) => setCreateFormData({ ...createFormData, balance: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createFormData.isVerified}
                    onChange={(e) => setCreateFormData({ ...createFormData, isVerified: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Verified</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createFormData.isPrimary}
                    onChange={(e) => setCreateFormData({ ...createFormData, isPrimary: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Primary Account</span>
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAccount && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>User</Label>
                <Input
                  type="text"
                  value={`${editingAccount.user.firstName} ${editingAccount.user.lastName} (${editingAccount.user.email})`}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label>Account Holder Name *</Label>
                <Input
                  type="text"
                  value={editFormData.accountHolderName}
                  onChange={(e) => setEditFormData({ ...editFormData, accountHolderName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Account Number *</Label>
                <Input
                  type="text"
                  value={editFormData.accountNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    type="text"
                    value={editFormData.bankName}
                    onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Sort Code</Label>
                  <Input
                    type="text"
                    value={editFormData.bankCode}
                    onChange={(e) => setEditFormData({ ...editFormData, bankCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Type *</Label>
                  <select
                    value={editFormData.accountType}
                    onChange={(e) => setEditFormData({ ...editFormData, accountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option>Savings</option>
                    <option>Checking</option>
                    <option>Money Market</option>
                    <option>Investment</option>
                  </select>
                </div>
                <div>
                  <Label>Currency *</Label>
                  <select
                    value={editFormData.currency}
                    onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option>GBP</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>JPY</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Balance *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.balance}
                  onChange={(e) => setEditFormData({ ...editFormData, balance: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.isVerified}
                    onChange={(e) => setEditFormData({ ...editFormData, isVerified: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Verified</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.isPrimary}
                    onChange={(e) => setEditFormData({ ...editFormData, isPrimary: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Primary Account</span>
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setEditingAccount(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Modal */}
      {viewingAccount && (
        <Dialog open={!!viewingAccount} onOpenChange={() => setViewingAccount(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bank Account Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">User</Label>
                  <p className="text-gray-900 font-medium">
                    {viewingAccount.user.firstName} {viewingAccount.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{viewingAccount.user.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Account Holder Name</Label>
                  <p className="text-gray-900 font-medium">{viewingAccount.accountHolderName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Bank Name</Label>
                  <p className="text-gray-900 font-medium">{viewingAccount.bankName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Sort Code</Label>
                  <p className="text-gray-900 font-medium">{viewingAccount.bankCode || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Account Number</Label>
                  <p className="text-gray-900 font-mono font-medium">{viewingAccount.accountNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Account Type</Label>
                  <p className="text-gray-900 font-medium">{viewingAccount.accountType}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Currency</Label>
                  <p className="text-gray-900 font-medium">{viewingAccount.currency}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Balance</Label>
                  <p className="text-gray-900 font-medium text-lg">
                    {formatCurrency(viewingAccount.balance, viewingAccount.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Verification Status</Label>
                  {viewingAccount.isVerified ? (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  )}
                  {viewingAccount.verifiedAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      Verified on: {new Date(viewingAccount.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500">Primary Status</Label>
                  {viewingAccount.isPrimary ? (
                    <Badge className="bg-blue-100 text-blue-800">Primary Account</Badge>
                  ) : (
                    <p className="text-gray-500">Not Primary</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-500">Created At</Label>
                  <p className="text-gray-900">{new Date(viewingAccount.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Updated At</Label>
                  <p className="text-gray-900">{new Date(viewingAccount.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingAccount(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

