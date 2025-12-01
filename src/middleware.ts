import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

type Role = 'customer' | 'provider' | 'admin';

interface DecodedToken {
  userId?: string;
  email?: string;
  role?: Role;
  activeRole?: Role;
  roles?: Role[];
  exp: number;
}

// Route configurations
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/services',
];

// Routes yang memerlukan login
const PROTECTED_ROUTES = ['/orders', '/checkout', '/chat', '/profile'];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith('/services/')) return true;
  if (pathname.startsWith('/provider/')) return true; // Public profile provider
  return false;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('posko_token')?.value || null;
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = getTokenFromCookies(request);
  const user = token ? decodeToken(token) : null;

  // RULE: Protected Routes - Require authentication
  if (isProtectedRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};