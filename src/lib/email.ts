// Email utility functions using Resend
import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Initialize Resend client (only if API key is available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development or if no API key, log email to console
  if (process.env.NODE_ENV === 'development' || !resend || !process.env.RESEND_FROM_EMAIL) {
    console.log('===== EMAIL NOTIFICATION (DEVELOPMENT MODE) =====')
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`Body: ${options.text || options.html}`)
    console.log('================================================')
    return true
  }

  // In production with Resend configured
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (result.error) {
      console.error('Resend email error:', result.error)
      return false
    }

    console.log('Email sent successfully:', result.data?.id)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// Email Templates
export const emailTemplates = {
  assignmentCreated: (studentName: string, courseName: string, dueDate: string | null) => ({
    subject: `New Assignment: ${courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #58cc02;">📚 New Assignment</h2>
        <p>Hi ${studentName},</p>
        <p>Your teacher has assigned a new course: <strong>${courseName}</strong></p>
        ${dueDate ? `<p>📅 <strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}</p>` : ''}
        <p>Log in to Sprout to get started!</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
           style="display: inline-block; padding: 12px 24px; background-color: #58cc02; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Go to Dashboard
        </a>
      </div>
    `,
    text: `Hi ${studentName}, your teacher has assigned a new course: ${courseName}${dueDate ? `. Due: ${dueDate}` : ''}. Log in to Sprout to get started!`
  }),

  assignmentDueSoon: (studentName: string, courseName: string, dueDate: string, daysLeft: number) => ({
    subject: `⏰ Reminder: ${courseName} Due Soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9500;">⏰ Assignment Due Soon</h2>
        <p>Hi ${studentName},</p>
        <p>This is a friendly reminder that your assignment is due soon:</p>
        <div style="background-color: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>${courseName}</strong></p>
          <p style="margin: 8px 0 0 0;">Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} - ${new Date(dueDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}</p>
        </div>
        <p>Don't forget to complete your work!</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
           style="display: inline-block; padding: 12px 24px; background-color: #ff9500; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Complete Assignment
        </a>
      </div>
    `,
    text: `Hi ${studentName}, reminder: ${courseName} is due in ${daysLeft} day(s) on ${dueDate}. Don't forget to complete your work!`
  }),

  assignmentOverdue: (studentName: string, courseName: string, dueDate: string) => ({
    subject: `⚠️ Overdue: ${courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff4b4b;">⚠️ Assignment Overdue</h2>
        <p>Hi ${studentName},</p>
        <p>Your assignment is now overdue:</p>
        <div style="background-color: #ffe6e6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ff4b4b;">
          <p style="margin: 0;"><strong>${courseName}</strong></p>
          <p style="margin: 8px 0 0 0;">Was due: ${new Date(dueDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}</p>
        </div>
        <p>Please complete this assignment as soon as possible.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
           style="display: inline-block; padding: 12px 24px; background-color: #ff4b4b; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Complete Now
        </a>
      </div>
    `,
    text: `Hi ${studentName}, your assignment "${courseName}" is now overdue (was due ${dueDate}). Please complete it as soon as possible.`
  }),

  weeklyProgressReport: (studentName: string, stats: { coursesCompleted: number; totalXP: number; streak: number; assignments: number }) => ({
    subject: `📊 Your Weekly Progress Report`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1cb0f6;">📊 Weekly Progress Report</h2>
        <p>Hi ${studentName},</p>
        <p>Here's your progress summary for this week:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <div style="margin-bottom: 12px;">
            <span style="font-size: 24px;">📚</span>
            <strong> ${stats.coursesCompleted}</strong> courses completed
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-size: 24px;">⚡</span>
            <strong> ${stats.totalXP}</strong> XP earned
          </div>
          <div style="margin-bottom: 12px;">
            <span style="font-size: 24px;">🔥</span>
            <strong> ${stats.streak}</strong> day streak
          </div>
          <div>
            <span style="font-size: 24px;">✅</span>
            <strong> ${stats.assignments}</strong> assignments completed
          </div>
        </div>
        <p>Keep up the great work!</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard"
           style="display: inline-block; padding: 12px 24px; background-color: #1cb0f6; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          View Dashboard
        </a>
      </div>
    `,
    text: `Hi ${studentName}, your weekly progress: ${stats.coursesCompleted} courses completed, ${stats.totalXP} XP earned, ${stats.streak} day streak, ${stats.assignments} assignments done. Keep it up!`
  })
}
