'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import TwoFactorSetup from '@/components/TwoFactorSetup';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  lastPasswordChange?: string;
  loginAttempts: number;
  lastLoginAt?: string;
  accountLocked: boolean;
  lockedUntil?: string;
}

export default function SecuritySettingsPage() {
  const { user, updateUser } = useAuth();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchSecuritySettings();
    }
  }, [user]);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.users.getSecuritySettings();
      setSecuritySettings(response.data);
    } catch (err: any) {
      console.error('Security settings fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      await api.users.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      await fetchSecuritySettings();
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleTwoFactorToggle = async () => {
    try {
      if (securitySettings?.twoFactorEnabled) {
        await api.twoFactor.disable({});
        setPasswordSuccess('Two-factor authentication disabled');
      } else {
        setShowTwoFactorSetup(true);
      }
      await fetchSecuritySettings();
    } catch (err: any) {
      console.error('2FA toggle error:', err);
      setError(err.response?.data?.message || 'Failed to toggle two-factor authentication');
    }
  };

  const handleTwoFactorSetupSuccess = () => {
    setShowTwoFactorSetup(false);
    setPasswordSuccess('Two-factor authentication enabled successfully');
    fetchSecuritySettings();
  };

  const handleTwoFactorSetupCancel = () => {
    setShowTwoFactorSetup(false);
  };

  const downloadBackupCodes = () => {
    if (!securitySettings?.backupCodes) return;

    const codesContent = securitySettings.backupCodes.join('\n');
    const blob = new Blob([codesContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account security and authentication settings
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchSecuritySettings}
            className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
          >
            Retry
          </button>
        </div>
      )}

      {passwordSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <p className="text-green-700">{passwordSuccess}</p>
        </div>
      )}

      {securitySettings && (
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Status:</span>
                <span className={`font-medium ${securitySettings.accountLocked ? 'text-secondary' : 'text-green-600'}`}>
                  {securitySettings.accountLocked ? 'Locked' : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Login Attempts:</span>
                <span className="font-medium">{securitySettings.loginAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span className="font-medium">
                  {securitySettings.lastLoginAt 
                    ? new Date(securitySettings.lastLoginAt).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Password Change:</span>
                <span className="font-medium">
                  {securitySettings.lastPasswordChange 
                    ? new Date(securitySettings.lastPasswordChange).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Two-Factor Authentication</h2>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-600">
                  {securitySettings.twoFactorEnabled 
                    ? 'Two-factor authentication is enabled' 
                    : 'Two-factor authentication is disabled'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              <button
                onClick={handleTwoFactorToggle}
                className={`px-4 py-2 rounded-lg transition ${
                  securitySettings.twoFactorEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>

            {securitySettings.twoFactorEnabled && securitySettings.backupCodes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Backup Codes</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {securitySettings.backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 rounded border text-sm font-mono">
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  onClick={downloadBackupCodes}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Download Codes
                </button>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{passwordError}</p>
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Security Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Security Tips</h2>
            <ul className="space-y-2 text-blue-800">
              <li>• Use a strong, unique password for your account</li>
              <li>• Enable two-factor authentication for added security</li>
              <li>• Keep your backup codes in a safe place</li>
              <li>• Never share your login credentials with anyone</li>
              <li>• Log out from shared or public computers</li>
              <li>• Regularly review your account activity</li>
            </ul>
          </div>
        </div>
      )}

      {/* Two-Factor Setup Modal */}
      {showTwoFactorSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <TwoFactorSetup
              onSuccess={handleTwoFactorSetupSuccess}
              onCancel={handleTwoFactorSetupCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
