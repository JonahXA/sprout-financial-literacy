import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const { pathname } = request.nextUrl

  // Validate token and clear if invalid (handles old broken cookies)
  if (token?.value) {
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

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/teacher']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/teacher/:path*', '/login', '/register']
}