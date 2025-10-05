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

    const classData = await prisma.class.findFirst({
      where: { 
        id: params.id,
        teacherId: user.id 
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                totalPoints: true,
                currentStreak: true,
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
                    course: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
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

    return NextResponse.json(classData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isActive } = body

    // Verify the class belongs to this teacher
    const existingClass = await prisma.class.findFirst({
      where: {
        id: params.id,
        teacherId: user.id
      }
    })

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error('Update class error:', error)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }
}