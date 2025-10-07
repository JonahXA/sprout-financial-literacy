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

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        status: 'NOT_STARTED',
        progress: 0
      },
      include: {
        course: true
      }
    })

    return NextResponse.json({
      success: true,
      enrollment,
      message: `Successfully enrolled in ${course.title}`
    })
  } catch (error) {
    console.error('Enroll course error:', error)
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 })
  }
}
