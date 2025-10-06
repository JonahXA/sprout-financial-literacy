import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Get privacy settings
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        parentEmail: true,
        dateOfBirth: true,
        isMinor: true,
        parentalConsent: true,
        consentDate: true,
        dataSharing: true,
        privacyAgreedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching privacy settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update privacy settings
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    const body = await request.json()
    const { parentEmail, dateOfBirth, dataSharing, privacyAgreed } = body

    // Calculate if user is a minor (under 18)
    let isMinor = false
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        isMinor = age - 1 < 18
      } else {
        isMinor = age < 18
      }
    }

    const updateData: any = {}

    if (parentEmail !== undefined) updateData.parentEmail = parentEmail
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(dateOfBirth)
      updateData.isMinor = isMinor
    }
    if (dataSharing !== undefined) updateData.dataSharing = dataSharing
    if (privacyAgreed) updateData.privacyAgreedAt = new Date()

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        parentEmail: true,
        dateOfBirth: true,
        isMinor: true,
        dataSharing: true,
        privacyAgreedAt: true
      }
    })

    return NextResponse.json({
      message: 'Privacy settings updated successfully',
      user
    })
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
