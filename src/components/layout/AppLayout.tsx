'use client';

/**
 * Authenticated Application Layout
 * 
 * Main layout wrapper for authenticated pages with proper side drawer navigation.
 * Provides:
 * - Fixed sidebar navigation (desktop)
 * - Slide-in drawer navigation (mobile)
 * - Professional header with notifications
 * - User menu
 * - Main content area with proper spacing
 */

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import type { UserProfile } from '@/lib/auth/session';
import type { NavigationItem } from '@/lib/auth/capabilities';

interface AppLayoutProps {
  children: React.ReactNode;
  profile: UserProfile;
  navigation: NavigationItem[];
}

export function AppLayout({ children, profile, navigation }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar - Fixed on desktop, drawer on mobile */}
      <Sidebar
        navigation={navigation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main content area with left margin for sidebar on desktop */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-edu">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:text-primary-900 hover:bg-neutral-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
            {/* Logo on mobile */}
            <div className="lg:hidden">
              <span className="text-xl font-display font-bold text-primary-900">
                EduSphere AI
              </span>
            </div>
            
            {/* Page title area (desktop) */}
            <div className="hidden lg:block">
              {/* This can be enhanced with dynamic page titles */}
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="h-8 w-px bg-neutral-300 hidden lg:block" />
              <UserMenu profile={profile} />
            </div>
          </div>
        </header>
        
        {/* Main content with proper padding */}
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
            <p className="text-sm text-neutral-600 text-center">
              © {new Date().getFullYear()} EduSphere AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

