import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { submitQuizSchema, formatZodErrors } from '@/lib/validation'
import { checkRateLimit, getClientId, RateLimits } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    // Authenticate and authorize
    const { user } = await requireAuth(request, ['STUDENT'])

    // Rate limiting - prevent quiz spam
    const clientId = getClientId(request, user.id)
    const rateLimit = checkRateLimit(clientId, RateLimits.QUIZ)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many quiz submissions. Please slow down.' },
        { status: 429 }
      )
    }

    // Validate input
    const body = await request.json()
    const validation = submitQuizSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', fields: formatZodErrors(validation.error) },
        { status: 400 }
      )
    }

    const { answers, timeSpent } = validation.data

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
        userId: user.id,
        quizId: params.quizId
      }
    })

    // Save quiz attempt with transaction and race condition protection
    const quizAttempt = await prisma.$transaction(async (tx) => {
      // Check for duplicate submission in last 5 seconds (race condition protection)
      const recentAttempt = await tx.quizAttempt.findFirst({
        where: {
          userId: user.id,
          quizId: params.quizId,
          createdAt: {
            gte: new Date(Date.now() - 5000) // Last 5 seconds
          }
        }
      })

      if (recentAttempt) {
        throw new Error('Duplicate submission detected. Please wait before submitting again.')
      }
      const attempt = await tx.quizAttempt.create({
        data: {
          userId: user.id,
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

      // If passed and first time passing, award XP (with additional check)
      const previousPassedAttempt = await tx.quizAttempt.findFirst({
        where: {
          userId: user.id,
          quizId: params.quizId,
          passed: true,
          id: { not: attempt.id }
        }
      })

      let xpAwarded = 0
      if (passed && !previousPassedAttempt) {
        // Double-check no XP was awarded in a concurrent request
        const xpCheck = await tx.quizAttempt.findFirst({
          where: {
            userId: user.id,
            quizId: params.quizId,
            passed: true,
            createdAt: {
              gte: new Date(Date.now() - 10000) // Last 10 seconds
            },
            id: { not: attempt.id }
          }
        })

        if (!xpCheck) {
          // Award bonus XP for passing quiz (30 XP)
          await tx.user.update({
            where: { id: user.id },
            data: {
              totalPoints: { increment: 30 }
            }
          })
          xpAwarded = 30
        }
      }

      // Update enrollment grade if this is the best attempt
      const enrollment = await tx.enrollment.findFirst({
        where: {
          userId: user.id,
          courseId: quiz.lesson.courseId
        }
      })

      if (enrollment) {
        // Calculate average quiz grade for this course
        const allAttempts = await tx.quizAttempt.findMany({
          where: {
            userId: user.id,
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
              userId: user.id,
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
    }, {
      timeout: 10000, // 10 second timeout
      isolationLevel: 'Serializable' // Highest isolation level to prevent race conditions
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
