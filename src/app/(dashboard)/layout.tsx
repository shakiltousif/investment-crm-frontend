'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error attempting to exit fullscreen:', err);
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
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

        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors relative group"
          >
            <span className="flex items-center gap-3">
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Dashboard
            </span>
          </Link>
          <Link
            href="/portfolio"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Portfolio
          </Link>
          <Link
            href="/investments"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Investments
          </Link>
          <Link
            href="/transactions"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Transactions
          </Link>
          <Link
            href="/bank-accounts"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Bank Accounts
          </Link>
          <Link
            href="/profile"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/applications"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Applications
          </Link>
          <Link
            href="/reports"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Reports
          </Link>
          <Link
            href="/documents"
            className="block px-4 py-2.5 rounded-lg hover:bg-primary/80 transition-colors"
          >
            Documents
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
          <nav className="space-y-1">
            <Link href="/dashboard" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Dashboard
            </Link>
            <Link href="/portfolio" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Portfolio
            </Link>
            <Link href="/investments" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Investments
            </Link>
            <Link href="/transactions" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Transactions
            </Link>
            <Link href="/bank-accounts" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Bank Accounts
            </Link>
            <Link href="/profile" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Profile
            </Link>
            <Link href="/applications" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Applications
            </Link>
            <Link href="/reports" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Reports
            </Link>
            <Link href="/support" className="block px-4 py-2.5 rounded-lg hover:bg-primary/80">
              Support
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 bg-secondary rounded-lg hover:bg-secondary/90 text-left mt-4"
            >
              Logout
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
    </div>
  );
}

