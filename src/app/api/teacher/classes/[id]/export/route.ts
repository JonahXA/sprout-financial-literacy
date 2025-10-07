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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the class belongs to this teacher
    const classData = await prisma.class.findFirst({
      where: {
        id: params.id,
        teacherId: user.id
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: {
                    courseId: {
                      in: await prisma.assignment.findMany({
                        where: { classId: params.id },
                        select: { courseId: true }
                      }).then(a => a.map(x => x.courseId))
                    }
                  },
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            course: true
          }
        }
      }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Build CSV data
    const csvRows = []

    // Header row
    const headers = [
      'Student Name',
      'Email',
      'Total XP',
      'Current Streak',
      'Longest Streak',
      ...classData.assignments.map(a => `${a.course.title} - Progress %`),
      ...classData.assignments.map(a => `${a.course.title} - Status`),
      ...classData.assignments.map(a => `${a.course.title} - Completed Date`)
    ]
    csvRows.push(headers.join(','))

    // Data rows
    for (const enrollment of classData.students) {
      const student = enrollment.student
      const row = [
        `"${student.firstName} ${student.lastName}"`,
        student.email,
        student.totalPoints,
        student.currentStreak,
        student.longestStreak
      ]

      // Add course data
      for (const assignment of classData.assignments) {
        const courseEnrollment = student.enrollments.find(e => e.courseId === assignment.courseId)

        if (courseEnrollment) {
          row.push(Math.round(courseEnrollment.progress).toString())
          row.push(courseEnrollment.status)
          row.push(courseEnrollment.completedAt ? new Date(courseEnrollment.completedAt).toLocaleDateString() : '')
        } else {
          row.push('0')
          row.push('NOT_ENROLLED')
          row.push('')
        }
      }

      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${classData.name.replace(/[^a-zA-Z0-9]/g, '_')}_progress_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
