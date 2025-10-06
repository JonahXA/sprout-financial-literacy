import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function getUser() {
  const token = cookies().get('token')
  if (!token) return null
  
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { userId: string }
    return await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
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

    const { code } = await request.json()
    
    // Find class by code
    const classToJoin = await prisma.class.findFirst({
      where: { 
        code: code.toUpperCase(),
        isActive: true
      }
    })

    if (!classToJoin) {
      return NextResponse.json({ error: 'Invalid class code' }, { status: 400 })
    }

    // Check if student is already in the class
    const existing = await prisma.classStudent.findUnique({
      where: {
        classId_studentId: {
          classId: classToJoin.id,
          studentId: user.id
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'You are already in this class' }, { status: 400 })
    }

    // Add student to class
    await prisma.classStudent.create({
      data: {
        classId: classToJoin.id,
        studentId: user.id
      }
    })

    return NextResponse.json({ 
      success: true, 
      className: classToJoin.name 
    })
  } catch (error) {
    console.error('Join class error:', error)
    return NextResponse.json({ error: 'Failed to join class' }, { status: 500 })
  }
}