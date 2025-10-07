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

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    // Verify student is in the class
    const enrollment = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId: user.id
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 404 })
    }

    // Remove student from class
    await prisma.classStudent.delete({
      where: {
        classId_studentId: {
          classId,
          studentId: user.id
        }
      }
    })

    return NextResponse.json({ message: 'Successfully left class' })
  } catch (error) {
    console.error('Leave class error:', error)
    return NextResponse.json({ error: 'Failed to leave class' }, { status: 500 })
  }
}
