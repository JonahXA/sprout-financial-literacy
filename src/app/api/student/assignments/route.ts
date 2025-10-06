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

export async function GET() {
  try {
    const user = await getUser()
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all classes the student is in
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId: user.id },
      select: { classId: true }
    })

    const classIds = studentClasses.map(c => c.classId)

    // Get all assignments for those classes
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: classIds }
      },
      include: {
        course: true,
        class: {
          include: {
            teacher: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Get enrollment status for each course
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: assignment.courseId
            }
          }
        })

        return {
          ...assignment,
          enrollment
        }
      })
    )

    return NextResponse.json(assignmentsWithStatus)
  } catch (error) {
    console.error('Assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
