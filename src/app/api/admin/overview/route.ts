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
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get overview statistics
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSchools,
      totalCourses,
      totalEnrollments
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.class.count(),
      prisma.school.count(),
      prisma.course.count(),
      prisma.enrollment.count()
    ])

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSchools,
      totalCourses,
      totalEnrollments
    })
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
