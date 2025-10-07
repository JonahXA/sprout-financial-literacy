import { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { env } from './env'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

/**
 * Verify JWT token from request cookies
 * @throws Error if token is invalid or missing
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = verify(token, env.JWT_SECRET) as JWTPayload

    // Validate required fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 */
export async function getAuthUser(request?: NextRequest) {
  try {
    let token: string | undefined

    if (request) {
      token = request.cookies.get('token')?.value
    } else {
      token = cookies().get('token')?.value
    }

    if (!token) {
      return null
    }

    const payload = verifyToken(token)

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { school: true }
    })

    // Verify user exists and role matches
    if (!user || user.role !== payload.role) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

/**
 * Require authentication and specific role
 * @throws Error with status code if unauthorized
 */
export async function requireAuth(request: NextRequest, allowedRoles?: string[]) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    throw { message: 'Unauthorized', status: 401 }
  }

  const payload = verifyToken(token)

  // Fetch user to ensure they still exist and role is current
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { school: true }
  })

  if (!user) {
    throw { message: 'User not found', status: 401 }
  }

  // Verify role hasn't changed
  if (user.role !== payload.role) {
    throw { message: 'Invalid session - please log in again', status: 401 }
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw { message: 'Forbidden - insufficient permissions', status: 403 }
  }

  return { user, payload }
}
