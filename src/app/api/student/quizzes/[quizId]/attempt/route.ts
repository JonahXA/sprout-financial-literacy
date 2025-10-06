import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    const body = await request.json()
    const { answers, timeSpent } = body

    // Get quiz with lesson info
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        lesson: {
          include: {
            course: true
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Calculate score
    const questions = quiz.questions as any[]
    let correctAnswers = 0
    const totalQuestions = questions.length

    const gradedAnswers = questions.map((question: any, index: number) => {
      const studentAnswer = answers[index]
      const isCorrect = studentAnswer === question.correctAnswer

      if (isCorrect) correctAnswers++

      return {
        questionId: question.id || index,
        question: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      }
    })

    const score = correctAnswers
    const maxScore = totalQuestions
    const percentage = Math.round((correctAnswers / totalQuestions) * 100)
    const passed = percentage >= quiz.passingScore

    // Count previous attempts
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId: decoded.userId,
        quizId: params.quizId
      }
    })

    // Save quiz attempt
    const quizAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          userId: decoded.userId,
          quizId: params.quizId,
          courseId: quiz.lesson.courseId,
          quizTitle: quiz.title,
          score,
          maxScore,
          percentage,
          timeSpent: timeSpent || 0,
          answers: gradedAnswers,
          passed,
          attemptNumber: attemptCount + 1
        }
      })

      // If passed and first time passing, award XP
      const previousPassedAttempt = await tx.quizAttempt.findFirst({
        where: {
          userId: decoded.userId,
          quizId: params.quizId,
          passed: true,
          id: { not: attempt.id }
        }
      })

      let xpAwarded = 0
      if (passed && !previousPassedAttempt) {
        // Award bonus XP for passing quiz (30 XP)
        await tx.user.update({
          where: { id: decoded.userId },
          data: {
            totalPoints: { increment: 30 }
          }
        })
        xpAwarded = 30
      }

      // Update enrollment grade if this is the best attempt
      const enrollment = await tx.enrollment.findFirst({
        where: {
          userId: decoded.userId,
          courseId: quiz.lesson.courseId
        }
      })

      if (enrollment) {
        // Calculate average quiz grade for this course
        const allAttempts = await tx.quizAttempt.findMany({
          where: {
            userId: decoded.userId,
            courseId: quiz.lesson.courseId,
            passed: true
          },
          orderBy: {
            percentage: 'desc'
          },
          distinct: ['quizId']
        })

        if (allAttempts.length > 0) {
          const avgGrade = allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length
          await tx.enrollment.updateMany({
            where: {
              userId: decoded.userId,
              courseId: quiz.lesson.courseId
            },
            data: {
              grade: Math.round(avgGrade),
              gradePercent: Math.round(avgGrade)
            }
          })
        }
      }

      return { ...attempt, xpAwarded }
    })

    return NextResponse.json({
      success: true,
      score,
      maxScore,
      percentage,
      passed,
      passingScore: quiz.passingScore,
      answers: gradedAnswers,
      attemptNumber: attemptCount + 1,
      xpAwarded: quizAttempt.xpAwarded,
      message: passed ? 'Congratulations! You passed!' : `You need ${quiz.passingScore}% to pass. Try again!`
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
