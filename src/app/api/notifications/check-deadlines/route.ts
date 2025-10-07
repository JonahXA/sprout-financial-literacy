import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplates } from '@/lib/email'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// Run daily to check for upcoming deadlines

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)
    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(now.getDate() + 1)

    // Find assignments with upcoming deadlines
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        course: true,
        class: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    enrollments: {
                      where: {
                        status: {
                          not: 'COMPLETED'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Find overdue assignments
    const overdueAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          lt: now
        }
      },
      include: {
        course: true,
        class: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    enrollments: {
                      where: {
                        status: {
                          not: 'COMPLETED'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    let emailsSent = 0

    // Send reminders for upcoming assignments
    for (const assignment of upcomingAssignments) {
      const daysUntilDue = Math.ceil((new Date(assignment.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Only send for 3 days and 1 day before due date
      if (daysUntilDue !== 3 && daysUntilDue !== 1) continue

      for (const { student } of assignment.class.students) {
        // Check if student has completed the course
        const enrollment = student.enrollments.find(e => e.courseId === assignment.courseId)

        if (enrollment && enrollment.status !== 'COMPLETED') {
          const template = emailTemplates.assignmentDueSoon(
            student.firstName,
            assignment.course.title,
            assignment.dueDate!.toISOString(),
            daysUntilDue
          )

          await sendEmail({
            to: student.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          })

          emailsSent++
        }
      }
    }

    // Send overdue notifications (only once per day)
    for (const assignment of overdueAssignments) {
      const daysSinceOverdue = Math.floor((now.getTime() - new Date(assignment.dueDate!).getTime()) / (1000 * 60 * 60 * 24))

      // Only send on the first day overdue
      if (daysSinceOverdue !== 0) continue

      for (const { student } of assignment.class.students) {
        const enrollment = student.enrollments.find(e => e.courseId === assignment.courseId)

        if (enrollment && enrollment.status !== 'COMPLETED') {
          const template = emailTemplates.assignmentOverdue(
            student.firstName,
            assignment.course.title,
            assignment.dueDate!.toISOString()
          )

          await sendEmail({
            to: student.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          })

          emailsSent++
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      upcomingAssignments: upcomingAssignments.length,
      overdueAssignments: overdueAssignments.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Deadline check error:', error)
    return NextResponse.json({ error: 'Failed to check deadlines' }, { status: 500 })
  }
}
