'use client';

/**
 * Authenticated Application Layout
 * 
 * Main layout wrapper for authenticated pages.
 * Provides:
 * - Responsive sidebar navigation
 * - Mobile header with menu toggle
 * - User menu
 * - Main content area
 * 
 * This is a client component because it manages sidebar state.
 * The content (children) can still be server components.
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        navigation={navigation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Menu toggle */}
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
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
            
            {/* Logo */}
            <span className="text-lg font-bold text-gray-900">EduSphere AI</span>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu profile={profile} />
            </div>
          </div>
        </header>
        
        {/* Desktop header */}
        <header className="hidden lg:block sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-end h-16 px-6 gap-4">
            <NotificationBell />
            <UserMenu profile={profile} />
          </div>
        </header>
        
        {/* Main content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
