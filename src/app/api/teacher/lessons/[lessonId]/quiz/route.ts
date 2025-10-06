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

    if (decoded.role !== 'TEACHER' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, questions, passingScore } = body

    // Validate required fields
    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Title and questions are required' }, { status: 400 })
    }

    // Validate question format
    for (const q of questions) {
      if (!q.question || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
        return NextResponse.json({
          error: 'Each question must have: question text, at least 2 options, and a correct answer index'
        }, { status: 400 })
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: params.lessonId,
        title,
        questions,
        passingScore: passingScore || 70
      }
    })

    return NextResponse.json({ message: 'Quiz created successfully', quiz }, { status: 201 })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    if (decoded.role !== 'TEACHER' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const quizzes = await prisma.quiz.findMany({
      where: { lessonId: params.lessonId },
      include: {
        _count: {
          select: { attempts: true }
        }
      }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
