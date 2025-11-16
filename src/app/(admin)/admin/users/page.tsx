'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, UserCheck, UserX, Trash2, Lock, Unlock, Filter, X, Users, Shield, ListFilter } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'CLIENT' | 'ADMIN';
  isActive: boolean;
  kycStatus: string;
  createdAt: string;
  lastLoginAt?: string;
  lockedUntil?: string | null;
  failedLoginAttempts?: number;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  profilePicture?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentExpiryDate?: string | null;
  isEmailVerified?: boolean;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const confirmDialog = useConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'CLIENT' as 'CLIENT' | 'ADMIN',
    sendCredentialsEmail: true,
    generatePassword: true,
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    profilePicture: '',
    kycStatus: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED',
    documentType: '',
    documentNumber: '',
    documentExpiryDate: '',
    isEmailVerified: false,
  });
  const [creating, setCreating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'CLIENT' as 'CLIENT' | 'ADMIN',
    isActive: true,
    email: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    profilePicture: '',
    kycStatus: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED',
    documentType: '',
    documentNumber: '',
    documentExpiryDate: '',
    isEmailVerified: false,
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter, currentPage, itemsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter === 'active';

      const response = await api.admin.getUsers(params);
      setUsers(response.data.data.users);
      setTotal(response.data.data.total);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.admin.updateUser(user.id, { isActive: !user.isActive });
      fetchUsers();
      confirmDialog.confirm(
        'Success',
        `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to update user:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to update user',
        () => {},
        'destructive',
        false,
        false,
        'OK'
      );
    }
  };

  const handleUnlockAccount = async (user: User) => {
    const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
    
    if (!isLocked) {
      confirmDialog.confirm(
        'Account Not Locked',
        'This account is not currently locked.',
        () => {},
        'info',
        false,
        false,
        'OK'
      );
      return;
    }

    confirmDialog.confirm(
      'Unlock Account',
      `Are you sure you want to unlock the account for "${user.firstName} ${user.lastName}" (${user.email})?\n\nThis will reset their failed login attempts and allow them to log in again.`,
      async () => {
        try {
          await api.admin.unlockAccount(user.id);
          await fetchUsers();
          confirmDialog.confirm(
            'Success',
            'Account unlocked successfully',
            () => {},
            'success',
            false,
            false,
            'OK'
          );
        } catch (err: any) {
          console.error('Failed to unlock account:', err);
          confirmDialog.confirm(
            'Error',
            err.response?.data?.message || 'Failed to unlock account',
            () => {},
            'destructive',
            false,
            false,
            'OK'
          );
        }
      },
      'default'
    );
  };

  const handleDeleteUser = (user: User) => {
    // Prevent deleting current user
    if (currentUser?.id === user.id) {
      confirmDialog.confirm(
        'Cannot Delete Account',
        'You cannot delete your own account',
        () => {},
        'warning',
        false,
        false,
        'OK'
      );
      return;
    }

    // Confirmation dialog
    confirmDialog.confirm(
      'Delete User',
      `Are you sure you want to delete user "${user.firstName} ${user.lastName}" (${user.email})?\n\nThis action cannot be undone and will permanently delete the user and all associated data.`,
      async () => {
        try {
          setDeletingUserId(user.id);
          await api.admin.deleteUser(user.id);
          await fetchUsers();
          confirmDialog.confirm(
            'Success',
            'User deleted successfully',
            () => {},
            'success',
            false,
            false,
            'OK'
          );
        } catch (err: any) {
          console.error('Failed to delete user:', err);
          confirmDialog.confirm(
            'Error',
            err.response?.data?.message || 'Failed to delete user',
            () => {},
            'destructive',
            false,
            false,
            'OK'
          );
        } finally {
          setDeletingUserId(null);
        }
      },
      'destructive'
    );
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditError('');
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      isActive: user.isActive,
      email: user.email,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      country: user.country || '',
      profilePicture: user.profilePicture || '',
      kycStatus: (user.kycStatus as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED') || 'PENDING',
      documentType: user.documentType || '',
      documentNumber: user.documentNumber || '',
      documentExpiryDate: user.documentExpiryDate
        ? new Date(user.documentExpiryDate).toISOString().split('T')[0]
        : '',
      isEmailVerified: user.isEmailVerified || false,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    setEditError('');

    try {
      const updateData: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phoneNumber: editFormData.phoneNumber || null,
        role: editFormData.role,
        isActive: editFormData.isActive,
        email: editFormData.email,
        dateOfBirth: editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString() : null,
        address: editFormData.address || null,
        city: editFormData.city || null,
        state: editFormData.state || null,
        zipCode: editFormData.zipCode || null,
        country: editFormData.country || null,
        profilePicture: editFormData.profilePicture || null,
        kycStatus: editFormData.kycStatus,
        documentType: editFormData.documentType || null,
        documentNumber: editFormData.documentNumber || null,
        documentExpiryDate: editFormData.documentExpiryDate
          ? new Date(editFormData.documentExpiryDate).toISOString()
          : null,
        isEmailVerified: editFormData.isEmailVerified,
      };

      await api.admin.updateUser(editingUser.id, updateData);

      await fetchUsers();
      setEditingUser(null);
      setEditError('');
      confirmDialog.confirm(
        'Success',
        'User updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to update user:', err);
      setEditError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const dataToSend: any = {
        email: createFormData.email,
        firstName: createFormData.firstName,
        lastName: createFormData.lastName,
        phoneNumber: createFormData.phoneNumber || null,
        role: createFormData.role,
        sendCredentialsEmail: createFormData.sendCredentialsEmail,
        dateOfBirth: createFormData.dateOfBirth ? new Date(createFormData.dateOfBirth).toISOString() : null,
        address: createFormData.address || null,
        city: createFormData.city || null,
        state: createFormData.state || null,
        zipCode: createFormData.zipCode || null,
        country: createFormData.country || null,
        profilePicture: createFormData.profilePicture || null,
        kycStatus: createFormData.kycStatus,
        documentType: createFormData.documentType || null,
        documentNumber: createFormData.documentNumber || null,
        documentExpiryDate: createFormData.documentExpiryDate
          ? new Date(createFormData.documentExpiryDate).toISOString()
          : null,
        isEmailVerified: createFormData.isEmailVerified,
      };

      // Only include password if not generating
      if (!createFormData.generatePassword && createFormData.password) {
        dataToSend.password = createFormData.password;
      }

      const response = await api.admin.createUser(dataToSend);
      
      // Show success message with temporary password if generated
      if (response.data.data.temporaryPassword) {
        confirmDialog.confirm(
          'User Created Successfully',
          `Temporary Password: ${response.data.data.temporaryPassword}\n\n${createFormData.sendCredentialsEmail ? 'Credentials have been sent via email.' : 'Please share these credentials with the user.'}`,
          () => {},
          'success',
          false,
          false,
          'OK'
        );
      } else {
        confirmDialog.confirm(
          'Success',
          'User created successfully!',
          () => {},
          'success',
          false,
          false,
          'OK'
        );
      }

      setShowCreateModal(false);
      setCreateFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'CLIENT',
        sendCredentialsEmail: true,
        generatePassword: true,
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        profilePicture: '',
        kycStatus: 'PENDING',
        documentType: '',
        documentNumber: '',
        documentExpiryDate: '',
        isEmailVerified: false,
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to create user',
        () => {},
        'destructive',
        false,
        false,
        'OK'
      );
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getKycBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users and their accounts</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          {(searchTerm || roleFilter || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="text-gray-600 hover:text-gray-900 h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Role
              </label>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value="">All Roles</option>
                  <option value="CLIENT">Client</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Items Per Page */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Items Per Page
              </label>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({total})</CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">KYC</th>
                    <th className="text-left p-4">Last Login</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                        <Badge
                          className={
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-secondary/10 text-secondary'
                          }
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                          {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <Lock className="h-3 w-3 mr-1 inline" />
                              Locked
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getKycBadgeColor(user.kycStatus)}>
                          {user.kycStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlockAccount(user)}
                              title="Unlock account"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4 text-secondary" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingUserId === user.id || currentUser?.id === user.id}
                            className="text-secondary hover:text-secondary/80 hover:bg-secondary/10"
                            title={currentUser?.id === user.id ? 'Cannot delete your own account' : 'Delete user'}
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
          ) : (
            <p className="text-gray-500 text-center py-8">No users found</p>
          )}

          {/* Pagination */}
          {users.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, total)} of {total} users
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
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.firstName}
                    onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.lastName}
                    onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createFormData.phoneNumber}
                    onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="+44 20 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'CLIENT' | 'ADMIN' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="CLIENT">Client</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="generatePassword"
                    checked={createFormData.generatePassword}
                    onChange={(e) => setCreateFormData({ ...createFormData, generatePassword: e.target.checked, password: '' })}
                    className="w-4 h-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="generatePassword" className="ml-2 text-sm text-gray-700">
                    Generate temporary password automatically
                  </label>
                </div>

                {!createFormData.generatePassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password * (min 8 characters)
                    </label>
                    <input
                      type="password"
                      required={!createFormData.generatePassword}
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      minLength={8}
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendCredentialsEmail"
                    checked={createFormData.sendCredentialsEmail}
                    onChange={(e) => setCreateFormData({ ...createFormData, sendCredentialsEmail: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded"
                  />
                  <label htmlFor="sendCredentialsEmail" className="ml-2 text-sm text-gray-700">
                    Send credentials via email
                  </label>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={createFormData.dateOfBirth}
                        onChange={(e) => setCreateFormData({ ...createFormData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={createFormData.country}
                        onChange={(e) => setCreateFormData({ ...createFormData, country: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="United Kingdom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={createFormData.city}
                        onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="London"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={createFormData.state}
                        onChange={(e) => setCreateFormData({ ...createFormData, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="England"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={createFormData.address}
                        onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zip/Postal Code
                      </label>
                      <input
                        type="text"
                        value={createFormData.zipCode}
                        onChange={(e) => setCreateFormData({ ...createFormData, zipCode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="SW1A 1AA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Picture URL
                      </label>
                      <input
                        type="url"
                        value={createFormData.profilePicture}
                        onChange={(e) => setCreateFormData({ ...createFormData, profilePicture: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">KYC & Verification</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KYC Status
                      </label>
                      <select
                        value={createFormData.kycStatus}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            kycStatus: e.target.value as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED',
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Type
                      </label>
                      <input
                        type="text"
                        value={createFormData.documentType}
                        onChange={(e) => setCreateFormData({ ...createFormData, documentType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Passport, ID Card, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Number
                      </label>
                      <input
                        type="text"
                        value={createFormData.documentNumber}
                        onChange={(e) => setCreateFormData({ ...createFormData, documentNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Document number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Expiry Date
                      </label>
                      <input
                        type="date"
                        value={createFormData.documentExpiryDate}
                        onChange={(e) => setCreateFormData({ ...createFormData, documentExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <input
                        type="checkbox"
                        id="isEmailVerified"
                        checked={createFormData.isEmailVerified}
                        onChange={(e) => setCreateFormData({ ...createFormData, isEmailVerified: e.target.checked })}
                        className="w-4 h-4 text-primary border-gray-300 rounded"
                      />
                      <label htmlFor="isEmailVerified" className="ml-2 text-sm text-gray-700">
                        Email is verified
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({
                        email: '',
                        password: '',
                        firstName: '',
                        lastName: '',
                        phoneNumber: '',
                        role: 'CLIENT',
                        sendCredentialsEmail: true,
                        generatePassword: true,
                        dateOfBirth: '',
                        address: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: '',
                        profilePicture: '',
                        kycStatus: 'PENDING',
                        documentType: '',
                        documentNumber: '',
                        documentExpiryDate: '',
                        isEmailVerified: false,
                      });
                    }}
                    variant="outline"
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit User</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              
              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{editError}</p>
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                  </label>
                  <input
                    type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                  />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phoneNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="+44 20 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'CLIENT' | 'ADMIN' })}
                    disabled={currentUser?.id === editingUser.id}
                      className={`w-full px-3 py-2 border rounded-lg ${
                      currentUser?.id === editingUser.id ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="CLIENT">Client</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {currentUser?.id === editingUser.id && (
                    <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                  )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="London"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={editFormData.state}
                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="England"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zip/Postal Code
                      </label>
                      <input
                        type="text"
                        value={editFormData.zipCode}
                        onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="SW1A 1AA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editFormData.country}
                        onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="United Kingdom"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">KYC & Verification</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KYC Status
                      </label>
                      <select
                        value={editFormData.kycStatus}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            kycStatus: e.target.value as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED',
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Type
                      </label>
                      <input
                        type="text"
                        value={editFormData.documentType}
                        onChange={(e) => setEditFormData({ ...editFormData, documentType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Passport, ID Card, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.documentNumber}
                        onChange={(e) => setEditFormData({ ...editFormData, documentNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Document number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Expiry Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.documentExpiryDate}
                        onChange={(e) => setEditFormData({ ...editFormData, documentExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Picture URL
                      </label>
                      <input
                        type="url"
                        value={editFormData.profilePicture}
                        onChange={(e) => setEditFormData({ ...editFormData, profilePicture: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Status</h3>
                  <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                        id="editIsActive"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    disabled={currentUser?.id === editingUser.id}
                        className={`w-4 h-4 text-primary border-gray-300 rounded ${
                      currentUser?.id === editingUser.id ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  />
                      <label htmlFor="editIsActive" className={`ml-2 text-sm text-gray-700 ${
                      currentUser?.id === editingUser.id ? 'text-gray-500' : ''
                      }`}>
                        User is active
                  </label>
                  {currentUser?.id === editingUser.id && (
                    <p className="text-xs text-gray-500 ml-2">You cannot deactivate your own account</p>
                  )}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsEmailVerified"
                        checked={editFormData.isEmailVerified}
                        onChange={(e) => setEditFormData({ ...editFormData, isEmailVerified: e.target.checked })}
                        className="w-4 h-4 text-primary border-gray-300 rounded"
                      />
                      <label htmlFor="editIsEmailVerified" className="ml-2 text-sm text-gray-700">
                        Email is verified
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {updating ? 'Updating...' : 'Update User'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setEditError('');
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {confirmDialog.dialog}
    </div>
  );
}

