'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/errorHandling';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameNext = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    
    if (email.trim().length === 0) {
      setError('Please enter your username');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Get user profile to check role and redirect accordingly
      try {
        const profileResponse = await api.users.getProfile();
        const userRole = profileResponse.data.data?.role || 'CLIENT';
        if (userRole === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } catch (profileError) {
        // If profile fetch fails, try to use role from login response
        // Fallback to dashboard
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Extract error message safely using utility function
      const errorMessage = extractErrorMessage(err, 'Login failed. Please check your credentials.');
      setError(errorMessage);
      // Clear password on error for security, but keep email and stay on password step
      setPassword('');
      // Ensure we stay on password step - don't reset to username step
      // Don't redirect or reload - just show the error
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('username');
    setPassword('');
    setError('');
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {step === 'username' ? (
        <form onSubmit={handleUsernameNext} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || email.trim().length === 0}
            className="w-full bg-primary text-white py-2.5 rounded-md font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {email}
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="mt-2 text-sm text-primary hover:text-primary/80 underline"
            >
              Change username
            </button>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || password.trim().length === 0}
            className="w-full bg-primary text-white py-2.5 rounded-md font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center space-y-2">
        <Link href="/forgot-password" className="block text-sm text-primary hover:text-primary/80 underline">
          Forgotten username?
        </Link>
        <Link href="/register" className="block text-sm text-primary hover:text-primary/80 underline">
          Register for online access
        </Link>
      </div>
    </div>
  );
}

