import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  console.log('[Middleware]', pathname, 'has token:', !!token?.value)

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/teacher']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  const jwtSecret = process.env.JWT_SECRET

  // If no JWT secret is configured, allow the request through
  // This prevents blocking when env vars aren't loaded properly
  if (!jwtSecret) {
    console.error('[Middleware] JWT_SECRET not found in middleware')
    return NextResponse.next()
  }

  const secret = new TextEncoder().encode(jwtSecret)

  // Validate token only on protected routes
  if (token?.value && isProtectedPath) {
    try {
      await jwtVerify(token.value, secret)
      console.log('[Middleware] Token valid for protected path:', pathname)
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Token validation failed:', error)
      // Token is invalid - clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      })
      return response
    }
  }

  if (isProtectedPath && !token) {
    console.log('[Middleware] No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login/register (only if token is valid)
  if (token?.value && (pathname === '/login' || pathname === '/register')) {
    try {
      await jwtVerify(token.value, secret)
      console.log('[Middleware] Valid token on login page, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      console.log('[Middleware] Invalid token on login page, clearing it')
      // Invalid token on login page - clear it and allow login
      const response = NextResponse.next()
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/teacher/:path*', '/login', '/register']
}