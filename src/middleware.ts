// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  exp: number;
}

// Route configurations
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/services',
];

// Routes yang memerlukan login (semua user)
const PROTECTED_ROUTES = ['/orders', '/checkout', '/chat', '/profile'];

const PROVIDER_ROUTES = ['/dashboard', '/jobs', '/settings'];
const ADMIN_ROUTES = ['/admin'];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith('/services/')) return true;
  if (pathname. startsWith('/provider/')) return true; // Public profile /provider/[id]
  return false;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isProviderRoute(pathname: string): boolean {
  return PROVIDER_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isAdminRoute(pathname: string): boolean {
  return pathname. startsWith('/admin');
}

function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('posko_token')?.value || null;
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded. exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request. nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname. startsWith('/api') ||
    pathname. includes('.')
  ) {
    return NextResponse. next();
  }

  const token = getTokenFromCookies(request);
  const user = token ? decodeToken(token) : null;

  // =============================================
  // RULE 1: Public Routes - Allow everyone
  // =============================================
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // =============================================
  // RULE 2: Protected Routes - Require authentication
  // =============================================
  if (! user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams. set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // =============================================
  // RULE 3: Admin Routes - Only admin can access
  // =============================================
  if (isAdminRoute(pathname)) {
    if (user.role !== 'admin') {
      if (user.role === 'provider') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // =============================================
  // RULE 4: Provider Routes - Only provider/admin can access
  // =============================================
  if (isProviderRoute(pathname)) {
    if (user.role !== 'provider' && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // =============================================
  // RULE 5: Protected Customer Routes - All authenticated users
  // =============================================
  if (isProtectedRoute(pathname)) {
    return NextResponse.next(); // User sudah login, izinkan akses
  }

  // =============================================
  // RULE 6: Default - Allow authenticated users
  // =============================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};