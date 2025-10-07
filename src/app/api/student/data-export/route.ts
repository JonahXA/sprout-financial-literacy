import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Export all student data (FERPA compliance)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        school: true,
        enrollments: {
          include: {
            course: true
          }
        },
        enrolledClasses: {
          include: {
            class: {
              include: {
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        quizAttempts: {
          include: {
            quiz: {
              select: {
                title: true,
                lesson: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove password from export
    const { password, ...userWithoutPassword } = user

    const exportData = {
      exportDate: new Date().toISOString(),
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        isMinor: user.isMinor,
        parentEmail: user.parentEmail,
        parentalConsent: user.parentalConsent,
        consentDate: user.consentDate,
        dataSharing: user.dataSharing,
        privacyAgreedAt: user.privacyAgreedAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      school: user.school ? {
        name: user.school.name,
        city: user.school.city,
        state: user.school.state
      } : null,
      gamification: {
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      },
      enrollments: user.enrollments.map(e => ({
        courseTitle: e.course.title,
        courseCategory: e.course.category,
        progress: e.progress,
        status: e.status,
        grade: e.grade,
        gradePercent: e.gradePercent,
        timeSpent: e.timeSpent,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        lastAccessedAt: e.lastAccessedAt
      })),
      classes: user.enrolledClasses.map(ec => ({
        className: ec.class.name,
        classCode: ec.class.code,
        teacher: `${ec.class.teacher.firstName} ${ec.class.teacher.lastName}`,
        teacherEmail: ec.class.teacher.email,
        joinedAt: ec.joinedAt
      })),
      quizzes: user.quizAttempts.map(qa => ({
        quizTitle: qa.quizTitle,
        lessonTitle: qa.quiz?.lesson?.title,
        score: qa.score,
        maxScore: qa.maxScore,
        percentage: qa.percentage,
        passed: qa.passed,
        attemptNumber: qa.attemptNumber,
        timeSpent: qa.timeSpent,
        createdAt: qa.createdAt,
        answers: qa.answers // Full quiz answers and results
      }))
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sprout-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
