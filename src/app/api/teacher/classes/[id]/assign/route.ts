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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await request.json()

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

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        classId: params.id,
        courseId: courseId,
        title: 'Course Assignment'
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Assign error:', error)
    return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 })
  }
}