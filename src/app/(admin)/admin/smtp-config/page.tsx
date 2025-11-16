'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmDialog } from '@/components/composite/ConfirmDialog';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, XCircle, Send } from 'lucide-react';

interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from?: string;
  senderName?: string;
  isActive?: boolean;
}

interface TestEmailData {
  testEmail?: string;
}

export default function SMTPConfigPage() {
  const { user } = useAuth();
  const confirmDialog = useConfirmDialog();
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 465,
    secure: true,
    user: '',
    password: '',
    from: '',
    senderName: 'Fidelity Investment Portal',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState<string>('');
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.smtpConfig.getConfig();
      if (response.data.data) {
        setConfig({
          ...response.data.data,
          password: '', // Don't show existing password
          senderName: response.data.data.senderName || 'Fidelity Investment Portal',
        });
        setHasExistingConfig(true);
      } else {
        setHasExistingConfig(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch SMTP config:', err);
      // It's okay if no config exists yet
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load SMTP configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SMTPConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
    setTestResult(null);
  };

  const handleTest = async () => {
    // Check required fields - password is only required if not using existing config
    if (!config.host || !config.user) {
      setError('Please fill in SMTP Host and Email/Username before testing');
      return;
    }

    // If we have existing config, password might be empty (we'll use saved password on backend)
    // If we don't have existing config, password is required
    if (!hasExistingConfig && !config.password) {
      setError('Please enter the password before testing');
      return;
    }

    try {
      setTesting(true);
      setError('');
      setTestResult(null);
      const response = await api.smtpConfig.testConfig({
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        password: config.password || undefined, // Send undefined if empty (backend will use saved)
        from: config.from,
        testEmail: testEmail || undefined, // Include test email if provided
      });
      setTestResult({
        success: response.data.success,
        message: response.data.message,
      });
      if (response.data.success) {
        setSuccess(response.data.message || 'SMTP configuration test successful!');
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      console.error('Failed to test SMTP config:', err);
      
      // Handle timeout errors specifically
      let errorMessage = 'Failed to test SMTP configuration';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The email may have been sent successfully, but the server took too long to respond. Please check your inbox. If you received the email, your SMTP configuration is working correctly!';
        // Treat timeout as potential success if email might have been sent
        setTestResult({
          success: true,
          message: errorMessage,
        });
        setSuccess(errorMessage);
      } else {
        errorMessage = err.response?.data?.message || err.message || 'Failed to test SMTP configuration';
        setTestResult({
          success: false,
          message: errorMessage,
        });
        setError(errorMessage);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.host || !config.user || !config.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.smtpConfig.updateConfig(config);
      setSuccess('SMTP configuration saved successfully');
      confirmDialog.confirm(
        'Success',
        'SMTP configuration has been updated successfully. The new settings will be used for all outgoing emails.',
        () => {},
        'success',
        false,
        false,
        'OK'
      );
      // Refresh config to get the updated version
      await fetchConfig();
    } catch (err: any) {
      console.error('Failed to save SMTP config:', err);
      setError(err.response?.data?.message || 'Failed to save SMTP configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SMTP Configuration</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure your email server settings for sending emails from the application.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {testResult && (
        <Alert className={testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Server Settings
          </CardTitle>
          <CardDescription>
            Enter your SMTP server details. Common settings:
          </CardDescription>
          <div className="mt-2">
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
              <li>Gmail: smtp.gmail.com, Port 587 (STARTTLS) or 465 (SSL)</li>
              <li>Hostinger: smtp.hostinger.com, Port 465 (SSL) or Port 587 (STARTTLS)</li>
              <li>Outlook: smtp-mail.outlook.com, Port 587 (STARTTLS)</li>
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Troubleshooting Timeout Issues:</p>
              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                <li>If port 465 times out, try port 587 with STARTTLS (disable SSL/TLS toggle)</li>
                <li>Check if your firewall or network is blocking SMTP connections</li>
                <li>Verify the SMTP server is accessible from your network</li>
                <li>Some Hostinger accounts may require enabling SMTP in your hosting control panel</li>
              </ul>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="host">
                SMTP Host <span className="text-red-500">*</span>
              </Label>
              <Input
                id="host"
                type="text"
                placeholder="smtp.hostinger.com"
                value={config.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
              />
              <p className="text-xs text-gray-500">Your SMTP server hostname</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">
                SMTP Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="port"
                type="number"
                placeholder="465"
                value={config.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 465)}
              />
              <p className="text-xs text-gray-500">Common ports: 465 (SSL), 587 (STARTTLS), 25</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">
                Email / Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user"
                type="email"
                placeholder="your-email@example.com"
                value={config.user}
                onChange={(e) => handleInputChange('user', e.target.value)}
              />
              <p className="text-xs text-gray-500">Your email address or SMTP username</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <p className="text-xs text-gray-500">Your email account password or app-specific password</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">From Email Address (Optional)</Label>
              <Input
                id="from"
                type="email"
                placeholder="noreply@example.com"
                value={config.from || ''}
                onChange={(e) => handleInputChange('from', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Default sender address (if different from username). Leave empty to use username.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name (Optional)</Label>
              <Input
                id="senderName"
                type="text"
                placeholder="Fidelity Investment Portal"
                value={config.senderName || 'Fidelity Investment Portal'}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Display name shown in email header. Defaults to "Fidelity Investment Portal" if left empty.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secure">Encryption</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="secure"
                  checked={config.secure}
                  onCheckedChange={(checked) => handleInputChange('secure', checked)}
                />
                <Label htmlFor="secure" className="cursor-pointer">
                  {config.secure ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                Enable for SSL/TLS (port 465), disable for STARTTLS (port 587)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Switch
              id="isActive"
              checked={config.isActive ?? true}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active Configuration
            </Label>
            <p className="text-xs text-gray-500 ml-2">
              Only active configurations are used for sending emails
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address (Optional)</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter an email address to send a test email. If left empty, only the connection will be tested.
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleTest}
                disabled={testing || saving}
                variant="outline"
                className="flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || testing}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables (Fallback)</CardTitle>
          <CardDescription>
            If no database configuration is set, the system will use these environment variables as a fallback:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div>SMTP_HOST=smtp.gmail.com</div>
            <div>SMTP_PORT=587</div>
            <div>SMTP_SECURE=false</div>
            <div>SMTP_USER=your-email@gmail.com</div>
            <div>SMTP_PASS=your-password</div>
            <div>SMTP_FROM=noreply@example.com</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

