import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Get a specific lesson for a student
export async function GET(
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

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        course: true,
        quizzes: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            questions: true
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check if student has completed this lesson
    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        userId_lessonId: {
          userId: decoded.userId,
          lessonId: params.lessonId
        }
      }
    })

    return NextResponse.json({
      ...lesson,
      isCompleted: !!completion,
      completedAt: completion?.completedAt,
      timeSpent: completion?.timeSpent
    })
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
