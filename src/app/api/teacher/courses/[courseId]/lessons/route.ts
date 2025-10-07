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

    if (decoded.role !== 'TEACHER' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId: params.courseId },
      orderBy: { order: 'asc' },
      include: {
        quizzes: true,
        _count: {
          select: { completions: true }
        }
      }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }

    if (decoded.role !== 'TEACHER' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, content, contentType, videoUrl, estimatedMinutes, xpReward, order } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId: params.courseId,
        title,
        description,
        content,
        contentType: contentType || 'TEXT',
        videoUrl,
        estimatedMinutes: estimatedMinutes || 10,
        xpReward: xpReward || 10,
        order: order || 0
      }
    })

    return NextResponse.json({ message: 'Lesson created successfully', lesson }, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
