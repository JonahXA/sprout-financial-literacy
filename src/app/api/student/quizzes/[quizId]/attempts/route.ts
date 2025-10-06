import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
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

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: decoded.userId,
        quizId: params.quizId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        score: true,
        maxScore: true,
        percentage: true,
        passed: true,
        attemptNumber: true,
        timeSpent: true,
        createdAt: true
      }
    })

    const bestAttempt = attempts.reduce((best, current) => {
      return current.percentage > (best?.percentage || 0) ? current : best
    }, attempts[0])

    return NextResponse.json({
      attempts,
      bestAttempt,
      totalAttempts: attempts.length,
      hasPassed: attempts.some(a => a.passed)
    })
  } catch (error) {
    console.error('Error fetching quiz attempts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
