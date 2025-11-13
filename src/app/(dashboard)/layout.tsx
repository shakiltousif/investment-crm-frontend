'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationBell from '@/components/NotificationBell';
import ReportProblemButton from '@/components/ReportProblemButton';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  ArrowLeftRight,
  CreditCard,
  User,
  FileText,
  BarChart3,
  FolderOpen,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen - try different browser APIs
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((err) => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      } else if ('webkitRequestFullscreen' in element && typeof (element as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen === 'function') {
        (element as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      } else if ('mozRequestFullScreen' in element && typeof (element as { mozRequestFullScreen?: () => void }).mozRequestFullScreen === 'function') {
        (element as { mozRequestFullScreen: () => void }).mozRequestFullScreen();
      } else if ('msRequestFullscreen' in element && typeof (element as { msRequestFullscreen?: () => void }).msRequestFullscreen === 'function') {
        (element as { msRequestFullscreen: () => void }).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      } else if ('webkitExitFullscreen' in document && typeof (document as { webkitExitFullscreen?: () => void }).webkitExitFullscreen === 'function') {
        (document as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      } else if ('mozCancelFullScreen' in document && typeof (document as { mozCancelFullScreen?: () => void }).mozCancelFullScreen === 'function') {
        (document as { mozCancelFullScreen: () => void }).mozCancelFullScreen();
      } else if ('msExitFullscreen' in document && typeof (document as { msExitFullscreen?: () => void }).msExitFullscreen === 'function') {
        (document as { msExitFullscreen: () => void }).msExitFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      {/* Note: This is the client dashboard - no "switch to admin" option should be shown here.
          Admins can access the admin panel directly via /admin route, but this client dashboard
          should remain clean without any admin-specific navigation options. */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 md:left-64 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-gray-700 hidden md:block">
            FIL LIMITED
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button 
            onClick={handleFullscreen}
            className={`text-gray-600 hover:text-gray-900 transition-colors ${isFullscreen ? 'text-primary' : ''}`}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              // Exit fullscreen icon (arrows pointing inward)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              // Enter fullscreen icon (arrows pointing outward)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          <Image
            src="/logo.jpeg"
            alt="FIL"
            width={40}
            height={40}
            className="object-contain rounded"
            priority
            unoptimized
          />
        </div>
      </header>

      {/* Sidebar - Dark blue inspired by FIL */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-primary text-white p-6 overflow-y-auto hidden md:block pt-24">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpeg"
              alt="FIL LIMITED"
              width={60}
              height={60}
              className="object-contain rounded"
              priority
              unoptimized
            />
          </div>
        </div>

        <nav className="space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/dashboard'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`h-5 w-5 ${pathname === '/dashboard' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Dashboard</span>
            </Link>
            
            <Link
              href="/portfolio"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/portfolio'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Briefcase className={`h-5 w-5 ${pathname === '/portfolio' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Portfolio</span>
            </Link>
            
            <Link
              href="/investments"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/investments'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <TrendingUp className={`h-5 w-5 ${pathname === '/investments' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Investments</span>
            </Link>
            
            <Link
              href="/transactions"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/transactions'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ArrowLeftRight className={`h-5 w-5 ${pathname === '/transactions' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Transactions</span>
            </Link>
            
            <Link
              href="/bank-accounts"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/bank-accounts'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CreditCard className={`h-5 w-5 ${pathname === '/bank-accounts' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Bank Accounts</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          {/* Secondary Navigation */}
          <div className="space-y-1">
            <Link
              href="/support"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/support'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <HelpCircle className={`h-5 w-5 ${pathname === '/support' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Support</span>
            </Link>
            
            <Link
              href="/profile"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/profile'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className={`h-5 w-5 ${pathname === '/profile' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Profile</span>
            </Link>
            
            <Link
              href="/applications"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/applications'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className={`h-5 w-5 ${pathname === '/applications' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Allocations</span>
            </Link>
            
            <Link
              href="/reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/reports'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BarChart3 className={`h-5 w-5 ${pathname === '/reports' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Reports</span>
            </Link>
            
            <Link
              href="/documents"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/documents'
                  ? 'bg-white text-primary font-semibold shadow-lg shadow-primary/20'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FolderOpen className={`h-5 w-5 ${pathname === '/documents' ? 'text-primary' : 'text-white/80 group-hover:text-white'}`} />
              <span>Documents</span>
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

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-primary text-white p-4 z-40 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
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
              href="/dashboard" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/dashboard'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/portfolio" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/portfolio'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Briefcase className="h-5 w-5" />
              <span>Portfolio</span>
            </Link>
            <Link 
              href="/investments" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/investments'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Investments</span>
            </Link>
            <Link 
              href="/transactions" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/transactions'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <ArrowLeftRight className="h-5 w-5" />
              <span>Transactions</span>
            </Link>
            <Link 
              href="/bank-accounts" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/bank-accounts'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <CreditCard className="h-5 w-5" />
              <span>Bank Accounts</span>
            </Link>
            <Link 
              href="/support" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/support'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Support</span>
            </Link>
            <Link 
              href="/profile" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/profile'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <Link 
              href="/applications" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/applications'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <FileText className="h-5 w-5" />
              <span>Allocations</span>
            </Link>
            <Link 
              href="/reports" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/reports'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Reports</span>
            </Link>
            <Link 
              href="/documents" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/documents'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <FolderOpen className="h-5 w-5" />
              <span>Documents</span>
            </Link>
            <Link 
              href="/support" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/support'
                  ? 'bg-white text-primary font-semibold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Support</span>
            </Link>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/90 hover:bg-secondary rounded-xl transition-all duration-200 text-white font-medium mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 pt-16 md:pt-16 bg-white">
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Floating Report Problem Button */}
      <ReportProblemButton />
      </div>
    </NotificationProvider>
  );
}

