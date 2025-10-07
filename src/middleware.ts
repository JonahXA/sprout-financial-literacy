import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  console.log('[Middleware]', pathname, 'has token:', !!token?.value)

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/teacher', '/admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  const jwtSecret = process.env.JWT_SECRET

  // If no JWT secret is configured, allow the request through
  // This prevents blocking when env vars aren't loaded properly
  if (!jwtSecret) {
    console.error('[Middleware] JWT_SECRET not found in middleware')
    return NextResponse.next()
  }

  const secret = new TextEncoder().encode(jwtSecret)

  // If there's a token, validate it regardless of path
  // This ensures invalid tokens are cleared everywhere
  if (token?.value) {
    try {
      await jwtVerify(token.value, secret)
      console.log('[Middleware] Token valid')

      // Redirect authenticated users away from login/register
      if (pathname === '/login' || pathname === '/register') {
        console.log('[Middleware] Valid token on auth page, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Allow access to protected routes
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Token validation failed, clearing cookie')

      // Token is invalid - clear it
      if (isProtectedPath) {
        // On protected routes, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('token')
        return response
      } else {
        // On public routes, just clear the cookie and continue
        const response = NextResponse.next()
        response.cookies.delete('token')
        return response
      }
    }
  }

  // No token - redirect if trying to access protected route
  if (isProtectedPath) {
    console.log('[Middleware] No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}