'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, TrendingUp, TrendingDown, Calculator, Save, X, Plus, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';
import { extractErrorMessage } from '@/lib/errorHandling';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'ADMIN';
}

interface Investment {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  portfolioId: string;
  portfolioName: string;
  type: string;
  name: string;
  symbol: string | null;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalGain: number;
  gainPercentage: number;
  purchaseDate: string;
  maturityDate: string | null;
  interestRate: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  isActive: boolean;
  investmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUserInvestmentsPage() {
  const confirmDialog = useConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [approvingInvestment, setApprovingInvestment] = useState<string | null>(null);
  const [rejectingInvestment, setRejectingInvestment] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [manualAdjustMode, setManualAdjustMode] = useState<Record<string, boolean>>({});
  const [portfolioAdjustments, setPortfolioAdjustments] = useState<Record<string, {
    totalValue: string;
    totalInvested: string;
    totalGain: string;
  }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [editFormData, setEditFormData] = useState({
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    maturityDate: '',
    interestRate: '',
  });

  const [updating, setUpdating] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    portfolioId: '',
    type: 'STOCK',
    name: '',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    interestRate: '',
  });
  const [creating, setCreating] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [portfolioSearchTerm, setPortfolioSearchTerm] = useState('');
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);
  const [createModalPortfolios, setCreateModalPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchAllInvestments();
  }, []);

  useEffect(() => {
    fetchAllInvestments();
  }, [currentPage, itemsPerPage, userFilter, typeFilter, statusFilter]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserData();
    } else {
      setPortfolios([]);
      setSelectedUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await api.admin.getUsers({ limit: 1000 });
      setUsers(response.data.data.users);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAllInvestments = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (userFilter) {
        params.userId = userFilter;
      }

      if (typeFilter) {
        params.type = typeFilter;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.admin.getAllInvestments(params);
      setInvestments(response.data.data.investments);
      setTotal(response.data.data.total);
    } catch (err: any) {
      console.error('Failed to fetch investments:', err);
      setError(extractErrorMessage(err, 'Failed to load investments'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!selectedUserId) {
      setSelectedUser(null);
      setPortfolios([]);
      return;
    }

    try {
      setError('');

      const [portfoliosRes, userRes] = await Promise.all([
        api.admin.getUserPortfolios(selectedUserId),
        api.admin.getUserById(selectedUserId),
      ]);

      setPortfolios(portfoliosRes.data.data);
      setSelectedUser(userRes.data.data);

      // Initialize manual adjust mode to false for all portfolios
      const adjustMode: Record<string, boolean> = {};
      portfoliosRes.data.data.forEach((p: Portfolio) => {
        adjustMode[p.id] = false;
      });
      setManualAdjustMode(adjustMode);
    } catch (err: any) {
      console.error('Failed to fetch user data:', err);
      setError(extractErrorMessage(err, 'Failed to load user data'));
    }
  };

  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    setEditFormData({
      quantity: investment.quantity.toString(),
      purchasePrice: investment.purchasePrice.toString(),
      currentPrice: investment.currentPrice.toString(),
      maturityDate: investment.maturityDate ? new Date(investment.maturityDate).toISOString().split('T')[0] : '',
      interestRate: investment.interestRate?.toString() || '',
    });
  };

  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment || !selectedUserId) return;

    setUpdating(true);
    setError('');

    try {
      const updateData: any = {};

      if (editFormData.quantity) updateData.quantity = parseFloat(editFormData.quantity);
      if (editFormData.purchasePrice) updateData.purchasePrice = parseFloat(editFormData.purchasePrice);
      if (editFormData.currentPrice) updateData.currentPrice = parseFloat(editFormData.currentPrice);
      if (editFormData.maturityDate) {
        updateData.maturityDate = new Date(editFormData.maturityDate).toISOString();
      } else if (editFormData.maturityDate === '') {
        updateData.maturityDate = null;
      }
      if (editFormData.interestRate) {
        updateData.interestRate = parseFloat(editFormData.interestRate);
      } else if (editFormData.interestRate === '') {
        updateData.interestRate = null;
      }

      await api.admin.updateUserInvestment(editingInvestment.userId || selectedUserId, editingInvestment.id, updateData);
      await fetchAllInvestments();
      if (selectedUserId) {
        await fetchUserData();
      }
      setEditingInvestment(null);
      confirmDialog.confirm(
        'Success',
        'Investment updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to update investment:', err);
      setError(extractErrorMessage(err, 'Failed to update investment'));
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveInvestment = async (investmentId: string) => {
    setApprovingInvestment(investmentId);
    setError('');
    try {
      await api.admin.approveInvestment(investmentId);
      await fetchAllInvestments();
      if (selectedUserId) {
        await fetchUserData();
      }
      confirmDialog.confirm(
        'Success',
        'Investment approved successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to approve investment:', err);
      setError(extractErrorMessage(err, 'Failed to approve investment'));
    } finally {
      setApprovingInvestment(null);
    }
  };

  const handleRejectInvestment = async (investmentId: string, reason?: string) => {
    setRejectingInvestment(investmentId);
    setError('');
    try {
      await api.admin.rejectInvestment(investmentId, reason);
      await fetchAllInvestments();
      if (selectedUserId) {
        await fetchUserData();
      }
      setRejectReason('');
      confirmDialog.confirm(
        'Success',
        'Investment rejected successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to reject investment:', err);
      setError(extractErrorMessage(err, 'Failed to reject investment'));
    } finally {
      setRejectingInvestment(null);
    }
  };

  const handleDeleteInvestment = (investment: Investment) => {
    const userId = investment.userId || selectedUserId;
    if (!userId) return;

    confirmDialog.confirm(
      'Delete Investment',
      `Are you sure you want to delete "${investment.name}"?\n\nThis action cannot be undone.`,
      async () => {
        try {
          await api.admin.deleteUserInvestment(userId, investment.id);
          await fetchAllInvestments();
          if (selectedUserId) {
            await fetchUserData();
          }
          confirmDialog.confirm(
            'Success',
            'Investment deleted successfully',
            () => {},
            'success',
            false,
            false,
            'OK'
          );
        } catch (err: any) {
          console.error('Failed to delete investment:', err);
          confirmDialog.confirm(
            'Error',
            extractErrorMessage(err, 'Failed to delete investment'),
            () => {},
            'destructive',
            false,
            false,
            'OK'
          );
        }
      },
      'destructive'
    );
  };

  const handleToggleManualAdjust = (portfolioId: string) => {
    setManualAdjustMode((prev) => ({
      ...prev,
      [portfolioId]: !prev[portfolioId],
    }));

    if (!manualAdjustMode[portfolioId]) {
      // Switching to manual mode - initialize with current values
      const portfolio = portfolios.find((p) => p.id === portfolioId);
      if (portfolio) {
        setPortfolioAdjustments((prev) => ({
          ...prev,
          [portfolioId]: {
            totalValue: portfolio.totalValue.toString(),
            totalInvested: portfolio.totalInvested.toString(),
            totalGain: portfolio.totalGain.toString(),
          },
        }));
      }
    }
  };

  const handleSavePortfolioAdjustment = async (portfolioId: string) => {
    if (!selectedUserId) return;

    const adjustment = portfolioAdjustments[portfolioId];
    if (!adjustment) return;

    try {
      setLoading(true);
      setError('');

      await api.admin.adjustPortfolioTotals(selectedUserId, portfolioId, {
        totalValue: parseFloat(adjustment.totalValue),
        totalInvested: parseFloat(adjustment.totalInvested),
        totalGain: parseFloat(adjustment.totalGain),
        manualAdjust: true,
      });

      await fetchUserData();
      confirmDialog.confirm(
        'Success',
        'Portfolio totals updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to adjust portfolio:', err);
      setError(extractErrorMessage(err, 'Failed to adjust portfolio totals'));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCalculate = async (portfolioId: string) => {
    if (!selectedUserId) return;

    try {
      setLoading(true);
      setError('');

      await api.admin.adjustPortfolioTotals(selectedUserId, portfolioId, {
        manualAdjust: false,
      });

      await fetchUserData();
      confirmDialog.confirm(
        'Success',
        'Portfolio totals recalculated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to recalculate portfolio:', err);
      setError(extractErrorMessage(err, 'Failed to recalculate portfolio totals'));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const investmentsByPortfolio = investments.reduce((acc, inv) => {
    if (!acc[inv.portfolioId]) {
      acc[inv.portfolioId] = [];
    }
    acc[inv.portfolioId].push(inv);
    return acc;
  }, {} as Record<string, Investment[]>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  const formatPercentage = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return '0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) return '0.00';
    return numValue.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.userId || !createFormData.portfolioId) {
      setError('Please select a user and portfolio');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const dataToSend: any = {
        portfolioId: createFormData.portfolioId,
        type: createFormData.type,
        name: createFormData.name,
        symbol: createFormData.symbol || undefined,
        quantity: parseFloat(createFormData.quantity),
        purchasePrice: parseFloat(createFormData.purchasePrice),
        currentPrice: parseFloat(createFormData.currentPrice),
        purchaseDate: createFormData.purchaseDate ? new Date(createFormData.purchaseDate).toISOString() : undefined,
        maturityDate: createFormData.maturityDate ? new Date(createFormData.maturityDate).toISOString() : null,
        interestRate: createFormData.interestRate ? parseFloat(createFormData.interestRate) : null,
      };

      await api.admin.createUserInvestment(createFormData.userId, dataToSend);
      await fetchAllInvestments();
      if (createFormData.userId === selectedUserId) {
        await fetchUserData();
      }
      setShowCreateModal(false);
      setCreateFormData({
        userId: '',
        portfolioId: '',
        type: 'STOCK',
        name: '',
        symbol: '',
        quantity: '',
        purchasePrice: '',
        currentPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        maturityDate: '',
        interestRate: '',
      });
      setUserSearchTerm('');
      setPortfolioSearchTerm('');
      setShowUserDropdown(false);
      setShowPortfolioDropdown(false);
      setCreateModalPortfolios([]);
      confirmDialog.confirm(
        'Success',
        'Investment created successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to create investment:', err);
      setError(extractErrorMessage(err, 'Failed to create investment'));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModalUserChange = async (userId: string) => {
    setCreateFormData({ ...createFormData, userId, portfolioId: '' });
    setUserSearchTerm('');
    setShowUserDropdown(false);
    if (userId) {
      try {
        const response = await api.admin.getUserPortfolios(userId);
        setCreateModalPortfolios(response.data.data.portfolios || []);
      } catch (err: any) {
        console.error('Failed to fetch portfolios:', err);
      }
    } else {
      setCreateModalPortfolios([]);
    }
  };

  const filteredUsersForSelect = users.filter((user) => {
    const searchLower = userSearchTerm.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const filteredPortfoliosForSelect = createModalPortfolios.filter((portfolio) => {
    const searchLower = portfolioSearchTerm.toLowerCase();
    const name = portfolio.name.toLowerCase();
    const description = (portfolio.description || '').toLowerCase();
    return name.includes(searchLower) || description.includes(searchLower);
  });

  const selectedUserForCreate = users.find((u) => u.id === createFormData.userId);
  const selectedPortfolioForCreate = createModalPortfolios.find((p) => p.id === createFormData.portfolioId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Investments Management</h1>
          <p className="text-gray-600 mt-2">Manage user investments and portfolio totals</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Investment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter investments by user or type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User</label>
              <select
                value={userFilter}
                onChange={(e) => {
                  const userId = e.target.value;
                  setUserFilter(userId);
                  setSelectedUserId(userId);
                  setCurrentPage(1);
                  if (userId) {
                    fetchUserData();
                  } else {
                    setSelectedUser(null);
                    setPortfolios([]);
                  }
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Types</option>
                <option value="STOCK">Stock</option>
                <option value="BOND">Bond</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="SAVINGS">Savings</option>
                <option value="FIXED_DEPOSIT">Fixed Deposit</option>
                <option value="IPO">IPO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="MATURED">Matured</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
              <select
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

      {/* User Selection for Portfolio Management */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Selected User</CardTitle>
            <CardDescription>Viewing portfolio details for selected user</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="font-medium text-lg">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-sm text-gray-600">{selectedUser.email}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUserId('');
                    setSelectedUser(null);
                    setUserFilter('');
                  }}
                  className="mt-2"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Investments ({total})</CardTitle>
          <CardDescription>
            {userFilter ? `Filtered by user` : 'All investments across all users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && investments.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading investments...</p>
            </div>
          ) : investments.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">User</th>
                      <th className="text-left p-3 text-sm font-medium">Name</th>
                      <th className="text-left p-3 text-sm font-medium">Type</th>
                      <th className="text-left p-3 text-sm font-medium">Portfolio</th>
                      <th className="text-left p-3 text-sm font-medium">Quantity</th>
                      <th className="text-left p-3 text-sm font-medium">Purchase Price</th>
                      <th className="text-left p-3 text-sm font-medium">Current Price</th>
                      <th className="text-left p-3 text-sm font-medium">Total Value</th>
                      <th className="text-left p-3 text-sm font-medium">Gain/Loss</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Purchase Date</th>
                      <th className="text-right p-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((investment) => (
                      <tr key={investment.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {investment.userName ? (
                            <div>
                              <div className="font-medium">{investment.userName}</div>
                              <div className="text-sm text-gray-500">{investment.userEmail}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{investment.name}</div>
                          {investment.symbol && (
                            <div className="text-sm text-gray-500">{investment.symbol}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge>{investment.type}</Badge>
                        </td>
                        <td className="p-3">{investment.portfolioName}</td>
                        <td className="p-3">{investment.quantity.toLocaleString()}</td>
                        <td className="p-3">{formatCurrency(investment.purchasePrice)}</td>
                        <td className="p-3">{formatCurrency(investment.currentPrice)}</td>
                        <td className="p-3 font-medium">{formatCurrency(investment.totalValue)}</td>
                        <td className="p-3">
                          <div
                            className={`font-semibold flex items-center gap-1 ${
                              investment.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {investment.totalGain >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {formatCurrency(investment.totalGain)} ({formatPercentage(investment.gainPercentage)}%)
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              investment.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : investment.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : investment.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : investment.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {investment.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{formatDate(investment.purchaseDate)}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            {investment.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveInvestment(investment.id)}
                                  disabled={approvingInvestment === investment.id}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve investment"
                                >
                                  {approvingInvestment === investment.id ? '...' : 'Approve'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason (optional):');
                                    if (reason !== null) {
                                      handleRejectInvestment(investment.id, reason || undefined);
                                    }
                                  }}
                                  disabled={rejectingInvestment === investment.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject investment"
                                >
                                  {rejectingInvestment === investment.id ? '...' : 'Reject'}
                                </Button>
                              </>
                            )}
                            {investment.status !== 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditInvestment(investment)}
                                  title="Edit investment"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteInvestment(investment)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete investment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, total)} of {total} investments
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(total / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(Math.ceil(total / itemsPerPage) || 1, prev + 1))
                    }
                    disabled={currentPage >= Math.ceil(total / itemsPerPage) || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No investments found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Summary Cards - Only shown when user is selected */}
      {selectedUser && (
        <>
          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                  {portfolio.description && (
                    <CardDescription>{portfolio.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Total Value</div>
                      <div className="text-xl font-bold">{formatCurrency(portfolio.totalValue)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Invested</div>
                      <div className="text-lg">{formatCurrency(portfolio.totalInvested)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Gain/Loss</div>
                      <div
                        className={`text-lg font-semibold flex items-center gap-1 ${
                          portfolio.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {portfolio.totalGain >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatCurrency(portfolio.totalGain)} ({formatPercentage(portfolio.gainPercentage)}%)
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Investments: {portfolio.investmentCount}
                    </div>

                    {/* Manual Adjustment Toggle */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Calculation Mode</label>
                        <button
                          onClick={() => handleToggleManualAdjust(portfolio.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            manualAdjustMode[portfolio.id] ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              manualAdjustMode[portfolio.id] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {manualAdjustMode[portfolio.id] ? 'Manual Adjustment' : 'Auto-calculate'}
                      </div>

                      {manualAdjustMode[portfolio.id] && (
                        <div className="mt-3 space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">Total Value</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={portfolioAdjustments[portfolio.id]?.totalValue || ''}
                              onChange={(e) =>
                                setPortfolioAdjustments((prev) => ({
                                  ...prev,
                                  [portfolio.id]: {
                                    ...prev[portfolio.id],
                                    totalValue: e.target.value,
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Total Invested</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={portfolioAdjustments[portfolio.id]?.totalInvested || ''}
                              onChange={(e) =>
                                setPortfolioAdjustments((prev) => ({
                                  ...prev,
                                  [portfolio.id]: {
                                    ...prev[portfolio.id],
                                    totalInvested: e.target.value,
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Total Gain</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={portfolioAdjustments[portfolio.id]?.totalGain || ''}
                              onChange={(e) =>
                                setPortfolioAdjustments((prev) => ({
                                  ...prev,
                                  [portfolio.id]: {
                                    ...prev[portfolio.id],
                                    totalGain: e.target.value,
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSavePortfolioAdjustment(portfolio.id)}
                              className="flex-1"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAutoCalculate(portfolio.id)}
                              className="flex-1"
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              Auto
                            </Button>
                          </div>
                        </div>
                      )}

                      {!manualAdjustMode[portfolio.id] && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAutoCalculate(portfolio.id)}
                          className="w-full mt-2"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Recalculate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Investments by Portfolio - Only shown when user is selected */}
          <Card>
            <CardHeader>
              <CardTitle>Investments by Portfolio</CardTitle>
              <CardDescription>
                All investments for {selectedUser.firstName} {selectedUser.lastName} grouped by portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const userInvestments = investments.filter((inv) => inv.userId === selectedUserId);
                const userInvestmentsByPortfolio = userInvestments.reduce((acc, inv) => {
                  if (!acc[inv.portfolioId]) {
                    acc[inv.portfolioId] = [];
                  }
                  acc[inv.portfolioId].push(inv);
                  return acc;
                }, {} as Record<string, Investment[]>);

                return userInvestments.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(userInvestmentsByPortfolio).map(([portfolioId, portfolioInvestments]) => {
                      const portfolio = portfolios.find((p) => p.id === portfolioId);
                      return (
                        <div key={portfolioId} className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b">
                            <h3 className="font-semibold text-lg">{portfolio?.name || 'Unknown Portfolio'}</h3>
                            <p className="text-sm text-gray-600">
                              {portfolioInvestments.length} investment{portfolioInvestments.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left p-3 text-sm font-medium">Name</th>
                                  <th className="text-left p-3 text-sm font-medium">Type</th>
                                  <th className="text-left p-3 text-sm font-medium">Quantity</th>
                                  <th className="text-left p-3 text-sm font-medium">Purchase Price</th>
                                  <th className="text-left p-3 text-sm font-medium">Current Price</th>
                                  <th className="text-left p-3 text-sm font-medium">Total Value</th>
                                  <th className="text-left p-3 text-sm font-medium">Gain/Loss</th>
                                  <th className="text-left p-3 text-sm font-medium">Purchase Date</th>
                                  <th className="text-right p-3 text-sm font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {portfolioInvestments.map((investment) => (
                                  <tr key={investment.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                      <div className="font-medium">{investment.name}</div>
                                      {investment.symbol && (
                                        <div className="text-sm text-gray-500">{investment.symbol}</div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <Badge>{investment.type}</Badge>
                                    </td>
                                    <td className="p-3">{investment.quantity.toLocaleString()}</td>
                                    <td className="p-3">{formatCurrency(investment.purchasePrice)}</td>
                                    <td className="p-3">{formatCurrency(investment.currentPrice)}</td>
                                    <td className="p-3 font-medium">{formatCurrency(investment.totalValue)}</td>
                                    <td className="p-3">
                                      <div
                                        className={`font-semibold flex items-center gap-1 ${
                                          investment.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}
                                      >
                                        {investment.totalGain >= 0 ? (
                                          <TrendingUp className="h-4 w-4" />
                                        ) : (
                                          <TrendingDown className="h-4 w-4" />
                                        )}
                                        {formatCurrency(investment.totalGain)} ({formatPercentage(investment.gainPercentage)}%)
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm">{formatDate(investment.purchaseDate)}</td>
                                    <td className="p-3">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditInvestment(investment)}
                                          title="Edit investment"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteInvestment(investment)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          title="Delete investment"
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
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No investments found for this user
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Investment Modal */}
      {editingInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Investment</h2>
                <button
                  onClick={() => setEditingInvestment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateInvestment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Name
                  </label>
                  <input
                    type="text"
                    value={editingInvestment.name}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.purchasePrice}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, purchasePrice: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.currentPrice}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, currentPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maturity Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.maturityDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, maturityDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.interestRate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, interestRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={updating} className="flex-1">
                    {updating ? 'Updating...' : 'Update Investment'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingInvestment(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Create Investment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Investment</DialogTitle>
            <CardDescription>Add a new investment for a user</CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvestment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-user" className="text-sm font-medium">
                User <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-primary outline-none"
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowPortfolioDropdown(false);
                  }}
                >
                  {selectedUserForCreate ? (
                    <span className="flex-1 text-gray-900">
                      {selectedUserForCreate.firstName} {selectedUserForCreate.lastName} ({selectedUserForCreate.email})
                    </span>
                  ) : (
                    <span className="flex-1 text-gray-400">Select a user</span>
                  )}
                  <div className="flex items-center gap-2">
                    {selectedUserForCreate && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateModalUserChange('');
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateModalUserChange('');
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
                {showUserDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearchTerm}
                          onChange={(e) => {
                            setUserSearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {filteredUsersForSelect.length > 0 ? (
                        filteredUsersForSelect.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              handleCreateModalUserChange(user.id);
                            }}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                              createFormData.userId === user.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No users found</div>
                      )}
                    </div>
                  </div>
                )}
                {showUserDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowUserDropdown(false);
                    }}
                  />
                )}
                <input
                  type="hidden"
                  value={createFormData.userId}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-portfolio" className="text-sm font-medium">
                Portfolio <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  disabled={!createFormData.userId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:ring-2 focus:ring-primary outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (createFormData.userId) {
                      setShowPortfolioDropdown(!showPortfolioDropdown);
                      setShowUserDropdown(false);
                    }
                  }}
                >
                  {selectedPortfolioForCreate ? (
                    <span className="flex-1 text-gray-900">{selectedPortfolioForCreate.name}</span>
                  ) : (
                    <span className="flex-1 text-gray-400">Select a portfolio</span>
                  )}
                  <div className="flex items-center gap-2">
                    {selectedPortfolioForCreate && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateFormData({ ...createFormData, portfolioId: '' });
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setCreateFormData({ ...createFormData, portfolioId: '' });
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
                {showPortfolioDropdown && createFormData.userId && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search portfolios..."
                          value={portfolioSearchTerm}
                          onChange={(e) => {
                            setPortfolioSearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {filteredPortfoliosForSelect.length > 0 ? (
                        filteredPortfoliosForSelect.map((portfolio) => (
                          <div
                            key={portfolio.id}
                            onClick={() => {
                              setCreateFormData({ ...createFormData, portfolioId: portfolio.id });
                              setShowPortfolioDropdown(false);
                              setPortfolioSearchTerm('');
                            }}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                              createFormData.portfolioId === portfolio.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="font-medium text-gray-900">{portfolio.name}</div>
                            {portfolio.description && (
                              <div className="text-sm text-gray-500 truncate">{portfolio.description}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">No portfolios found</div>
                      )}
                    </div>
                  </div>
                )}
                {showPortfolioDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowPortfolioDropdown(false);
                    }}
                  />
                )}
                <input
                  type="hidden"
                  value={createFormData.portfolioId}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-type" className="text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="create-type"
                  value={createFormData.type}
                  onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="STOCK">Stock</option>
                  <option value="BOND">Bond</option>
                  <option value="TERM_DEPOSIT">Term Deposit</option>
                  <option value="MUTUAL_FUND">Mutual Fund</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-symbol" className="text-sm font-medium">
                  Symbol
                </Label>
                <Input
                  id="create-symbol"
                  value={createFormData.symbol}
                  onChange={(e) => setCreateFormData({ ...createFormData, symbol: e.target.value })}
                  placeholder="Ticker symbol"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-sm font-medium">
                Investment Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                required
                placeholder="e.g., Microsoft Corp. (MSFT)"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-quantity" className="text-sm font-medium">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-quantity"
                  type="number"
                  step="0.01"
                  value={createFormData.quantity}
                  onChange={(e) => setCreateFormData({ ...createFormData, quantity: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-purchasePrice" className="text-sm font-medium">
                  Purchase Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-purchasePrice"
                  type="number"
                  step="0.01"
                  value={createFormData.purchasePrice}
                  onChange={(e) => setCreateFormData({ ...createFormData, purchasePrice: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-currentPrice" className="text-sm font-medium">
                  Current Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-currentPrice"
                  type="number"
                  step="0.01"
                  value={createFormData.currentPrice}
                  onChange={(e) => setCreateFormData({ ...createFormData, currentPrice: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-purchaseDate" className="text-sm font-medium">
                  Purchase Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-purchaseDate"
                  type="date"
                  value={createFormData.purchaseDate}
                  onChange={(e) => setCreateFormData({ ...createFormData, purchaseDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-maturityDate" className="text-sm font-medium">
                  Maturity Date
                </Label>
                <Input
                  id="create-maturityDate"
                  type="date"
                  value={createFormData.maturityDate}
                  onChange={(e) => setCreateFormData({ ...createFormData, maturityDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-interestRate" className="text-sm font-medium">
                Interest Rate (%)
              </Label>
              <Input
                id="create-interestRate"
                type="number"
                step="0.01"
                value={createFormData.interestRate}
                onChange={(e) => setCreateFormData({ ...createFormData, interestRate: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Investment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {confirmDialog.dialog}
    </div>
  );
}

