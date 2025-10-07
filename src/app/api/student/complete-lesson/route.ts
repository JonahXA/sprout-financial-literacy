import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function getUser() {
  const token = cookies().get('token')
  if (!token) return null

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { userId: string }
    return await prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, lessonId, progressIncrement = 10 } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    // Check if lesson was already completed (to prevent double XP)
    let alreadyCompleted = false
    if (lessonId) {
      const existingCompletion = await prisma.lessonCompletion.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: lessonId
          }
        }
      })
      alreadyCompleted = !!existingCompletion
    }

    // Find or create enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      },
      include: {
        course: true
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 })
    }

    // Calculate new progress (cap at 100)
    const newProgress = Math.min(enrollment.progress + progressIncrement, 100)
    const wasCompleted = enrollment.status === 'COMPLETED'
    const isNowCompleted = newProgress >= 100

    // Calculate XP reward (base 10 XP per lesson, bonus 50 XP for course completion)
    // Don't give XP if lesson was already completed
    const lessonXP = alreadyCompleted ? 0 : 10
    const completionBonus = isNowCompleted && !wasCompleted ? 50 : 0
    const totalXP = lessonXP + completionBonus

    // Check if user learned today for streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastActivity = user.updatedAt
    lastActivity.setHours(0, 0, 0, 0)

    let newStreak = user.currentStreak
    const isConsecutiveDay = lastActivity.getTime() === yesterday.getTime()
    const isSameDay = lastActivity.getTime() === today.getTime()

    if (!isSameDay) {
      // Update streak
      newStreak = isConsecutiveDay ? user.currentStreak + 1 : 1
    }

    // Build transaction operations
    const operations: any[] = [
      prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId
          }
        },
        data: {
          progress: newProgress,
          status: isNowCompleted ? 'COMPLETED' : newProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
          completedAt: isNowCompleted && !wasCompleted ? new Date() : enrollment.completedAt
        },
        include: {
          course: true
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: { increment: totalXP },
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak)
        }
      })
    ]

    // Create lesson completion record if provided and not already completed
    if (lessonId && !alreadyCompleted) {
      operations.push(
        prisma.lessonCompletion.create({
          data: {
            userId: user.id,
            lessonId: lessonId
          }
        })
      )
    }

    // Update enrollment and user in a transaction
    const [updatedEnrollment, updatedUser] = await prisma.$transaction(operations)

    return NextResponse.json({
      enrollment: updatedEnrollment,
      xpEarned: totalXP,
      newTotalXP: updatedUser.totalPoints,
      streakUpdated: newStreak !== user.currentStreak,
      currentStreak: updatedUser.currentStreak,
      leveledUp: Math.floor(updatedUser.totalPoints / 100) > Math.floor(user.totalPoints / 100),
      completedCourse: isNowCompleted && !wasCompleted
    })
  } catch (error) {
    console.error('Complete lesson error:', error)
    return NextResponse.json({ error: 'Failed to complete lesson' }, { status: 500 })
  }
}
