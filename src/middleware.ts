/**
 * Authentication Middleware
 * 
 * This middleware:
 * 1. Refreshes Supabase sessions on every request
 * 2. Protects routes that require authentication
 * 3. Redirects unauthenticated users to sign-in
 * 4. Allows public routes without authentication
 * 
 * Route Protection Strategy (DEC-027):
 * - Public: /, /auth/*
 * - Protected: /dashboard/* and all other routes
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicConfig } from '@/config/env';

const appConfig = getPublicConfig();

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/auth/reset-password',
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in request (for current request)
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Set cookie in response (for future requests)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from request
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          // Remove cookie from response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if exists
  // This extends the session lifetime on every request
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Protect all other routes - redirect to sign-in if not authenticated
  if (!session) {
    const redirectUrl = new URL('/auth/sign-in', request.url);
    // Store the original URL to redirect back after sign-in
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

/**
 * Matcher configuration - run middleware on specific paths
 * 
 * This runs on:
 * - All routes except static files, images, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
