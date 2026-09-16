'use client';

/**
 * User Menu Component
 * 
 * Dropdown menu for user actions:
 * - Profile
 * - Sign out
 * 
 * Future: Settings when implemented
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { UserProfile } from '@/lib/auth/session';

interface UserMenuProps {
  profile: UserProfile;
}

export function UserMenu({ profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isOpen]);
  
  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    
    return undefined;
  }, [isOpen]);
  
  const initials = profile.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        
        {/* User info (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {profile.display_name}
          </div>
          <div className="text-xs text-gray-500">{profile.role}</div>
        </div>
        
        {/* Dropdown icon */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info (mobile only) */}
          <div className="md:hidden px-4 py-3 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              {profile.display_name}
            </div>
            <div className="text-xs text-gray-500 mt-1">{profile.email}</div>
            <div className="text-xs text-gray-500 mt-1">
              {profile.role}
            </div>
          </div>
          
          {/* Profile link */}
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center">
              <span className="mr-3">👤</span>
              Profile
            </div>
          </Link>
          
          {/* Sign out link */}
          <Link
            href="/auth/sign-out"
            className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center">
              <span className="mr-3">🚪</span>
              Sign Out
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
