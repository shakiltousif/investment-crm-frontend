'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Eye, RefreshCw } from 'lucide-react';

interface EmailTemplate {
  type: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  cssStyles?: string;
  variables: Array<{
    name: string;
    description: string;
    required: boolean;
    example?: string;
  }>;
  isActive: boolean;
}

export default function EmailTemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as string;

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    htmlContent: '',
    cssStyles: '',
    isActive: true,
  });

  useEffect(() => {
    if (type) {
      loadTemplate();
    }
  }, [type]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.emailTemplates.getByType(type);
      const templateData = response.data.data;
      setTemplate(templateData);
      setFormData({
        name: templateData.name,
        description: templateData.description || '',
        subject: templateData.subject,
        htmlContent: templateData.htmlContent,
        cssStyles: templateData.cssStyles || '',
        isActive: templateData.isActive,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load email template');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await api.emailTemplates.update(type, formData);
      router.push('/admin/email-templates');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save email template');
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      setError('');
      setShowPreview(false);
      
      // Generate sample variables based on template variables
      const sampleVariables: Record<string, any> = {};
      template?.variables.forEach((variable) => {
        if (variable.example) {
          sampleVariables[variable.name] = variable.example;
        } else if (variable.name.includes('firstName')) {
          sampleVariables[variable.name] = 'John';
        } else if (variable.name.includes('email')) {
          sampleVariables[variable.name] = 'user@example.com';
        } else if (variable.name.includes('amount') || variable.name.includes('Amount')) {
          sampleVariables[variable.name] = '1,000.00';
        } else if (variable.name.includes('currency')) {
          sampleVariables[variable.name] = 'GBP';
        } else if (variable.name.includes('status')) {
          sampleVariables[variable.name] = 'COMPLETED';
        } else if (variable.name.includes('statusText')) {
          sampleVariables[variable.name] = 'Approved';
        } else if (variable.name.includes('statusClass')) {
          sampleVariables[variable.name] = 'completed';
        } else if (variable.name.includes('statusMessage')) {
          sampleVariables[variable.name] = 'Your request has been processed successfully.';
        } else if (variable.name.includes('statusTitle')) {
          sampleVariables[variable.name] = 'Request Approved';
        } else if (variable.name.includes('statusBgColor')) {
          sampleVariables[variable.name] = '#D1FAE5';
        } else if (variable.name.includes('statusColor')) {
          sampleVariables[variable.name] = '#065F46';
        } else if (variable.name.includes('Url') || variable.name.includes('url')) {
          sampleVariables[variable.name] = 'https://example.com';
        } else if (variable.name.includes('resetUrl')) {
          sampleVariables[variable.name] = 'https://example.com/reset-password?token=abc123';
        } else if (variable.name.includes('loginUrl')) {
          sampleVariables[variable.name] = 'https://example.com/login';
        } else if (variable.name.includes('reportUrl')) {
          sampleVariables[variable.name] = 'https://example.com/problem-reports';
        } else if (variable.name.includes('reportId')) {
          sampleVariables[variable.name] = 'RPT-12345';
        } else if (variable.name.includes('password')) {
          sampleVariables[variable.name] = 'TempPassword123!';
        } else if (variable.name.includes('temporaryPasswordWarning')) {
          sampleVariables[variable.name] = '<div class="warning"><p><strong>Important:</strong> This is a temporary password. Please change it after your first login.</p></div>';
        } else if (variable.name.includes('lockUntilText')) {
          sampleVariables[variable.name] = ' until 2025-12-31';
        } else if (variable.name.includes('adjustmentAmount')) {
          sampleVariables[variable.name] = '+GBP 500.00';
        } else if (variable.name.includes('adjustmentBgColor')) {
          sampleVariables[variable.name] = '#D1FAE5';
        } else if (variable.name.includes('adjustmentColor')) {
          sampleVariables[variable.name] = '#065F46';
        } else if (variable.name.includes('textColor')) {
          sampleVariables[variable.name] = '#065F46';
        } else if (variable.name.includes('allocatedAmountHtml')) {
          sampleVariables[variable.name] = '<p><strong>Allocated Amount:</strong> GBP 1,000.00</p>';
        } else if (variable.name.includes('allocatedQuantityHtml')) {
          sampleVariables[variable.name] = '<p><strong>Allocated Quantity:</strong> 100</p>';
        } else if (variable.name.includes('detailsHtml')) {
          sampleVariables[variable.name] = '<p><strong>User:</strong> John Doe</p><p><strong>Amount:</strong> GBP 1,000.00</p>';
        } else if (variable.name.includes('adminMessage')) {
          sampleVariables[variable.name] = 'Thank you for your report. We have reviewed your issue and will get back to you shortly.';
        } else if (variable.name.includes('userName')) {
          sampleVariables[variable.name] = 'John Doe';
        } else {
          sampleVariables[variable.name] = `Sample ${variable.name}`;
        }
      });

      const response = await api.emailTemplates.preview(type, sampleVariables);
      if (response.data?.data?.html) {
        setPreviewHtml(response.data.data.html);
        setShowPreview(true);
      } else {
        setError('Preview HTML is empty');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to preview email template';
      setError(errorMessage);
      console.error('Error previewing template:', err);
      setShowPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading email template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Email template not found</p>
          <Button onClick={() => router.push('/admin/email-templates')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/email-templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600 mt-1">Edit email template</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Edit the email template content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Template name cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  placeholder="Template description"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1"
                  placeholder="Email subject (use ${variableName} for variables)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use $&#123;variableName&#125; syntax for variables
                </p>
              </div>

              <div>
                <Label htmlFor="htmlContent">HTML Content</Label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  className="mt-1 font-mono text-sm"
                  rows={20}
                  placeholder="HTML content (use ${variableName} for variables)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use $&#123;variableName&#125; syntax for variables
                </p>
              </div>

              <div>
                <Label htmlFor="cssStyles">CSS Styles (Optional)</Label>
                <Textarea
                  id="cssStyles"
                  value={formData.cssStyles}
                  onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
                  className="mt-1 font-mono text-sm"
                  rows={10}
                  placeholder="Additional CSS styles"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>Variables you can use in this template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.variables.map((variable) => (
                  <div key={variable.name} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm font-semibold text-primary">
                        $&#123;{variable.name}&#125;
                      </code>
                      {variable.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{variable.description}</p>
                    {variable.example && (
                      <p className="text-xs text-gray-500 mt-1">
                        Example: {variable.example}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {showPreview && previewHtml && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Email preview with sample data</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full"
                    style={{ minHeight: '600px', border: 'none' }}
                    title="Email Preview"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

