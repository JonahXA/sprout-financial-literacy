import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importPFEssentials() {
  console.log('🎓 Importing PF Essentials 25-Minute Modules...\n')

  // Read the curriculum JSON
  const curriculumPath = path.join(process.cwd(), 'pf_essentials_25min_modules.json')
  const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'))

  // Clear existing data
  console.log('🧹 Clearing existing curriculum data...')
  await prisma.quiz.deleteMany()
  await prisma.lessonCompletion.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  console.log('✅ Cleared old data\n')

  // Create courses from modules
  for (const module of curriculumData.modules) {
    console.log(`📖 Creating course: ${module.title}`)

    const course = await prisma.course.create({
      data: {
        title: module.title,
        description: `Complete this ${module.estimatedTimeMinutes}-minute gamified module covering essential ${module.title.toLowerCase()} concepts.`,
        category: getCategoryFromModuleId(module.moduleId),
        duration: module.estimatedTimeMinutes,
      }
    })

    // Create a comprehensive lesson that contains all sections
    console.log(`  📝 Creating lesson with interactive sections`)

    const lesson = await prisma.lesson.create({
      data: {
        courseId: course.id,
        title: module.title,
        description: `Interactive ${module.estimatedTimeMinutes}-minute learning experience`,
        order: 1,
        contentType: 'INTERACTIVE',
        content: JSON.stringify({
          type: 'pf-essentials-module',
          sections: module.sections
        }),
        estimatedMinutes: module.estimatedTimeMinutes,
        xpReward: 50, // Higher XP for comprehensive modules
      }
    })

    // Extract quiz questions from the quiz section
    const quizSection = module.sections.find((s: any) => s.type === 'quiz')
    if (quizSection && quizSection.questions) {
      const formattedQuestions = quizSection.questions.map((q: any, index: number) => ({
        id: index + 1,
        question: q.prompt,
        type: q.type === 'mcq' ? 'multiple-choice' : 'true-false',
        options: q.choices ? q.choices.map((c: any) => c.text) : q.type === 'true_false' ? ['True', 'False'] : [],
        correctAnswer: q.choices ? q.choices.findIndex((c: any) => c.id === q.answer) : (q.answer === 'true' ? 0 : 1),
        explanation: q.explanation,
        points: 10
      }))

      await prisma.quiz.create({
        data: {
          lessonId: lesson.id,
          title: `${module.title} Assessment`,
          passingScore: 70,
          questions: formattedQuestions
        }
      })

      console.log(`  ✅ Created quiz with ${formattedQuestions.length} questions`)
    }
  }

  console.log('\n🎉 PF Essentials import complete!')
  console.log(`\n📊 Summary:`)
  const courseCount = await prisma.course.count()
  const lessonCount = await prisma.lesson.count()
  const quizCount = await prisma.quiz.count()

  console.log(`  - ${courseCount} courses created`)
  console.log(`  - ${lessonCount} interactive lessons created`)
  console.log(`  - ${quizCount} quizzes created`)
}

function getCategoryFromModuleId(moduleId: string): string {
  const categories: any = {
    'mod-1-mindset': 'Mindset',
    'mod-2-income': 'Income',
    'mod-3-budgeting': 'Budgeting',
    'mod-4-saving': 'Saving',
    'mod-5-investing': 'Investing',
    'mod-6-banking': 'Banking',
    'mod-7-credit': 'Credit',
    'mod-8-credit-cards': 'Credit',
    'mod-9-loans': 'Loans',
    'mod-10-college': 'College',
    'mod-11-taxes': 'Taxes',
    'mod-12-insurance': 'Insurance',
    'mod-13-consumer': 'Consumer Skills',
    'mod-14-planning': 'Planning',
    'mod-15-entrepreneurship': 'Entrepreneurship'
  }
  return categories[moduleId] || 'General'
}

importPFEssentials()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
