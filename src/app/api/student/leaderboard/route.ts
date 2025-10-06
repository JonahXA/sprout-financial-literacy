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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get top students from the same school
    const leaderboard = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'STUDENT'
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalPoints: true,
        currentStreak: true
      }
    })

    // Find current user's rank
    const userRank = leaderboard.findIndex(student => student.id === user.id) + 1

    return NextResponse.json({
      leaderboard,
      userRank: userRank || null,
      userId: user.id
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
