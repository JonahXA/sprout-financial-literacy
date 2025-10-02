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
      where: { id: decoded.userId },
      include: { school: true }
    })
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: user.id },
      include: {
        _count: {
          select: { students: true, assignments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(classes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    // Generate a unique 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        code,
        teacherId: user.id,
        schoolId: user.schoolId!
      },
      include: {
        _count: {
          select: { students: true, assignments: true }
        }
      }
    })

    return NextResponse.json(newClass)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}