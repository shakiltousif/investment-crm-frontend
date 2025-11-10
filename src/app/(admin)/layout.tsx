'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (isLoading) {
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token || !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has admin role
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if not authenticated or not admin (while redirecting)
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/admin" className="flex items-center ml-4 md:ml-0">
                <Image
                  src="/logo.jpeg"
                  alt="FIL LIMITED"
                  width={40}
                  height={40}
                  className="object-contain rounded mr-2"
                />
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
              <Link
                href="/dashboard"
                className="text-sm text-primary hover:text-primary/80"
              >
                Client View
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-secondary hover:text-secondary/80 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-primary text-white p-6 overflow-y-auto transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <nav className="space-y-1">
          <Link
            href="/admin"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Users
          </Link>
          <Link
            href="/admin/deposits"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Pending Deposits
          </Link>
          <Link
            href="/admin/withdrawals"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Pending Withdrawals
          </Link>
          <Link
            href="/admin/transactions"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            All Transactions
          </Link>
          <Link
            href="/admin/support"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Support Settings
          </Link>
          <Link
            href="/admin/investment-products"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Investment Products
          </Link>
          <Link
            href="/admin/profile"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Profile Settings
          </Link>
        </nav>

        <div className="mt-8 pt-8 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-secondary rounded-lg hover:bg-secondary/90 transition-colors text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-primary text-white p-4 z-40 shadow-lg">
          <div className="mb-4 flex justify-center">
            <Image
              src="/logo.jpeg"
              alt="FIL LIMITED"
              width={50}
              height={50}
              className="object-contain"
            />
          </div>
          <nav className="space-y-1">
            <Link 
              href="/admin" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/users" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Users
            </Link>
            <Link 
              href="/admin/deposits" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Pending Deposits
            </Link>
            <Link 
              href="/admin/withdrawals" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Pending Withdrawals
            </Link>
            <Link 
              href="/admin/transactions" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              All Transactions
            </Link>
            <Link 
              href="/admin/support" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Support Settings
            </Link>
            <Link 
              href="/admin/investment-products" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Investment Products
            </Link>
            <Link 
              href="/admin/profile" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Profile Settings
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-4 py-2.5 rounded-lg hover:bg-primary/80"
              onClick={() => setMenuOpen(false)}
            >
              Client View
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full px-4 py-2.5 bg-secondary rounded-lg hover:bg-secondary/90 text-left mt-4"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

