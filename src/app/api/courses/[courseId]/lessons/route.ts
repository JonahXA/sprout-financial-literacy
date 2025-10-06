import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    // Get all lessons for this course
    const lessons = await prisma.lesson.findMany({
      where: { courseId: params.courseId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        contentType: true,
        videoUrl: true,
        estimatedMinutes: true,
        xpReward: true,
        createdAt: true
      }
    })

    // If student, include completion status
    if (decoded.role === 'STUDENT') {
      const completions = await prisma.lessonCompletion.findMany({
        where: {
          userId: decoded.userId,
          lesson: {
            courseId: params.courseId
          }
        },
        select: {
          lessonId: true,
          completedAt: true,
          timeSpent: true
        }
      })

      const completionMap = new Map(
        completions.map(c => [c.lessonId, c])
      )

      const lessonsWithStatus = lessons.map(lesson => ({
        ...lesson,
        isCompleted: completionMap.has(lesson.id),
        completedAt: completionMap.get(lesson.id)?.completedAt,
        timeSpent: completionMap.get(lesson.id)?.timeSpent
      }))

      return NextResponse.json(lessonsWithStatus)
    }

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
