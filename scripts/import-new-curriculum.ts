import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importNewCurriculum() {
  console.log('🎓 Importing New Financial Literacy Curriculum (9 Modules)...\n')

  // Read the curriculum JSON
  const curriculumPath = path.join(process.cwd(), 'financial_literacy_curriculum (2).json')
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
        description: `Master ${module.skills.join(', ')} through interactive lessons and activities.`,
        category: getCategoryFromModuleId(module.module_id),
        duration: module.lessons.length * 15, // Estimate 15 min per lesson
      }
    })

    // Create lessons for this course
    let lessonOrder = 1
    for (const lesson of module.lessons) {
      console.log(`  📝 Creating lesson: ${lesson.title}`)

      const lessonContent = {
        type: 'duolingo-style-lesson',
        lesson_id: lesson.lesson_id,
        title: lesson.title,
        objectives: lesson.objectives,
        content: lesson.content,
        activities: lesson.activities,
        xp: lesson.xp
      }

      const createdLesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: lesson.title,
          description: lesson.objectives.join('. '),
          order: lessonOrder++,
          contentType: 'INTERACTIVE',
          content: JSON.stringify(lessonContent),
          estimatedMinutes: 15,
          xpReward: lesson.xp || 10,
        }
      })

      // Create quiz from mastery_check questions
      if (lesson.mastery_check && lesson.mastery_check.length > 0) {
        const formattedQuestions = lesson.mastery_check.map((q: any, index: number) => {
          if (q.type === 'mcq') {
            return {
              id: index + 1,
              question: q.prompt,
              type: 'multiple-choice',
              options: q.options,
              correctAnswer: q.answer,
              explanation: q.explain,
              points: 10
            }
          } else if (q.type === 'true_false') {
            return {
              id: index + 1,
              question: q.prompt,
              type: 'true-false',
              options: ['True', 'False'],
              correctAnswer: q.answer ? 0 : 1,
              explanation: q.explain,
              points: 10
            }
          } else if (q.type === 'numeric') {
            return {
              id: index + 1,
              question: q.prompt,
              type: 'numeric',
              answer: q.answer,
              tolerance: q.tolerance,
              explanation: q.explain,
              points: 10
            }
          }
          return null
        }).filter((q: any) => q !== null)

        if (formattedQuestions.length > 0) {
          await prisma.quiz.create({
            data: {
              lessonId: createdLesson.id,
              title: `${lesson.title} Check`,
              passingScore: 70,
              questions: formattedQuestions
            }
          })

          console.log(`  ✅ Created quiz with ${formattedQuestions.length} questions`)
        }
      }
    }
  }

  console.log('\n🎉 New curriculum import complete!')
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
    'm1': 'Decision Making',
    'm2': 'Budgeting',
    'm3': 'Banking',
    'm4': 'Credit',
    'm5': 'College',
    'm6': 'Investing',
    'm7': 'Income & Taxes',
    'm8': 'Consumer Skills',
    'm9': 'Insurance'
  }
  return categories[moduleId] || 'General'
}

importNewCurriculum()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
