import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplates } from '@/lib/email'

// Request parental consent email
export async function POST(request: NextRequest) {
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
        firstName: true,
        lastName: true,
        email: true,
        parentEmail: true,
        isMinor: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.isMinor) {
      return NextResponse.json({
        error: 'Parental consent not required for adults'
      }, { status: 400 })
    }

    if (!user.parentEmail) {
      return NextResponse.json({
        error: 'Parent email not set. Please update your profile first.'
      }, { status: 400 })
    }

    // Generate consent token
    const consentToken = Math.random().toString(36).substring(2, 15) +
                         Math.random().toString(36).substring(2, 15)

    // Save token (reuse PasswordResetToken model or create new ConsentToken model)
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: consentToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        used: false
      }
    })

    // Send email to parent
    const consentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/parental-consent/${consentToken}`

    await sendEmail({
      to: user.parentEmail,
      subject: `Parental Consent Required for ${user.firstName} ${user.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a1f44;">Parental Consent Request</h2>
          <p>Hello,</p>
          <p>Your child, <strong>${user.firstName} ${user.lastName}</strong> (${user.email}), has registered for the Sprout Financial Literacy platform.</p>

          <p>As a parent/guardian of a minor, we need your consent to allow your child to use our educational platform in accordance with COPPA and FERPA regulations.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>What data we collect:</h3>
            <ul>
              <li>Name and email address</li>
              <li>Course progress and quiz scores</li>
              <li>Learning activity timestamps</li>
            </ul>

            <h3>How we use this data:</h3>
            <ul>
              <li>To provide educational content and track progress</li>
              <li>To generate reports for teachers</li>
              <li>To improve our educational platform</li>
            </ul>

            <h3>We do NOT:</h3>
            <ul>
              <li>Sell or share data with third parties</li>
              <li>Use data for advertising</li>
              <li>Collect unnecessary personal information</li>
            </ul>
          </div>

          <p>To provide consent, please click the button below:</p>

          <a href="${consentUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #58cc02; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Provide Parental Consent
          </a>

          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This link will expire in 7 days. If you did not expect this email or have questions, please contact us at support@sprout.edu
          </p>

          <p style="margin-top: 30px;">
            Best regards,<br>
            The Sprout Team
          </p>
        </div>
      `,
      text: `Hello, your child ${user.firstName} ${user.lastName} (${user.email}) has registered for Sprout Financial Literacy. Please provide parental consent by visiting: ${consentUrl}. This link expires in 7 days.`
    })

    return NextResponse.json({
      message: 'Parental consent request sent successfully',
      parentEmail: user.parentEmail
    })
  } catch (error) {
    console.error('Error sending parental consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
