'use client';

import { useState } from 'react';
import axios from 'axios';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TwoFactorSetup({ onSuccess, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'start' | 'scan' | 'verify' | 'backup' | 'complete'>('start');
  const [secret, setSecret] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  const handleGenerateSecret = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/setup`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      setSecret(response.data.data.secret);
      setQrCode(response.data.data.qrCode);
      setBackupCodes(response.data.data.backupCodes);
      setStep('scan');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate secret');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/2fa/enable`,
        {
          secret,
          backupCodes,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
  };

  const handleComplete = () => {
    setStep('complete');
    setTimeout(() => {
      onSuccess?.();
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Set Up Two-Factor Authentication</h2>

      {step === 'start' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              Two-factor authentication adds an extra layer of security to your account. You'll need
              to enter a code from your authenticator app in addition to your password when logging
              in.
            </p>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateSecret}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Get Started'}
            </button>
          </div>
        </div>
      )}

      {step === 'scan' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Step 1: Scan QR Code</p>
            <p className="text-sm text-gray-700">
              Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) to
              scan this QR code:
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-xs text-gray-600 mb-2">QR Code</p>
            <p className="text-xs font-mono break-all">{qrCode}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Or enter manually:</p>
            <p className="text-sm font-mono bg-white p-2 rounded border">{secret}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Step 2: Enter Code</p>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border rounded-lg text-center text-2xl tracking-widest"
            />
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('start')}
              className="flex-1 px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length < 6}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Save Backup Codes</p>
            <p className="text-sm text-red-600">
              Save these backup codes in a safe place. You can use them to access your account if
              you lose access to your authenticator app.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm bg-white p-2 rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCopyBackupCodes}
            className={`w-full px-4 py-2 rounded-lg transition ${
              backupCodesCopied
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {backupCodesCopied ? '✓ Copied' : 'Copy Codes'}
          </button>

          <button
            onClick={handleComplete}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            I've Saved My Codes
          </button>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg font-semibold text-green-600">2FA Enabled!</p>
          <p className="text-gray-600 mt-2">Your account is now more secure.</p>
          <p className="text-sm text-gray-500 mt-4">You'll be asked for a code on your next login.</p>
        </div>
      )}
    </div>
  );
}

