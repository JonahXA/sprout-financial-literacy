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

// Helper function to generate readable 6-character join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous chars: 0, O, 1, I
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    // Generate a unique 6-character code
    let code = generateJoinCode()
    let attempts = 0

    // Ensure code is unique (retry up to 10 times if collision)
    while (attempts < 10) {
      const existing = await prisma.class.findUnique({ where: { code } })
      if (!existing) break
      code = generateJoinCode()
      attempts++
    }

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