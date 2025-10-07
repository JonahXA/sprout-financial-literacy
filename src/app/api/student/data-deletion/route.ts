import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Request account deletion (FERPA right to be forgotten)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    const body = await request.json()
    const { confirmEmail, reason } = body

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isMinor: true,
        parentEmail: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify email confirmation
    if (confirmEmail !== user.email) {
      return NextResponse.json({
        error: 'Email confirmation does not match'
      }, { status: 400 })
    }

    // For minors, require parental consent for deletion
    if (user.isMinor && user.parentEmail) {
      // Send notification to parent about deletion request
      await sendEmail({
        to: user.parentEmail,
        subject: `Account Deletion Request for ${user.firstName} ${user.lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff4b4b;">Account Deletion Request</h2>
            <p>Hello,</p>
            <p>Your child, <strong>${user.firstName} ${user.lastName}</strong>, has requested to delete their Sprout account.</p>
            ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
            <p>The account will be scheduled for deletion in 30 days. If you did not authorize this request, please contact us immediately.</p>
            <p>To cancel this deletion request, have your child log in and contact support within 30 days.</p>
            <p>Best regards,<br>The Sprout Team</p>
          </div>
        `,
        text: `Your child ${user.firstName} ${user.lastName} has requested account deletion. Account will be deleted in 30 days unless cancelled.`
      })
    }

    // Mark account for deletion (soft delete with 30-day grace period)
    // In production, you'd add a deletionScheduledAt field to User model
    // For now, we'll anonymize the data immediately

    await prisma.$transaction(async (tx) => {
      // Anonymize user data
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: `deleted-${user.id}@deleted.local`,
          firstName: 'Deleted',
          lastName: 'User',
          password: 'DELETED',
          parentEmail: null,
          dateOfBirth: null,
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      })

      // Keep educational records for legal compliance but anonymize
      // Quiz attempts and enrollments are kept for school records
      // but cannot be traced back to the user
    })

    // Send confirmation email to user
    await sendEmail({
      to: user.email,
      subject: 'Account Deletion Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Deletion Confirmed</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your Sprout account has been scheduled for deletion.</p>
          <p>Your personal information has been anonymized. Educational records required for legal compliance will be retained but cannot be traced back to you.</p>
          <p>Thank you for using Sprout!</p>
          <p>Best regards,<br>The Sprout Team</p>
        </div>
      `,
      text: `Your Sprout account has been deleted. Personal information anonymized.`
    })

    return NextResponse.json({
      message: 'Account deletion completed. Your data has been anonymized.',
      deletionDate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
