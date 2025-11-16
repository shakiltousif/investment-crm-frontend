'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';
import { extractErrorMessage } from '@/lib/errorHandling';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import InvestmentDetailsModal from '@/components/InvestmentDetailsModal';

interface MarketplaceItem {
  id: string;
  name: string;
  type: string;
  symbol: string | null;
  description: string | null;
  currentPrice: number;
  minimumInvestment: number;
  maximumInvestment: number | null;
  currency: string;
  riskLevel: string;
  expectedReturn: number | null;
  category: string | null;
  issuer: string | null;
  maturityDate: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminMarketplacePage() {
  const confirmDialog = useConfirmDialog();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    type: 'STOCK',
    symbol: '',
    description: '',
    minimumInvestment: '',
    currency: 'GBP',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    expectedReturn: '',
    category: '',
    issuer: '',
    maturityDate: '',
    isAvailable: true,
  });
  const [creating, setCreating] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<MarketplaceItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'STOCK',
    symbol: '',
    description: '',
    minimumInvestment: '',
    currency: 'GBP',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    expectedReturn: '',
    category: '',
    issuer: '',
    maturityDate: '',
    isAvailable: true,
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [currentPage, itemsPerPage, typeFilter, riskLevelFilter, categoryFilter, searchTerm, minPrice, maxPrice]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (typeFilter) params.type = typeFilter;
      if (riskLevelFilter) params.riskLevel = riskLevelFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);

      const response = await api.admin.getAllMarketplaceItems(params);
      const data = response.data.data;
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch marketplace items:', err);
      setError(extractErrorMessage(err, 'Failed to fetch marketplace items'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');

      const dataToSend: any = {
        name: createFormData.name,
        type: createFormData.type,
        symbol: createFormData.symbol || undefined,
        description: createFormData.description || undefined,
        minimumInvestment: parseFloat(createFormData.minimumInvestment),
        currency: createFormData.currency,
        riskLevel: createFormData.riskLevel,
        expectedReturn: createFormData.expectedReturn ? parseFloat(createFormData.expectedReturn) : undefined,
        category: createFormData.category || undefined,
        issuer: createFormData.issuer || undefined,
        maturityDate: createFormData.maturityDate || undefined,
        isAvailable: createFormData.isAvailable,
      };

      await api.admin.createMarketplaceItem(dataToSend);
      await fetchItems();
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        type: 'STOCK',
        symbol: '',
        description: '',
        minimumInvestment: '',
        currency: 'GBP',
        riskLevel: 'MEDIUM',
        expectedReturn: '',
        category: '',
        issuer: '',
        maturityDate: '',
        isAvailable: true,
      });
      confirmDialog.confirm(
        'Success',
        'Marketplace item created successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to create marketplace item:', err);
      setError(extractErrorMessage(err, 'Failed to create marketplace item'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditItem = (item: MarketplaceItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      type: item.type,
      symbol: item.symbol || '',
      description: item.description || '',
      minimumInvestment: item.minimumInvestment.toString(),
      currency: item.currency,
      riskLevel: item.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
      expectedReturn: item.expectedReturn?.toString() || '',
      category: item.category || '',
      issuer: item.issuer || '',
      maturityDate: item.maturityDate ? new Date(item.maturityDate).toISOString().split('T')[0] : '',
      isAvailable: item.isAvailable,
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setUpdating(true);
      setError('');

      const dataToSend: any = {
        name: editFormData.name,
        type: editFormData.type,
        symbol: editFormData.symbol || null,
        description: editFormData.description || null,
        minimumInvestment: parseFloat(editFormData.minimumInvestment),
        currency: editFormData.currency,
        riskLevel: editFormData.riskLevel,
        expectedReturn: editFormData.expectedReturn ? parseFloat(editFormData.expectedReturn) : null,
        category: editFormData.category || null,
        issuer: editFormData.issuer || null,
        maturityDate: editFormData.maturityDate || null,
        isAvailable: editFormData.isAvailable,
      };

      await api.admin.updateMarketplaceItem(editingItem.id, dataToSend);
      await fetchItems();
      setShowEditModal(false);
      setEditingItem(null);
      confirmDialog.confirm(
        'Success',
        'Marketplace item updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to update marketplace item:', err);
      setError(extractErrorMessage(err, 'Failed to update marketplace item'));
    } finally {
      setUpdating(false);
    }
  };

  const handleViewItem = (item: MarketplaceItem) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleDeleteItem = (item: MarketplaceItem) => {
    confirmDialog.confirm(
      'Delete Marketplace Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      async () => {
        try {
          await api.admin.deleteMarketplaceItem(item.id);
          await fetchItems();
          confirmDialog.confirm(
            'Success',
            'Marketplace item deleted successfully',
            () => {},
            'success',
            false,
            false,
            'OK'
          );
        } catch (err: any) {
          console.error('Failed to delete marketplace item:', err);
          const errorMessage = extractErrorMessage(err, 'Failed to delete marketplace item');
          confirmDialog.confirm('Error', errorMessage, () => {}, 'destructive', false, false, 'OK');
        }
      },
      'destructive'
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STOCK':
        return 'bg-blue-100 text-blue-800';
      case 'BOND':
        return 'bg-purple-100 text-purple-800';
      case 'MUTUAL_FUND':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setTypeFilter('');
    setRiskLevelFilter('');
    setCategoryFilter('');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Management</h1>
          <p className="text-gray-600 mt-2">Create and manage marketplace investment items</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Item
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter marketplace items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Types</option>
                <option value="STOCK">Stock</option>
                <option value="BOND">Bond</option>
                <option value="MUTUAL_FUND">Mutual Fund</option>
                <option value="TERM_DEPOSIT">Term Deposit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="riskLevel">Risk Level</Label>
              <select
                id="riskLevel"
                value={riskLevelFilter}
                onChange={(e) => setRiskLevelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Risk Levels</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="Minimum price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="Maximum price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Per Page */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="itemsPerPage">Items Per Page:</Label>
          <select
            id="itemsPerPage"
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
      </div>

      {/* Marketplace Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Items</CardTitle>
          <CardDescription>
            {total > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, total)} of ${total} items`
              : 'No items found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading marketplace items...</p>
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">ISIN</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Min Investment</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Risk</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Return %</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="p-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{item.symbol || '-'}</td>
                        <td className="p-3 text-sm">{formatCurrency(item.minimumInvestment)}</td>
                        <td className="p-3">
                          <Badge className={getRiskLevelColor(item.riskLevel)}>{item.riskLevel}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {item.expectedReturn !== null ? `${item.expectedReturn.toFixed(2)}%` : '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{item.category || '-'}</td>
                        <td className="p-3">
                          <Badge
                            className={
                              item.isAvailable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewItem(item)}
                              title="View item details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              title="Edit item"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteItem(item);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete item"
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
              {total > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, total)} of{' '}
                    {total} items
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
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No marketplace items found</div>
          )}
        </CardContent>
      </Card>

      {/* Create Item Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Marketplace Item</DialogTitle>
            <CardDescription>Create a new marketplace investment item</CardDescription>
          </DialogHeader>
          <form onSubmit={handleCreateItem} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                required
                placeholder="Investment name"
              />
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
                  <option value="ETF">ETF</option>
                  <option value="MUTUAL_FUND">Mutual Fund</option>
                  <option value="TERM_DEPOSIT">Term Deposit</option>
                  <option value="PRIVATE_EQUITY">Private Equity</option>
                  <option value="CRYPTOCURRENCY">Cryptocurrency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-symbol" className="text-sm font-medium">
                  ISIN
                </Label>
                <Input
                  id="create-symbol"
                  value={createFormData.symbol}
                  onChange={(e) => setCreateFormData({ ...createFormData, symbol: e.target.value })}
                  placeholder="ISIN code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description" className="text-sm font-medium">
                Description
              </Label>
              <textarea
                id="create-description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                rows={3}
                placeholder="Investment description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-minimumInvestment" className="text-sm font-medium">
                  Minimum Investment <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-minimumInvestment"
                  type="number"
                  step="0.01"
                  value={createFormData.minimumInvestment}
                  onChange={(e) => setCreateFormData({ ...createFormData, minimumInvestment: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-currency" className="text-sm font-medium">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-currency"
                  value={createFormData.currency}
                  onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                  required
                  placeholder="GBP"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-riskLevel" className="text-sm font-medium">
                  Risk Level <span className="text-red-500">*</span>
                </Label>
                <select
                  id="create-riskLevel"
                  value={createFormData.riskLevel}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      riskLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-expectedReturn" className="text-sm font-medium">
                  Return %
                </Label>
                <Input
                  id="create-expectedReturn"
                  type="number"
                  step="0.01"
                  value={createFormData.expectedReturn}
                  onChange={(e) => setCreateFormData({ ...createFormData, expectedReturn: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-category" className="text-sm font-medium">
                  Category
                </Label>
                <Input
                  id="create-category"
                  value={createFormData.category}
                  onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })}
                  placeholder="Category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-issuer" className="text-sm font-medium">
                  Issuer
                </Label>
                <Input
                  id="create-issuer"
                  value={createFormData.issuer}
                  onChange={(e) => setCreateFormData({ ...createFormData, issuer: e.target.value })}
                  placeholder="Issuer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2 flex items-end">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="create-isAvailable"
                    checked={createFormData.isAvailable}
                    onChange={(e) => setCreateFormData({ ...createFormData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="create-isAvailable" className="ml-2 text-sm text-gray-700">
                    Item is available
                  </label>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Marketplace Item</DialogTitle>
            <CardDescription>Update marketplace item details for {editingItem?.name}</CardDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateItem} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                placeholder="Investment name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit-type"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="STOCK">Stock</option>
                  <option value="BOND">Bond</option>
                  <option value="ETF">ETF</option>
                  <option value="MUTUAL_FUND">Mutual Fund</option>
                  <option value="TERM_DEPOSIT">Term Deposit</option>
                  <option value="PRIVATE_EQUITY">Private Equity</option>
                  <option value="CRYPTOCURRENCY">Cryptocurrency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-symbol" className="text-sm font-medium">
                  ISIN
                </Label>
                <Input
                  id="edit-symbol"
                  value={editFormData.symbol}
                  onChange={(e) => setEditFormData({ ...editFormData, symbol: e.target.value })}
                  placeholder="ISIN code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                rows={3}
                placeholder="Investment description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minimumInvestment" className="text-sm font-medium">
                  Minimum Investment <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-minimumInvestment"
                  type="number"
                  step="0.01"
                  value={editFormData.minimumInvestment}
                  onChange={(e) => setEditFormData({ ...editFormData, minimumInvestment: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency" className="text-sm font-medium">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-currency"
                  value={editFormData.currency}
                  onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                  required
                  placeholder="GBP"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-riskLevel" className="text-sm font-medium">
                  Risk Level <span className="text-red-500">*</span>
                </Label>
                <select
                  id="edit-riskLevel"
                  value={editFormData.riskLevel}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      riskLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expectedReturn" className="text-sm font-medium">
                  Return %
                </Label>
                <Input
                  id="edit-expectedReturn"
                  type="number"
                  step="0.01"
                  value={editFormData.expectedReturn}
                  onChange={(e) => setEditFormData({ ...editFormData, expectedReturn: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-medium">
                  Category
                </Label>
                <Input
                  id="edit-category"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  placeholder="Category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-issuer" className="text-sm font-medium">
                  Issuer
                </Label>
                <Input
                  id="edit-issuer"
                  value={editFormData.issuer}
                  onChange={(e) => setEditFormData({ ...editFormData, issuer: e.target.value })}
                  placeholder="Issuer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maturityDate" className="text-sm font-medium">
                  Maturity Date
                </Label>
                <Input
                  id="edit-maturityDate"
                  type="date"
                  value={editFormData.maturityDate}
                  onChange={(e) => setEditFormData({ ...editFormData, maturityDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-isAvailable"
                    checked={editFormData.isAvailable}
                    onChange={(e) => setEditFormData({ ...editFormData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="edit-isAvailable" className="ml-2 text-sm text-gray-700">
                    Item is available
                  </label>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Item Modal */}
      {showViewModal && viewingItem && (
        <InvestmentDetailsModal
          investment={{
            id: viewingItem.id,
            name: viewingItem.name,
            type: viewingItem.type,
            symbol: viewingItem.symbol || undefined,
            description: viewingItem.description || undefined,
            currentPrice: viewingItem.currentPrice,
            minimumInvestment: viewingItem.minimumInvestment,
            maximumInvestment: viewingItem.maximumInvestment || undefined,
            currency: viewingItem.currency,
            riskLevel: viewingItem.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
            expectedReturn: viewingItem.expectedReturn || undefined,
            maturityDate: viewingItem.maturityDate || undefined,
            isAvailable: viewingItem.isAvailable,
            category: viewingItem.category || '',
            issuer: viewingItem.issuer || '',
            createdAt: viewingItem.createdAt,
          }}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingItem(null);
          }}
        />
      )}

      {confirmDialog.dialog}
    </div>
  );
}

