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

    // Calculate class-wide statistics
    const totalStudents = classData.students.length
    const totalAssignments = classData.assignments.length

    // Completion statistics
    const completionData = classData.students.map(({ student }) => {
      const completed = student.enrollments.filter(e => e.status === 'COMPLETED').length
      const inProgress = student.enrollments.filter(e => e.status === 'IN_PROGRESS').length
      const notStarted = student.enrollments.filter(e => e.status === 'NOT_STARTED').length

      return { completed, inProgress, notStarted, total: student.enrollments.length }
    })

    const avgCompletionRate = completionData.reduce((sum, d) => sum + (d.completed / (d.total || 1)), 0) / totalStudents || 0

    // Engagement metrics
    const activeStudents = classData.students.filter(({ student }) => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      return student.lastLoginAt && new Date(student.lastLoginAt) > lastWeek
    }).length

    // Progress over time (simulated - would need historical data in real app)
    const progressOverTime = [
      { week: 'Week 1', avgProgress: 15 },
      { week: 'Week 2', avgProgress: 32 },
      { week: 'Week 3', avgProgress: 48 },
      { week: 'Week 4', avgProgress: 65 },
      { week: 'Current', avgProgress: Math.round(
        classData.students.reduce((sum, { student }) =>
          sum + (student.enrollments.reduce((s, e) => s + e.progress, 0) / (student.enrollments.length || 1)), 0
        ) / totalStudents
      )}
    ]

    // At-risk students (low progress, overdue assignments)
    const now = new Date()
    const atRiskStudents = classData.students.filter(({ student }) => {
      const avgProgress = student.enrollments.reduce((sum, e) => sum + e.progress, 0) / (student.enrollments.length || 1)
      const hasOverdue = classData.assignments.some(assignment => {
        if (!assignment.dueDate || assignment.dueDate > now) return false
        const enrollment = student.enrollments.find(e => e.courseId === assignment.courseId)
        return enrollment && enrollment.status !== 'COMPLETED'
      })

      return avgProgress < 30 || hasOverdue
    }).map(({ student }) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email,
      avgProgress: Math.round(student.enrollments.reduce((sum, e) => sum + e.progress, 0) / (student.enrollments.length || 1)),
      overdueCount: classData.assignments.filter(assignment => {
        if (!assignment.dueDate || assignment.dueDate > now) return false
        const enrollment = student.enrollments.find(e => e.courseId === assignment.courseId)
        return enrollment && enrollment.status !== 'COMPLETED'
      }).length
    }))

    // Top performers
    const topPerformers = classData.students
      .map(({ student }) => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        totalPoints: student.totalPoints,
        currentStreak: student.currentStreak,
        completedCourses: student.enrollments.filter(e => e.status === 'COMPLETED').length,
        avgGrade: Math.round(
          student.enrollments
            .filter(e => e.gradePercent !== null && e.gradePercent !== undefined)
            .reduce((sum, e) => sum + (e.gradePercent || 0), 0) /
          (student.enrollments.filter(e => e.gradePercent !== null).length || 1)
        )
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5)

    // Course-specific analytics
    const courseAnalytics = classData.assignments.map(assignment => {
      const enrollments = classData.students
        .map(({ student }) => student.enrollments.find(e => e.courseId === assignment.courseId))
        .filter(Boolean) as any[]

      const completed = enrollments.filter(e => e.status === 'COMPLETED').length
      const inProgress = enrollments.filter(e => e.status === 'IN_PROGRESS').length
      const notStarted = enrollments.filter(e => e.status === 'NOT_STARTED').length
      const avgProgress = enrollments.reduce((sum, e) => sum + e.progress, 0) / (enrollments.length || 1)
      const avgTimeSpent = enrollments.reduce((sum, e) => sum + (e.timeSpent || 0), 0) / (enrollments.length || 1)

      return {
        courseId: assignment.courseId,
        courseTitle: assignment.course.title,
        dueDate: assignment.dueDate,
        completed,
        inProgress,
        notStarted,
        avgProgress: Math.round(avgProgress),
        avgTimeSpent: Math.round(avgTimeSpent),
        completionRate: Math.round((completed / totalStudents) * 100)
      }
    })

    return NextResponse.json({
      className: classData.name,
      classCode: classData.code,
      summary: {
        totalStudents,
        totalAssignments,
        activeStudents,
        avgCompletionRate: Math.round(avgCompletionRate * 100),
        totalXPEarned: classData.students.reduce((sum, { student }) => sum + student.totalPoints, 0),
        avgXPPerStudent: Math.round(
          classData.students.reduce((sum, { student }) => sum + student.totalPoints, 0) / totalStudents
        )
      },
      progressOverTime,
      atRiskStudents,
      topPerformers,
      courseAnalytics
    })
  } catch (error) {
    console.error('Progress report error:', error)
    return NextResponse.json({ error: 'Failed to generate progress report' }, { status: 500 })
  }
}
