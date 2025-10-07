import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/teacher']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // Validate token only on protected routes
  if (token?.value && isProtectedPath) {
    try {
      verify(token.value, process.env.JWT_SECRET || '')
    } catch (error) {
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
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login/register (only if token is valid)
  if (token?.value && (pathname === '/login' || pathname === '/register')) {
    try {
      verify(token.value, process.env.JWT_SECRET || '')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
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