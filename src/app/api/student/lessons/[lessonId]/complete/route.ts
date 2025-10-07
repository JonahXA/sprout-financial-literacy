import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden - Students only' }, { status: 403 })
    }

    const body = await request.json()
    const { timeSpent } = body

    // Get lesson info
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: { course: true }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if already completed
    const existingCompletion = await prisma.lessonCompletion.findUnique({
      where: {
        userId_lessonId: {
          userId: decoded.userId,
          lessonId: params.lessonId
        }
      }
    })

    if (existingCompletion) {
      return NextResponse.json({
        message: 'Lesson already completed',
        xpEarned: 0,
        alreadyCompleted: true
      })
    }

    // Create lesson completion and award XP
    await prisma.$transaction(async (tx) => {
      // Mark lesson as completed
      await tx.lessonCompletion.create({
        data: {
          userId: decoded.userId,
          lessonId: params.lessonId,
          timeSpent: timeSpent || 0
        }
      })

      // Award XP to user
      await tx.user.update({
        where: { id: decoded.userId },
        data: {
          totalPoints: { increment: lesson.xpReward }
        }
      })

      // Update course enrollment progress
      // Calculate progress as percentage of completed lessons
      const totalLessons = await tx.lesson.count({
        where: { courseId: lesson.courseId }
      })

      const completedLessons = await tx.lessonCompletion.count({
        where: {
          userId: decoded.userId,
          lesson: {
            courseId: lesson.courseId
          }
        }
      })

      const progressPercentage = Math.round((completedLessons / totalLessons) * 100)

      // Update enrollment
      await tx.enrollment.updateMany({
        where: {
          userId: decoded.userId,
          courseId: lesson.courseId
        },
        data: {
          progress: progressPercentage,
          status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
          lastAccessedAt: new Date(),
          completedAt: progressPercentage === 100 ? new Date() : null
        }
      })
    })

    return NextResponse.json({
      message: 'Lesson completed successfully',
      xpEarned: lesson.xpReward,
      alreadyCompleted: false
    })
  } catch (error) {
    console.error('Error completing lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
