'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';

interface SupportSetting {
  id: string;
  key: string;
  value: string;
  label: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupportPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirmDialog();
  const [settings, setSettings] = useState<SupportSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    label: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.support.getSettings();
      setSettings(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch support settings:', err);
      setError(err.response?.data?.message || 'Failed to load support settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: SupportSetting) => {
    setEditingKey(setting.key);
    setFormData({
      key: setting.key,
      value: setting.value,
      label: setting.label || '',
      displayOrder: setting.displayOrder,
      isActive: setting.isActive,
    });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setShowAddForm(false);
    setFormData({
      key: '',
      value: '',
      label: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  const handleSave = async () => {
    try {
      if (editingKey) {
        // Update existing
        await api.support.updateSetting(editingKey, {
          value: formData.value,
          label: formData.label || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        });
      } else {
        // Create new
        await api.support.createSetting(formData);
      }
      await fetchSettings();
      handleCancel();
      confirmDialog.confirm(
        'Success',
        'Support setting saved successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to save setting:', err);
      confirmDialog.confirm(
        'Error',
        err.response?.data?.message || 'Failed to save setting',
        () => {},
        'destructive',
        false,
        false,
        'OK'
      );
    }
  };

  const handleDelete = (key: string) => {
    confirmDialog.confirm(
      'Delete Support Setting',
      `Are you sure you want to delete the support setting "${key}"?`,
      async () => {
        try {
          await api.support.deleteSetting(key);
          await fetchSettings();
          confirmDialog.confirm(
            'Success',
            'Support setting deleted successfully',
            () => {},
            'success',
            false,
            false,
            'OK'
          );
        } catch (err: any) {
          console.error('Failed to delete setting:', err);
          confirmDialog.confirm(
            'Error',
            err.response?.data?.message || 'Failed to delete setting',
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Settings</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage support contact information displayed to clients
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Setting
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Support Setting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key (unique identifier)
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., phone, email, hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label (display name)
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Support Phone, Support Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., +44 20 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to clients)
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Support Settings</CardTitle>
          <CardDescription>
            These settings are displayed on the client support page. Only active settings are visible to clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No support settings configured. Click "Add Setting" to create one.
            </p>
          ) : (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className={`p-4 border rounded-lg ${setting.isActive ? 'bg-white' : 'bg-gray-50'}`}
                >
                  {editingKey === setting.key ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={formData.displayOrder}
                          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 text-primary border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Active</label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {setting.label || setting.key}
                          </h3>
                          {!setting.isActive && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{setting.value}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Key: {setting.key} | Order: {setting.displayOrder}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(setting)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(setting.key)}
                          size="sm"
                          variant="outline"
                          className="text-secondary hover:text-secondary/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {confirmDialog.dialog}
    </div>
  );
}

