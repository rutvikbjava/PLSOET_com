'use client';

/**
 * Sidebar Navigation Component
 * 
 * Responsive sidebar navigation with role-aware menu items.
 * 
 * Features:
 * - Desktop: Always visible sidebar
 * - Mobile: Collapsible sidebar with overlay
 * - Keyboard navigation support
 * - Active route highlighting
 * - Role-based navigation filtering
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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              EduSphere AI
            </Link>
            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close sidebar"
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
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" aria-label="Main navigation">
            {navigation.map((item) => {
              const active = isActive(item);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()} // Close mobile menu on navigation
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md
                    transition-colors
                    ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  {/* Icon placeholder - can be enhanced with actual icons */}
                  {item.icon && (
                    <span className="mr-3 text-lg" aria-hidden="true">
                      {getIconForName(item.icon)}
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          {/* Footer info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              EduSphere AI v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Simple icon mapping
 * Returns emoji icons for now - can be replaced with icon library later
 */
function getIconForName(iconName: string): string {
  const icons: Record<string, string> = {
    home: '🏠',
    user: '👤',
    file: '📄',
    workflow: '🔄',
    policy: '📋',
    approval: '✅',
    signature: '✍️',
    notification: '🔔',
    admin: '⚙️',
    audit: '📊',
    settings: '⚙️',
  };
  
  return icons[iconName] || '•';
}
