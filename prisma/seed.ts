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

  await prisma.user.create({
    data: {
      email: 'admin@sprout.edu',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      schoolId: msu.id,
    },
  })

  console.log('✅ Created demo users')

  // Create courses
  await prisma.course.createMany({
    data: [
      {
        title: 'Personal Budgeting Basics',
        description: 'Learn the fundamentals of creating and maintaining a personal budget',
        category: 'Budgeting',
        duration: 120,
      },
      {
        title: 'Smart Saving Strategies',
        description: 'Discover effective ways to save money and build an emergency fund',
        category: 'Saving',
        duration: 90,
      },
      {
        title: 'Introduction to Investing',
        description: 'Understand stocks, bonds, and mutual funds to start building wealth',
        category: 'Investing',
        duration: 180,
      },
      {
        title: 'Understanding Credit Scores',
        description: 'Master the credit system and learn how to build excellent credit',
        category: 'Credit',
        duration: 90,
      },
      {
        title: 'Credit Cards 101',
        description: 'Learn how to use credit cards responsibly and avoid debt traps',
        category: 'Credit',
        duration: 75,
      },
      {
        title: 'Banking Basics',
        description: 'Navigate checking accounts, savings accounts, and online banking',
        category: 'Banking',
        duration: 60,
      },
      {
        title: 'Introduction to Taxes',
        description: 'Understand how taxes work and learn basic tax filing strategies',
        category: 'Taxes',
        duration: 150,
      },
      {
        title: 'Student Loans & Financial Aid',
        description: 'Make informed decisions about paying for college and managing student debt',
        category: 'Loans',
        duration: 120,
      },
      {
        title: 'Retirement Planning for Beginners',
        description: 'Start planning for retirement with 401(k)s, IRAs, and compound interest',
        category: 'Retirement',
        duration: 135,
      },
      {
        title: 'Insurance Essentials',
        description: 'Understand health, auto, renters, and life insurance coverage',
        category: 'Insurance',
        duration: 100,
      },
      {
        title: 'Side Hustles & Income Streams',
        description: 'Explore ways to earn extra income and build multiple revenue sources',
        category: 'Income',
        duration: 90,
      },
      {
        title: 'Financial Goal Setting',
        description: 'Create SMART financial goals and develop a plan to achieve them',
        category: 'Planning',
        duration: 75,
      },
      {
        title: 'Avoiding Financial Scams',
        description: 'Protect yourself from fraud, identity theft, and common money scams',
        category: 'Security',
        duration: 60,
      },
    ],
  })

  console.log('✅ Created courses')
  console.log('\n🎉 Database seeded!')
  console.log('\nDemo Accounts:')
  console.log('  Student: demo.student@msu.edu / Demo123!')
  console.log('  Teacher: demo.teacher@msu.edu / Demo123!')
  console.log('  Super Admin: admin@sprout.edu / Demo123!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })