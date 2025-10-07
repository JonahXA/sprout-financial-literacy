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

export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the class belongs to this teacher
    const classData = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id
      },
      include: {
        assignments: {
          include: {
            course: true
          }
        },
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  include: {
                    course: true
                  }
                },
                quizAttempts: true
              }
            }
          }
        }
      }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Build gradebook data
    const gradebook = classData.students.map(({ student }) => {
      const studentGrades = classData.assignments.map(assignment => {
        // Find enrollment for this course
        const enrollment = student.enrollments.find(
          e => e.courseId === assignment.courseId
        )

        // Find quiz attempts for this course
        const quizAttempts = student.quizAttempts.filter(
          qa => qa.courseId === assignment.courseId
        )

        const bestAttempt = quizAttempts.length > 0
          ? quizAttempts.reduce((best, current) =>
              current.percentage > best.percentage ? current : best
            )
          : null

        return {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          courseTitle: assignment.course.title,
          dueDate: assignment.dueDate,
          points: assignment.points,
          progress: enrollment?.progress || 0,
          status: enrollment?.status || 'NOT_STARTED',
          grade: enrollment?.grade,
          gradePercent: enrollment?.gradePercent,
          quizScore: bestAttempt?.percentage,
          quizAttempts: quizAttempts.length,
          timeSpent: enrollment?.timeSpent || 0,
          lastAccessed: enrollment?.lastAccessedAt
        }
      })

      // Calculate overall metrics
      const completedAssignments = studentGrades.filter(g => g.status === 'COMPLETED').length
      const avgProgress = studentGrades.reduce((sum, g) => sum + g.progress, 0) / studentGrades.length || 0
      const avgGrade = studentGrades
        .filter(g => g.gradePercent !== null && g.gradePercent !== undefined)
        .reduce((sum, g) => sum + (g.gradePercent || 0), 0) /
        (studentGrades.filter(g => g.gradePercent !== null && g.gradePercent !== undefined).length || 1)

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
        totalPoints: student.totalPoints,
        currentStreak: student.currentStreak,
        lastLogin: student.lastLoginAt,
        grades: studentGrades,
        summary: {
          completedAssignments,
          totalAssignments: classData.assignments.length,
          avgProgress: Math.round(avgProgress),
          avgGrade: Math.round(avgGrade),
          totalTimeSpent: studentGrades.reduce((sum, g) => sum + g.timeSpent, 0)
        }
      }
    })

    return NextResponse.json({
      className: classData.name,
      assignments: classData.assignments.map(a => ({
        id: a.id,
        title: a.title,
        courseTitle: a.course.title,
        dueDate: a.dueDate,
        points: a.points
      })),
      students: gradebook
    })
  } catch (error) {
    console.error('Gradebook error:', error)
    return NextResponse.json({ error: 'Failed to fetch gradebook' }, { status: 500 })
  }
}
