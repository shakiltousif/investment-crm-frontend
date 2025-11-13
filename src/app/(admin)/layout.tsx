'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Briefcase,
  Store,
  FolderOpen,
  ArrowDownCircle,
  CreditCard,
  ArrowUpCircle,
  ArrowLeftRight,
  Settings,
  Mail,
  Package,
  User,
  LogOut,
  AlertCircle,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close user menu when sidebar menu opens
  useEffect(() => {
    if (menuOpen) {
      setUserMenuOpen(false);
    }
  }, [menuOpen]);

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
    // Only redirect if we're sure the user is not an admin (not just undefined)
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user?.role, router]);

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
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Toggle menu"
              >
                <svg 
                  className={`h-6 w-6 transition-transform duration-200 ${menuOpen ? 'rotate-90' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <Link 
                href="/admin" 
                className="flex items-center ml-2 md:ml-0 min-w-0 flex-1"
                onClick={() => setMenuOpen(false)}
              >
                <Image
                  src="/logo.jpeg"
                  alt="FIL LIMITED"
                  width={36}
                  height={36}
                  className="object-contain rounded flex-shrink-0 sm:mr-2"
                  unoptimized
                />
                <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">Admin Panel</span>
              </Link>
            </div>
            
            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <NotificationBell />
              <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
              <Link
                href="/dashboard"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Client View
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-secondary hover:text-secondary/80 font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile User Menu */}
            <div className="md:hidden flex items-center gap-2">
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label="User menu"
                >
                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
              
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Client View
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-secondary hover:bg-gray-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-primary text-white p-6 overflow-y-auto transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <nav className="space-y-2">
          {/* Main Section */}
          <div className="space-y-1">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`h-5 w-5 ${pathname === '/admin' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          {/* User Management Section */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">User Management</p>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/users'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className={`h-5 w-5 ${pathname === '/admin/users' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Users</span>
            </Link>
            <Link
              href="/admin/user-investments"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/user-investments'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <TrendingUp className={`h-5 w-5 ${pathname === '/admin/user-investments' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>User Investments</span>
            </Link>
            <Link
              href="/admin/portfolios"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/portfolios'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Briefcase className={`h-5 w-5 ${pathname === '/admin/portfolios' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Portfolio Management</span>
            </Link>
            <Link
              href="/admin/documents"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/documents'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FolderOpen className={`h-5 w-5 ${pathname === '/admin/documents' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Document Management</span>
            </Link>
            <Link
              href="/admin/bank-accounts"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/bank-accounts'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CreditCard className={`h-5 w-5 ${pathname === '/admin/bank-accounts' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Bank Account Management</span>
            </Link>
            <Link
              href="/admin/problem-reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/problem-reports'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <AlertCircle className={`h-5 w-5 ${pathname === '/admin/problem-reports' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Problem Reports</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          {/* Financial Management Section */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">Financial</p>
            <Link
              href="/admin/deposits"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/deposits'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ArrowDownCircle className={`h-5 w-5 ${pathname === '/admin/deposits' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Pending Deposits</span>
            </Link>
            <Link
              href="/admin/withdrawals"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/withdrawals'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ArrowUpCircle className={`h-5 w-5 ${pathname === '/admin/withdrawals' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Pending Withdrawals</span>
            </Link>
            <Link
              href="/admin/transactions"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/transactions'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ArrowLeftRight className={`h-5 w-5 ${pathname === '/admin/transactions' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>All Transactions</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          {/* Product & Settings Section */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">Products & Settings</p>
            <Link
              href="/admin/marketplace"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/marketplace'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Store className={`h-5 w-5 ${pathname === '/admin/marketplace' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Marketplace</span>
            </Link>
            <Link
              href="/admin/investment-products"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/investment-products'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Package className={`h-5 w-5 ${pathname === '/admin/investment-products' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Investment Products</span>
            </Link>
            <Link
              href="/admin/support"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/support'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className={`h-5 w-5 ${pathname === '/admin/support' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Support Settings</span>
            </Link>
            <Link
              href="/admin/notification-settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/notification-settings'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Mail className={`h-5 w-5 ${pathname === '/admin/notification-settings' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Notification Settings</span>
            </Link>
            <Link
              href="/admin/smtp-config"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/smtp-config'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Mail className={`h-5 w-5 ${pathname === '/admin/smtp-config' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>SMTP Configuration</span>
            </Link>
            <Link
              href="/admin/profile"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/admin/profile'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className={`h-5 w-5 ${pathname === '/admin/profile' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Profile Settings</span>
            </Link>
          </div>
        </nav>

        <div className="mt-8 pt-8 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/90 hover:bg-secondary rounded-xl transition-all duration-200 text-white font-medium group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span>Logout</span>
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
              unoptimized
            />
          </div>
          <nav className="space-y-2">
            <Link 
              href="/admin" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/admin/users" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/users'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
            <Link 
              href="/admin/user-investments" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/user-investments'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <TrendingUp className="h-5 w-5" />
              <span>User Investments</span>
            </Link>
            <Link 
              href="/admin/portfolios" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/portfolios'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Briefcase className="h-5 w-5" />
              <span>Portfolio Management</span>
            </Link>
            <Link 
              href="/admin/marketplace" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/marketplace'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Store className="h-5 w-5" />
              <span>Marketplace</span>
            </Link>
            <Link 
              href="/admin/documents" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/documents'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <FolderOpen className="h-5 w-5" />
              <span>Document Management</span>
            </Link>
            <Link 
              href="/admin/bank-accounts" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/bank-accounts'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <CreditCard className="h-5 w-5" />
              <span>Bank Account Management</span>
            </Link>
            <Link 
              href="/admin/problem-reports" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/problem-reports'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <AlertCircle className="h-5 w-5" />
              <span>Problem Reports</span>
            </Link>
            <Link 
              href="/admin/deposits" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/deposits'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <ArrowDownCircle className="h-5 w-5" />
              <span>Pending Deposits</span>
            </Link>
            <Link 
              href="/admin/withdrawals" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/withdrawals'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <ArrowUpCircle className="h-5 w-5" />
              <span>Pending Withdrawals</span>
            </Link>
            <Link 
              href="/admin/transactions" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/transactions'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <ArrowLeftRight className="h-5 w-5" />
              <span>All Transactions</span>
            </Link>
            <Link 
              href="/admin/support" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/support'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="h-5 w-5" />
              <span>Support Settings</span>
            </Link>
            <Link 
              href="/admin/notification-settings" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/notification-settings'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Mail className="h-5 w-5" />
              <span>Notification Settings</span>
            </Link>
            <Link 
              href="/admin/smtp-config" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/smtp-config'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Mail className="h-5 w-5" />
              <span>SMTP Configuration</span>
            </Link>
            <Link 
              href="/admin/investment-products" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/investment-products'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Package className="h-5 w-5" />
              <span>Investment Products</span>
            </Link>
            <Link 
              href="/admin/profile" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/admin/profile'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>Profile Settings</span>
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition-all duration-200"
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Client View</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/90 hover:bg-secondary rounded-xl transition-all duration-200 text-white font-medium mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}
      </div>
    </NotificationProvider>
  );
}

