'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, Phone, MapPin, Clock, Globe } from 'lucide-react';

interface SupportItem {
  key: string;
  label: string;
  value: string;
}

export default function SupportPage() {
  const [supportItems, setSupportItems] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSupportInfo();
  }, []);

  const fetchSupportInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.support.getInfo();
      // API returns { formatted: {...}, ordered: [...] }
      const data = response.data.data || response.data;
      // Use the ordered array which has label and value
      setSupportItems(data.ordered || []);
    } catch (err: any) {
      console.error('Failed to fetch support information:', err);
      setError(err.response?.data?.message || 'Failed to load support information');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (key: string, label: string) => {
    const searchText = `${key} ${label}`.toLowerCase();
    if (searchText.includes('email') || searchText.includes('mail')) {
      return <Mail className="h-5 w-5" />;
    }
    if (searchText.includes('phone') || searchText.includes('tel') || searchText.includes('call')) {
      return <Phone className="h-5 w-5" />;
    }
    if (searchText.includes('address') || searchText.includes('location') || searchText.includes('office')) {
      return <MapPin className="h-5 w-5" />;
    }
    if (searchText.includes('hours') || searchText.includes('time') || searchText.includes('schedule')) {
      return <Clock className="h-5 w-5" />;
    }
    if (searchText.includes('website') || searchText.includes('url') || searchText.includes('web')) {
      return <Globe className="h-5 w-5" />;
    }
    return <HelpCircle className="h-5 w-5" />;
  };

  const formatValue = (key: string, value: any) => {
    // Convert value to string if it's not already
    const stringValue = value != null ? String(value) : '';
    
    if (!stringValue) {
      return 'N/A';
    }
    
    // If it's a URL, make it clickable
    if (stringValue.startsWith('http://') || stringValue.startsWith('https://')) {
      return (
        <a
          href={stringValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {stringValue}
        </a>
      );
    }
    // If it's an email, make it clickable
    if (stringValue.includes('@') && !stringValue.includes(' ')) {
      return (
        <a
          href={`mailto:${stringValue}`}
          className="text-primary hover:underline"
        >
          {stringValue}
        </a>
      );
    }
    // If it's a phone number, make it clickable
    if (/^[\d\s\+\-\(\)]+$/.test(stringValue.replace(/\s/g, ''))) {
      return (
        <a
          href={`tel:${stringValue.replace(/\s/g, '')}`}
          className="text-primary hover:underline"
        >
          {stringValue}
        </a>
      );
    }
    return stringValue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-2">Loading support information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600 mt-2">
          Get in touch with our support team for assistance
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {supportItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No support information available at this time.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please contact your administrator or use the "Report a Problem" button for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportItems.map((item) => (
            <Card key={item.key} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-primary">
                    {getIcon(item.key, item.label)}
                  </span>
                  <span>
                    {item.label}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-base">
                  {formatValue(item.key, item.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Need More Help?
          </CardTitle>
          <CardDescription>
            If you need additional assistance, you can report a problem using the floating button on any page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
