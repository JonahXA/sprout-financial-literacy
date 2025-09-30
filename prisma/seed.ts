import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()

  // Create Michigan State University
  const msu = await prisma.school.create({
    data: {
      name: 'Michigan State University',
      domain: 'msu.edu',
      primaryColor: '#18453B',
      city: 'East Lansing',
      state: 'MI'
    },
  })

  console.log('✅ Created Michigan State University')

  // Create demo users
  const hashedPassword = await bcrypt.hash('Demo123!', 10)
  
  await prisma.user.create({
    data: {
      email: 'demo.student@msu.edu',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Student',
      role: 'STUDENT',
      schoolId: msu.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'demo.teacher@msu.edu',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Teacher',
      role: 'TEACHER',
      schoolId: msu.id,
    },
  })

  // Create courses
  await prisma.course.createMany({
    data: [
      {
        title: 'Personal Budgeting Basics',
        description: 'Learn the fundamentals of creating and maintaining a personal budget',
        category: 'BUDGETING',
        duration: 120,
      },
      {
        title: 'Introduction to Investing',
        description: 'Discover the world of investing and learn how to grow your wealth',
        category: 'INVESTING',
        duration: 180,
      },
      {
        title: 'Understanding Credit Scores',
        description: 'Master the credit system and learn how to build excellent credit',
        category: 'CREDIT',
        duration: 90,
      },
    ],
  })

  console.log('✅ Created courses')
  console.log('\n🎉 Database seeded!')
  console.log('\nDemo Accounts:')
  console.log('  Student: demo.student@msu.edu / Demo123!')
  console.log('  Teacher: demo.teacher@msu.edu / Demo123!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })