import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { sendEmail, emailTemplates } from '@/lib/email'

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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, dueDate } = await request.json()

    // Verify the class belongs to this teacher
    const classData = await prisma.class.findFirst({
      where: { 
        id: params.id,
        teacherId: user.id 
      }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check if already assigned
    const existing = await prisma.assignment.findFirst({
      where: {
        classId: params.id,
        courseId: courseId
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Course already assigned' }, { status: 400 })
    }

    // Get all students in the class with full details for email
    const classStudents = await prisma.classStudent.findMany({
      where: { classId: params.id },
      include: {
        student: true
      }
    })

    // Get course details for email
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Create assignment and enroll all students in the course
    const assignment = await prisma.assignment.create({
      data: {
        classId: params.id,
        courseId: courseId,
        title: 'Course Assignment',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    // Auto-enroll all students in the class to this course
    await Promise.all(
      classStudents.map(({ studentId }) =>
        prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: studentId,
              courseId: courseId
            }
          },
          create: {
            userId: studentId,
            courseId: courseId,
            status: 'NOT_STARTED',
            progress: 0
          },
          update: {} // If already enrolled, don't change anything
        })
      )
    )

    // Send email notifications to all students
    await Promise.all(
      classStudents.map(async ({ student }) => {
        const template = emailTemplates.assignmentCreated(
          student.firstName,
          course.title,
          dueDate
        )

        return sendEmail({
          to: student.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })
    )

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Assign error:', error)
    return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 })
  }
}