'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 text-white p-6 overflow-y-auto hidden md:block">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Investment CRM</h1>
        </div>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/portfolio"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Portfolio
          </Link>
          <Link
            href="/investments"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Investments
          </Link>
          <Link
            href="/transactions"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Transactions
          </Link>
          <Link
            href="/bank-accounts"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Bank Accounts
          </Link>
          <Link
            href="/profile"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Profile
          </Link>
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white p-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold">Investment CRM</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-gray-900 text-white p-4 z-40">
          <nav className="space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-800">
              Dashboard
            </Link>
            <Link href="/portfolio" className="block px-4 py-2 rounded-lg hover:bg-gray-800">
              Portfolio
            </Link>
            <Link href="/investments" className="block px-4 py-2 rounded-lg hover:bg-gray-800">
              Investments
            </Link>
            <Link href="/transactions" className="block px-4 py-2 rounded-lg hover:bg-gray-800">
              Transactions
            </Link>
            <Link href="/bank-accounts" className="block px-4 py-2 rounded-lg hover:bg-gray-800">
              Bank Accounts
            </Link>
            <Link href="/profile" className="block px-4 py-2 rounded-lg hover:bg-gray-800">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-left mt-4"
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

