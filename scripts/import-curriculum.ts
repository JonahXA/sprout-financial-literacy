import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Content templates for different lesson types
const generateLessonContent = (module: any, lesson: any): string => {
  const title = lesson.title
  const objectives = module.outcomes.join('\n- ')

  return `# ${title}

## Learning Objectives
- ${objectives}

## Introduction

Welcome to this ${lesson.estMinutes}-minute lesson on ${title.toLowerCase()}!

${getModuleIntro(module.id, lesson.id)}

## Key Concepts

${getKeyConcepts(lesson.skills)}

## Practice What You Learned

Great job! You've learned about ${lesson.skills.join(', ')}.

**Time to apply your knowledge in the quiz below!**
`
}

const getModuleIntro = (moduleId: string, lessonId: string): string => {
  const intros: any = {
    'm1-l1-decisions': `Every day, you make dozens of decisions about money. Should you buy that new game? Save for a car? Grab coffee with friends? Each choice has consequences.

**Opportunity cost** is what you give up when you make a choice. If you spend $50 on a new video game, that's $50 you can't spend on concert tickets or save for college.

### The 5-Step Decision Model

1. **Identify** the decision
2. **List** your options
3. **Consider** pros and cons of each
4. **Choose** the best option
5. **Evaluate** the outcome`,

    'm1-l2-biases': `Companies spend billions on advertising to influence your decisions. But it's not just ads - your brain has built-in biases that affect how you spend.

### Common Biases That Cost You Money

**FOMO (Fear of Missing Out):** "Limited time offer!" creates urgency to buy NOW.

**Anchoring:** Seeing "$100, now $50!" makes $50 seem like a steal (even if it's normally $40).

**Social Proof:** "Everyone's buying it!" makes you want it too.

**Loss Aversion:** You hate losing $10 more than you enjoy gaining $10.`,

    'm2-l1-income-types': `There are two main ways to earn money: **active income** and **passive income**.

**Active Income** = You trade time for money
- Job salary
- Hourly wages
- Freelance work
- Side hustles

**Passive Income** = Money earned with minimal ongoing effort
- Investment dividends
- Rental property income
- Royalties from creative work
- Interest from savings

Most people start with active income, then build passive income over time.`,

    'm2-l2-careers': `Your career choice dramatically impacts your lifetime earnings. But salary isn't everything!

### Total Compensation Package

**Base Salary:** Your regular paycheck

**Benefits:**
- Health insurance (worth $5,000-$15,000/year!)
- 401(k) matching (free money!)
- Paid time off
- Professional development

**Other Factors:**
- Work-life balance
- Growth opportunities
- Job satisfaction

Someone making $50k with great benefits might be better off than someone making $60k with none.`,

    'm3-l1-needs-wants': `The first step to smart budgeting is knowing the difference between **needs** and **wants**.

**NEEDS** = Things you must have to survive
- Rent/housing
- Food (groceries)
- Utilities
- Transportation
- Basic clothing
- Healthcare

**WANTS** = Things that make life enjoyable but aren't essential
- Dining out
- Entertainment
- Latest tech gadgets
- Designer clothes
- Hobbies

**The Gray Area:** Some things can be both! You need transportation (need), but a brand new car vs a reliable used car is want vs need.`,

    'm3-l2-first-budget': `Creating your first budget is easier than you think! Let's break it down step by step.

### Step 1: Calculate Your Income
Add up all money coming in each month (after taxes = "net pay")

### Step 2: List Your Expenses
**Fixed Expenses** (same every month):
- Rent: $____
- Phone: $____
- Insurance: $____

**Variable Expenses** (changes monthly):
- Groceries: $____
- Gas: $____
- Entertainment: $____

### Step 3: Subtract Expenses from Income

**Income - Expenses = What's Left**

If negative: Cut expenses or increase income
If positive: Save it or spend intentionally!

### Step 4: Adjust to Hit Your Goals
Want to save $200/month? Find where to cut $200 in spending.`,
  }

  return intros[lessonId] || `This lesson will help you understand key concepts about ${lessonId}.`
}

