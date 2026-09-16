'use client';

/**
 * Sidebar Navigation Component
 * 
 * Professional side drawer navigation with education theme.
 * 
 * Features:
 * - Desktop: Fixed sidebar with gradient background
 * - Mobile: Slide-in drawer with backdrop overlay
 * - Smooth animations and transitions
 * - Active route highlighting with accent color
 * - Role-based navigation filtering
 * - Keyboard accessible
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationItem } from '@/lib/auth/capabilities';

interface SidebarProps {
  navigation: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ navigation, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  
  const isActive = (item: NavigationItem) => {
    if (item.href === pathname) return true;
    if (item.activeWhen?.some((path) => pathname.startsWith(path))) return true;
    return false;
  };
  
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-primary-900/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gradient-edu shadow-edu-xl
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
              onClick={() => onClose()}
            >
              <div className="w-10 h-10 rounded-lg bg-accent-900 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                <span className="text-primary-900 font-display font-bold text-xl">E</span>
              </div>
              <div>
                <span className="text-white font-display font-bold text-xl block leading-tight">
                  EduSphere
                </span>
                <span className="text-accent-900 font-display font-medium text-xs">
                  AI Platform
                </span>
              </div>
            </Link>
            
            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
              aria-label="Close navigation menu"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" aria-label="Main navigation">
            {navigation.map((item) => {
              const active = isActive(item);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg
                    transition-all duration-200
                    ${
                      active
                        ? 'bg-accent-900 text-primary-900 shadow-lg transform scale-105'
                        : 'text-white/90 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  {/* Icon */}
                  {item.icon && (
                    <span className={`text-xl ${active ? 'transform scale-110' : ''}`} aria-hidden="true">
                      {getIconForName(item.icon)}
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                  {/* Active indicator */}
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-primary-900 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="px-6 py-5 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-xs font-medium">POWERED BY AI</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <p className="text-xs text-white/60 text-center font-medium">
              EduSphere AI v1.0.0
            </p>
            <p className="text-xs text-white/40 text-center mt-1">
              © {new Date().getFullYear()} All Rights Reserved
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Icon mapping with modern symbols
 * Enhanced visual icons for better UX
 */
function getIconForName(iconName: string): string {
  const icons: Record<string, string> = {
    home: '🏛️',
    dashboard: '📊',
    user: '👤',
    users: '👥',
    file: '📄',
    files: '📁',
    document: '📄',
    documents: '📚',
    workflow: '⚡',
    workflows: '🔄',
    policy: '📋',
    policies: '📜',
    approval: '✅',
    approvals: '✓',
    signature: '✍️',
    signatures: '🖊️',
    notification: '🔔',
    notifications: '💬',
    admin: '⚙️',
    audit: '📊',
    settings: '⚙️',
    profile: '👤',
  };
  
  return icons[iconName] || '📌';
}
