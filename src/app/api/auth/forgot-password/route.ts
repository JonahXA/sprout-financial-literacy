import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with that email, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    })

    // Send password reset email
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Sprout Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a1628;">Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>We received a request to reset your password for your Sprout account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}"
             style="display: inline-block; padding: 12px 24px; background-color: #0a1628; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
          </p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #1cb0f6;">${resetLink}</a>
          </p>
        </div>
      `,
      text: `Hi ${user.firstName}, you requested a password reset. Click this link to reset your password: ${resetLink}. This link expires in 1 hour.`
    })

    return NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
      // Only show link in development
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
