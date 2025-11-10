'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Clock, MapPin, MessageCircle, HelpCircle } from 'lucide-react';

interface SupportInfo {
  formatted: Record<string, string>;
  ordered: Array<{
    key: string;
    label: string;
    value: string;
  }>;
}

const iconMap: Record<string, React.ReactNode> = {
  phone: <Phone className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  hours: <Clock className="h-5 w-5" />,
  address: <MapPin className="h-5 w-5" />,
  message: <MessageCircle className="h-5 w-5" />,
};

export default function SupportPage() {
  const { user } = useAuth();
  const [supportInfo, setSupportInfo] = useState<SupportInfo | null>(null);
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
      setSupportInfo(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch support info:', err);
      setError(err.response?.data?.message || 'Failed to load support information');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-secondary mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600 mt-2">
          Get in touch with our support team. We're here to help you with any questions or concerns.
        </p>
      </div>

      {supportInfo && supportInfo.ordered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportInfo.ordered.map((item) => {
            const icon = iconMap[item.key.toLowerCase()] || <HelpCircle className="h-5 w-5" />;
            
            return (
              <Card key={item.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-lg">{item.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Support information is not available at this time. Please contact your account manager.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Need Additional Help?</CardTitle>
          <CardDescription>
            If you need assistance with your account, investments, or have any other questions, please don't hesitate to reach out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Common Questions</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>How do I make a deposit?</li>
                <li>How do I request a withdrawal?</li>
                <li>How do I view my investment statements?</li>
                <li>How do I update my profile information?</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                For account-specific questions, please use the contact information above or reach out through your account manager.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


