import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a school
  const school = await prisma.school.create({
    data: {
      name: 'Lincoln High School',
      domain: 'lincoln.edu',
    },
  })

  // Create users
  const hashedPassword = await bcrypt.hash('Student123!', 10)
  
  await prisma.user.create({
    data: {
      email: 'student@lincoln.edu',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Thompson',
      role: 'STUDENT',
      schoolId: school.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'teacher@lincoln.edu',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'TEACHER',
      schoolId: school.id,
    },
  })

  // Create courses
  await prisma.course.createMany({
    data: [
      {
        title: 'Personal Budgeting Basics',
        description: 'Learn the fundamentals of budgeting',
        category: 'BUDGETING',
        duration: 120,
      },
      {
        title: 'Introduction to Investing',
        description: 'Start your investment journey',
        category: 'INVESTING',
        duration: 180,
      },
    ],
  })

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })