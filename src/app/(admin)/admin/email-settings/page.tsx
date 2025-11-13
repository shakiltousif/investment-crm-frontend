'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Save, RefreshCw } from 'lucide-react';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';

interface EmailNotificationSettings {
  accountCreated: boolean;
  accountLocked: boolean;
  accountUnlocked: boolean;
  kycStatusChange: boolean;
  documentStatusChange: boolean;
  documentUploaded: boolean;
  depositSubmitted: boolean;
  depositStatusChange: boolean;
  withdrawalSubmitted: boolean;
  withdrawalStatusChange: boolean;
  investmentApplicationSubmitted: boolean;
  investmentApplicationStatusChange: boolean;
  investmentPurchase: boolean;
  investmentMatured: boolean;
  balanceAdjustment: boolean;
  adminNotifications: boolean;
}

export default function AdminEmailSettingsPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirmDialog();
  const [globalSettings, setGlobalSettings] = useState<EmailNotificationSettings | null>(null);
  const [userSettings, setUserSettings] = useState<EmailNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'global' | 'user'>('global');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const [globalResponse, userResponse] = await Promise.all([
        api.emailSettings.getGlobalSettings(),
        api.emailSettings.getSettings(),
      ]);
      setGlobalSettings(globalResponse.data.data);
      setUserSettings(userResponse.data.data);
    } catch (err: any) {
      console.error('Failed to fetch email settings:', err);
      setError(err.response?.data?.message || 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobal = async () => {
    if (!globalSettings) return;

    try {
      setSaving(true);
      setError('');
      await api.emailSettings.updateGlobalSettings(globalSettings);
      confirmDialog.confirm(
        'Success',
        'Global email settings updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to save global settings:', err);
      setError(err.response?.data?.message || 'Failed to save global email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userSettings) return;

    try {
      setSaving(true);
      setError('');
      await api.emailSettings.updateSettings(userSettings);
      confirmDialog.confirm(
        'Success',
        'Your email settings updated successfully',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
    } catch (err: any) {
      console.error('Failed to save user settings:', err);
      setError(err.response?.data?.message || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingsForm = (settings: EmailNotificationSettings | null, isGlobal: boolean) => {
    if (!settings) return null;

    const updateSetting = (key: keyof EmailNotificationSettings, value: boolean) => {
      if (isGlobal) {
        setGlobalSettings({ ...globalSettings!, [key]: value });
      } else {
        setUserSettings({ ...userSettings!, [key]: value });
      }
    };

    return (
      <div className="space-y-6">
        {/* Account Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Account Notifications</CardTitle>
            <CardDescription>Notifications related to account management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="accountCreated">Account Created</Label>
                <p className="text-sm text-gray-500">When a new account is created</p>
              </div>
              <Switch
                id="accountCreated"
                checked={settings.accountCreated}
                onCheckedChange={(checked) => updateSetting('accountCreated', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="accountLocked">Account Locked</Label>
                <p className="text-sm text-gray-500">When an account is locked due to security</p>
              </div>
              <Switch
                id="accountLocked"
                checked={settings.accountLocked}
                onCheckedChange={(checked) => updateSetting('accountLocked', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="accountUnlocked">Account Unlocked</Label>
                <p className="text-sm text-gray-500">When an account is unlocked</p>
              </div>
              <Switch
                id="accountUnlocked"
                checked={settings.accountUnlocked}
                onCheckedChange={(checked) => updateSetting('accountUnlocked', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC & Documents */}
        <Card>
          <CardHeader>
            <CardTitle>KYC & Documents</CardTitle>
            <CardDescription>Notifications for KYC and document status changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="kycStatusChange">KYC Status Change</Label>
                <p className="text-sm text-gray-500">When KYC status is updated</p>
              </div>
              <Switch
                id="kycStatusChange"
                checked={settings.kycStatusChange}
                onCheckedChange={(checked) => updateSetting('kycStatusChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="documentStatusChange">Document Status Change</Label>
                <p className="text-sm text-gray-500">When document status is verified or rejected</p>
              </div>
              <Switch
                id="documentStatusChange"
                checked={settings.documentStatusChange}
                onCheckedChange={(checked) => updateSetting('documentStatusChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="documentUploaded">Document Uploaded</Label>
                <p className="text-sm text-gray-500">When a document is uploaded by admin</p>
              </div>
              <Switch
                id="documentUploaded"
                checked={settings.documentUploaded}
                onCheckedChange={(checked) => updateSetting('documentUploaded', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Notifications for deposits and withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="depositSubmitted">Deposit Submitted</Label>
                <p className="text-sm text-gray-500">When a deposit request is submitted</p>
              </div>
              <Switch
                id="depositSubmitted"
                checked={settings.depositSubmitted}
                onCheckedChange={(checked) => updateSetting('depositSubmitted', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="depositStatusChange">Deposit Status Change</Label>
                <p className="text-sm text-gray-500">When deposit is approved or rejected</p>
              </div>
              <Switch
                id="depositStatusChange"
                checked={settings.depositStatusChange}
                onCheckedChange={(checked) => updateSetting('depositStatusChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="withdrawalSubmitted">Withdrawal Submitted</Label>
                <p className="text-sm text-gray-500">When a withdrawal request is submitted</p>
              </div>
              <Switch
                id="withdrawalSubmitted"
                checked={settings.withdrawalSubmitted}
                onCheckedChange={(checked) => updateSetting('withdrawalSubmitted', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="withdrawalStatusChange">Withdrawal Status Change</Label>
                <p className="text-sm text-gray-500">When withdrawal is approved or rejected</p>
              </div>
              <Switch
                id="withdrawalStatusChange"
                checked={settings.withdrawalStatusChange}
                onCheckedChange={(checked) => updateSetting('withdrawalStatusChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="balanceAdjustment">Balance Adjustment</Label>
                <p className="text-sm text-gray-500">When admin adjusts account balance</p>
              </div>
              <Switch
                id="balanceAdjustment"
                checked={settings.balanceAdjustment}
                onCheckedChange={(checked) => updateSetting('balanceAdjustment', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investments */}
        <Card>
          <CardHeader>
            <CardTitle>Investments</CardTitle>
            <CardDescription>Notifications for investment activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="investmentApplicationSubmitted">Application Submitted</Label>
                <p className="text-sm text-gray-500">When an investment enrollment is submitted</p>
              </div>
              <Switch
                id="investmentApplicationSubmitted"
                checked={settings.investmentApplicationSubmitted}
                onCheckedChange={(checked) => updateSetting('investmentApplicationSubmitted', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="investmentApplicationStatusChange">Application Status Change</Label>
                <p className="text-sm text-gray-500">When application is approved, rejected, or allocated</p>
              </div>
              <Switch
                id="investmentApplicationStatusChange"
                checked={settings.investmentApplicationStatusChange}
                onCheckedChange={(checked) => updateSetting('investmentApplicationStatusChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="investmentPurchase">Investment Purchase</Label>
                <p className="text-sm text-gray-500">When an investment is purchased</p>
              </div>
              <Switch
                id="investmentPurchase"
                checked={settings.investmentPurchase}
                onCheckedChange={(checked) => updateSetting('investmentPurchase', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="investmentMatured">Investment Matured</Label>
                <p className="text-sm text-gray-500">When an investment reaches maturity</p>
              </div>
              <Switch
                id="investmentMatured"
                checked={settings.investmentMatured}
                onCheckedChange={(checked) => updateSetting('investmentMatured', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Notifications */}
        {user?.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Notifications</CardTitle>
              <CardDescription>Notifications for admin activities (admins only)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="adminNotifications">Admin Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications for new deposits, withdrawals, applications, etc.</p>
                </div>
                <Switch
                  id="adminNotifications"
                  checked={settings.adminNotifications}
                  onCheckedChange={(checked) => updateSetting('adminNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={isGlobal ? handleSaveGlobal : handleSaveUser}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Email Notification Settings</h1>
        </div>
        <p className="text-gray-600">
          Manage email notification preferences for the application
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('global')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'global'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Global Settings
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'user'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Settings
          </button>
        </nav>
      </div>

      {activeTab === 'global' && renderSettingsForm(globalSettings, true)}
      {activeTab === 'user' && renderSettingsForm(userSettings, false)}
    </div>
  );
}