const getKeyConcepts = (skills: string[]): string => {
  const concepts: any = {
    'opportunity-cost': '**Opportunity Cost:** What you give up when you choose one option over another.',
    'tradeoffs': '**Trade-offs:** Balancing what you gain vs what you lose in a decision.',
    'bias-detection': '**Bias Detection:** Recognizing when emotions or marketing tricks influence your choices.',
    'ad-literacy': '**Ad Literacy:** Understanding persuasion tactics used in advertising.',
    'income-types': '**Active vs Passive Income:** Active requires ongoing work; passive generates money with minimal effort.',
    'compensation': '**Total Compensation:** Salary + benefits + perks = true value of a job.',
    'benefits': '**Benefits Package:** Health insurance, retirement matching, PTO, and other non-salary perks.',
    'categorization': '**Needs vs Wants:** Distinguishing essential expenses from optional ones.',
    'budget-allocation': '**Budget Allocation:** Dividing your income across different expense categories.',
    'goal-setting': '**SMART Goals:** Specific, Measurable, Achievable, Relevant, Time-bound objectives.',
  }

  return skills.map(skill => concepts[skill] || `**${skill}:** Important financial concept`).join('\n\n')
}

// Generate quiz questions based on assessment structure
const generateQuiz = (lesson: any, module: any): any => {
  const { mcq, tf, scenario } = lesson.assessment
  const questions: any[] = []
  let questionId = 1

  // Generate MCQs
  for (let i = 0; i < mcq; i++) {
    questions.push({
      id: questionId++,
      question: `Question about ${lesson.skills[i % lesson.skills.length]}?`,
      type: 'multiple-choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: `Explanation for this concept.`,
      points: 10
    })
  }

  // Generate T/F
  for (let i = 0; i < tf; i++) {
    questions.push({
      id: questionId++,
      question: `True or False: Statement about ${lesson.skills[i % lesson.skills.length]}?`,
      type: 'true-false',
      options: ['True', 'False'],
      correctAnswer: 0,
      explanation: `Explanation of why this is true/false.`,
      points: 10
    })
  }

  // Generate scenarios
  for (let i = 0; i < scenario; i++) {
    questions.push({
      id: questionId++,
      question: `Scenario: Apply your knowledge of ${lesson.skills[i % lesson.skills.length]} to this situation...`,
      type: 'multiple-choice',
      options: ['Response A', 'Response B', 'Response C', 'Response D'],
      correctAnswer: 0,
      explanation: `This is the best choice because...`,
      points: 15
    })
  }

  return questions
}

async function importCurriculum() {
  console.log('📚 Importing Financial Literacy Curriculum...\n')

  // Read the curriculum JSON
  const curriculumPath = path.join(process.cwd(), 'financial_literacy_curriculum (1).json')
  const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'))

  // Clear existing courses and lessons (except the one we manually created)
  console.log('🧹 Clearing existing curriculum data...')
  await prisma.quiz.deleteMany()
  await prisma.lessonCompletion.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()

  console.log('✅ Cleared old data\n')

  // Create courses from modules
  let courseOrder = 1
  for (const module of curriculumData.modules) {
    console.log(`📖 Creating course: ${module.title}`)

    const course = await prisma.course.create({
      data: {
        title: module.title,
        description: module.objective,
        category: getCategoryFromModule(module.id),
        duration: module.lessons.reduce((sum: number, l: any) => sum + l.estMinutes, 0),
      }
    })

    // Create lessons for this course
    let lessonOrder = 1
    for (const lesson of module.lessons) {
      console.log(`  📝 Creating lesson: ${lesson.title}`)

      const createdLesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: lesson.title,
          description: `Learn about ${lesson.skills.join(', ')}`,
          order: lessonOrder++,
          contentType: getLessonType(lesson.formats),
          content: generateLessonContent(module, lesson),
          estimatedMinutes: lesson.estMinutes,
          xpReward: 10 + (lesson.assessment.scenario * 5), // More XP for scenarios
        }
      })

      // Create quiz for this lesson
      const questions = generateQuiz(lesson, module)
      if (questions.length > 0) {
        await prisma.quiz.create({
          data: {
            lessonId: createdLesson.id,
            title: `${lesson.title} Check`,
            passingScore: 70,
            questions: questions
          }
        })
        console.log(`  ✅ Created quiz with ${questions.length} questions`)
      }
    }

    courseOrder++
  }

  console.log('\n🎉 Curriculum import complete!')
  console.log(`\n📊 Summary:`)
  const courseCount = await prisma.course.count()
  const lessonCount = await prisma.lesson.count()
  const quizCount = await prisma.quiz.count()

  console.log(`  - ${courseCount} courses created`)
  console.log(`  - ${lessonCount} lessons created`)
  console.log(`  - ${quizCount} quizzes created`)
}

function getCategoryFromModule(moduleId: string): string {
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

function getLessonType(formats: string[]): 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'MIXED' {
  if (formats.includes('scenario') || formats.includes('calculator')) return 'INTERACTIVE'
  if (formats.includes('flashcards')) return 'INTERACTIVE'
  return 'MIXED'
}

importCurriculum()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
