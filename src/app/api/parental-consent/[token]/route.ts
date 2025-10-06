import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Verify and grant parental consent
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Find the consent token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: params.token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid consent token' }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: 'Consent already provided' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Consent token expired' }, { status: 400 })
    }

    // Update user with parental consent
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          parentalConsent: true,
          consentDate: new Date()
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({
      message: 'Parental consent granted successfully',
      studentName: `${resetToken.user.firstName} ${resetToken.user.lastName}`
    })
  } catch (error) {
    console.error('Error granting parental consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get consent info (for the consent page)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: params.token },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            school: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid consent token' }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({
        error: 'Consent already provided',
        alreadyProvided: true
      }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Consent token expired' }, { status: 400 })
    }

    return NextResponse.json({
      student: {
        firstName: resetToken.user.firstName,
        lastName: resetToken.user.lastName,
        email: resetToken.user.email,
        school: resetToken.user.school?.name
      },
      valid: true
    })
  } catch (error) {
    console.error('Error fetching consent info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
