'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Search, ChevronDown, X } from 'lucide-react';
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

interface Portfolio {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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

export default function AdminPortfoliosPage() {
  const confirmDialog = useConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    name: '',
    description: '',
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    totalValue: '',
    totalInvested: '',
    totalGain: '',
    gainPercentage: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPortfolios();
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [currentPage, itemsPerPage, userFilter]);

  const fetchUsers = async () => {
    try {
      const response = await api.admin.getUsers({ limit: 1000 });
      setUsers(response.data.data.users);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchPortfolios = async () => {
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

      const response = await api.admin.getAllPortfolios(params);
      // Convert Decimal values to numbers (handle Prisma Decimal serialization)
      const portfolios = response.data.data.portfolios.map((p: any) => {
        const convertDecimal = (val: any): number => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') return parseFloat(val) || 0;
          if (val && typeof val === 'object' && 'toString' in val) return parseFloat(val.toString()) || 0;
          return Number(val) || 0;
        };
        return {
          ...p,
          totalValue: convertDecimal(p.totalValue),
          totalInvested: convertDecimal(p.totalInvested),
          totalGain: convertDecimal(p.totalGain),
          gainPercentage: convertDecimal(p.gainPercentage),
        };
      });
      setPortfolios(portfolios);
      setTotal(response.data.data.total);
    } catch (err: any) {
      console.error('Failed to fetch portfolios:', err);
      setError(extractErrorMessage(err, 'Failed to load portfolios'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.userId || !createFormData.name.trim()) {
      setError('User and portfolio name are required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.admin.createUserPortfolio(createFormData.userId, {
        name: createFormData.name,
        description: createFormData.description || undefined,
        isActive: createFormData.isActive,
      });
      await fetchPortfolios();
      setShowCreateModal(false);
      setCreateFormData({
        userId: '',
        name: '',
        description: '',
        isActive: true,
      });
      setUserSearchTerm('');
      setShowUserDropdown(false);
      confirmDialog.confirm(
        'Success',
        'Portfolio created successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to create portfolio:', err);
      setError(extractErrorMessage(err, 'Failed to create portfolio'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setEditFormData({
      name: portfolio.name,
      description: portfolio.description || '',
      isActive: portfolio.isActive,
      totalValue: portfolio.totalValue.toString(),
      totalInvested: portfolio.totalInvested.toString(),
      totalGain: portfolio.totalGain.toString(),
      gainPercentage: portfolio.gainPercentage.toString(),
    });
    setShowEditModal(true);
  };

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolio || !editFormData.name.trim()) {
      setError('Portfolio name is required');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const updateData: any = {
        name: editFormData.name,
        description: editFormData.description || undefined,
        isActive: editFormData.isActive,
      };

      // Add financial fields if provided
      if (editFormData.totalValue.trim()) {
        updateData.totalValue = parseFloat(editFormData.totalValue);
      }
      if (editFormData.totalInvested.trim()) {
        updateData.totalInvested = parseFloat(editFormData.totalInvested);
      }
      if (editFormData.totalGain.trim()) {
        updateData.totalGain = parseFloat(editFormData.totalGain);
      }
      if (editFormData.gainPercentage.trim()) {
        updateData.gainPercentage = parseFloat(editFormData.gainPercentage);
      }

      await api.admin.updateUserPortfolio(editingPortfolio.userId, editingPortfolio.id, updateData);
      await fetchPortfolios();
      setShowEditModal(false);
      setEditingPortfolio(null);
      confirmDialog.confirm(
        'Success',
        'Portfolio updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to update portfolio:', err);
      setError(extractErrorMessage(err, 'Failed to update portfolio'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePortfolio = (portfolio: Portfolio) => {
    const hasInvestments = portfolio.investmentCount > 0;
    const warningMessage = hasInvestments
      ? `This portfolio contains ${portfolio.investmentCount} investment(s). Deleting it will also delete all associated investments. Are you sure you want to proceed?`
      : `Are you sure you want to delete the portfolio "${portfolio.name}"? This action cannot be undone.`;

    confirmDialog.confirm(
      'Delete Portfolio',
      warningMessage,
      async () => {
        try {
          await api.admin.deleteUserPortfolio(portfolio.userId, portfolio.id);
          await fetchPortfolios();
          confirmDialog.confirm(
            'Success',
            'Portfolio deleted successfully',
            () => {},
            'success',
            false,
            false,
            'OK'
          );
        } catch (err: any) {
          console.error('Failed to delete portfolio:', err);
          const errorMessage = extractErrorMessage(err, 'Failed to delete portfolio');
          if (errorMessage.includes('contains') && errorMessage.includes('investment')) {
            confirmDialog.confirm(
              'Cannot Delete Portfolio',
              errorMessage,
              () => {},
              'destructive',
              false,
              false,
              'OK'
            );
          } else {
            confirmDialog.confirm(
              'Error',
              errorMessage,
              () => {},
              'destructive',
              false,
              false,
              'OK'
            );
          }
        }
      },
      hasInvestments ? 'destructive' : 'default'
    );
  };

  const formatCurrency = (value: number | string | any) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : Number(value) || 0;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(numValue);
  };

  const formatPercentage = (value: number | string | any) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : Number(value) || 0;
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };

  const getGainLossColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGainLossIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 inline mr-1" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 inline mr-1" />;
    return null;
  };

  const filteredUsersForSelect = users.filter((user) => {
    const searchLower = userSearchTerm.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const selectedUser = users.find((u) => u.id === createFormData.userId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Management</h1>
          <p className="text-gray-600 mt-2">Create and manage portfolios for users</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter portfolios by user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User</label>
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Portfolios Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Portfolios ({total})</CardTitle>
          <CardDescription>
            {userFilter ? `Filtered by user` : 'All portfolios across all users'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && portfolios.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading portfolios...</p>
            </div>
          ) : portfolios.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">User</th>
                      <th className="text-left p-3 text-sm font-medium">Portfolio Name</th>
                      <th className="text-left p-3 text-sm font-medium">Description</th>
                      <th className="text-left p-3 text-sm font-medium">Total Value</th>
                      <th className="text-left p-3 text-sm font-medium">Total Invested</th>
                      <th className="text-left p-3 text-sm font-medium">Gain/Loss</th>
                      <th className="text-left p-3 text-sm font-medium">Investments</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Created</th>
                      <th className="text-right p-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolios.map((portfolio) => (
                      <tr key={portfolio.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{portfolio.userName}</div>
                            <div className="text-sm text-gray-500">{portfolio.userEmail}</div>
                          </div>
                        </td>
                        <td className="p-3 font-medium">{portfolio.name}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {portfolio.description || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="p-3 font-medium">{formatCurrency(portfolio.totalValue)}</td>
                        <td className="p-3">{formatCurrency(portfolio.totalInvested)}</td>
                        <td className={`p-3 ${getGainLossColor(portfolio.totalGain)}`}>
                          <div className="font-semibold flex items-center">
                            {getGainLossIcon(portfolio.totalGain)}
                            {formatCurrency(portfolio.totalGain)} ({formatPercentage(portfolio.gainPercentage)})
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={portfolio.investmentCount > 0 ? 'default' : 'secondary'}>
                            {portfolio.investmentCount}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              portfolio.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {portfolio.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(portfolio.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPortfolio(portfolio)}
                              title="Edit portfolio"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeletePortfolio(portfolio);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete portfolio"
                              type="button"
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
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, total)} of {total} portfolios
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
              No portfolios found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Portfolio Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setUserSearchTerm('');
            setShowUserDropdown(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Portfolio</DialogTitle>
            <CardDescription>Create a new portfolio for a user</CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePortfolio} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="userId" className="text-right pt-2">
                User <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 relative">
                <div className="relative">
                  <div
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary outline-none flex items-center cursor-pointer bg-white"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    {selectedUser ? (
                      <span className="flex-1 text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                      </span>
                    ) : (
                      <span className="flex-1 text-gray-400">Select a user</span>
                    )}
                    <div className="flex items-center gap-2">
                      {selectedUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateFormData({ ...createFormData, userId: '' });
                            setUserSearchTerm('');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
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
                                setCreateFormData({ ...createFormData, userId: user.id });
                                setShowUserDropdown(false);
                                setUserSearchTerm('');
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
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            No users found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  id="userId"
                  value={createFormData.userId}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                className="col-span-3"
                required
                placeholder="Portfolio name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <textarea
                id="description"
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, description: e.target.value })
                }
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                rows={3}
                placeholder="Portfolio description (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={createFormData.isActive}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Portfolio is active
                </label>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm col-span-4">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Portfolio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <CardDescription>Update portfolio details for {editingPortfolio?.name}</CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePortfolio} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                placeholder="Portfolio name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                rows={3}
                placeholder="Portfolio description (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-isActive" className="text-sm font-medium">
                Active Status
              </Label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={editFormData.isActive}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="edit-isActive" className="ml-2 text-sm text-gray-700">
                  Portfolio is active
                </label>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Values</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalValue" className="text-sm font-medium">
                    Total Value
                  </Label>
                  <Input
                    id="edit-totalValue"
                    type="number"
                    step="0.01"
                    value={editFormData.totalValue}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, totalValue: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-totalInvested" className="text-sm font-medium">
                    Total Invested
                  </Label>
                  <Input
                    id="edit-totalInvested"
                    type="number"
                    step="0.01"
                    value={editFormData.totalInvested}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, totalInvested: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-totalGain" className="text-sm font-medium">
                    Total Gain
                  </Label>
                  <Input
                    id="edit-totalGain"
                    type="number"
                    step="0.01"
                    value={editFormData.totalGain}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, totalGain: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gainPercentage" className="text-sm font-medium">
                    Gain Percentage (%)
                  </Label>
                  <Input
                    id="edit-gainPercentage"
                    type="number"
                    step="0.01"
                    value={editFormData.gainPercentage}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, gainPercentage: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update Portfolio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {confirmDialog.dialog}
    </div>
  );
}

