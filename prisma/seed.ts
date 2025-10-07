import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data in proper order (respecting foreign keys)
  await prisma.quizAttempt.deleteMany()
  await prisma.lessonCompletion.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.classStudent.deleteMany()
  await prisma.class.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.passwordResetToken.deleteMany()
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

  // Add sample lessons to the first course (Personal Budgeting Basics)
  const budgetingCourse = await prisma.course.findFirst({
    where: { title: 'Personal Budgeting Basics' }
  })

  if (budgetingCourse) {
    await prisma.lesson.createMany({
      data: [
        {
          courseId: budgetingCourse.id,
          title: 'What is a Budget?',
          description: 'Learn the fundamentals of budgeting and why it matters',
          order: 1,
          contentType: 'TEXT',
          content: `# What is a Budget?

A budget is a financial plan that helps you track your income and expenses. It's like a roadmap for your money, showing you where your money comes from and where it goes.

## Why Budget?

1. **Control Your Spending** - Know exactly where your money goes
2. **Reach Your Goals** - Save for things that matter to you
3. **Avoid Debt** - Live within your means
4. **Reduce Stress** - Feel confident about your finances

## The Golden Rule

**Spend less than you earn**

This simple rule is the foundation of financial success. A budget helps you follow this rule by making you aware of both your income and your spending.

## Key Concepts

- **Income**: Money you receive (salary, allowance, gifts)
- **Expenses**: Money you spend (bills, food, entertainment)
- **Savings**: Money you set aside for future goals

Remember: A budget isn't about restricting yourself - it's about making intentional choices with your money!`,
          estimatedMinutes: 10,
          xpReward: 10,
        },
        {
          courseId: budgetingCourse.id,
          title: 'The 50/30/20 Rule',
          description: 'A simple framework for allocating your income',
          order: 2,
          contentType: 'TEXT',
          content: `# The 50/30/20 Rule

One of the most popular budgeting methods is the 50/30/20 rule. It's simple, flexible, and perfect for beginners.

## How It Works

Divide your after-tax income into three categories:

### 50% - Needs
Money for essential expenses you can't avoid:
- Rent/mortgage
- Utilities (electricity, water, internet)
- Groceries
- Transportation
- Insurance
- Minimum debt payments

### 30% - Wants
Money for things that make life enjoyable:
- Dining out
- Entertainment
- Hobbies
- Shopping
- Subscriptions (Netflix, Spotify, etc.)
- Travel

### 20% - Savings & Debt Payoff
Money for your future:
- Emergency fund
- Retirement savings
- Extra debt payments
- Investment accounts
- Major purchase savings

## Example

If you earn $2,000/month after taxes:
- $1,000 for needs
- $600 for wants
- $400 for savings/debt

## Pro Tips

- Start by tracking your spending for a month
- Adjust the percentages to fit your situation
- The key is to be consistent and intentional
- If 20% savings seems impossible, start with 10% and work your way up`,
          estimatedMinutes: 12,
          xpReward: 15,
        },
        {
          courseId: budgetingCourse.id,
          title: 'Tracking Your Expenses',
          description: 'Learn how to monitor and categorize your spending',
          order: 3,
          contentType: 'TEXT',
          content: `# Tracking Your Expenses

You can't manage what you don't measure. Expense tracking is the foundation of good budgeting.

## Why Track Expenses?

- **Awareness**: See where your money actually goes
- **Identify Waste**: Find spending you can cut
- **Stay on Budget**: Know if you're overspending
- **Reach Goals Faster**: Make better financial decisions

## Methods for Tracking

### 1. Pen and Paper
- **Pros**: Simple, no technology needed
- **Cons**: Manual, easy to forget

### 2. Spreadsheet (Excel/Google Sheets)
- **Pros**: Customizable, visual charts
- **Cons**: Requires manual entry

### 3. Budgeting Apps
Popular options:
- **Mint**: Free, automatic tracking
- **YNAB (You Need A Budget)**: Zero-based budgeting
- **EveryDollar**: Simple interface
- **PocketGuard**: Shows spending limits

### 4. Bank/Credit Card Apps
- **Pros**: Automatic categorization
- **Cons**: Only tracks card purchases

## Best Practices

1. **Track Daily**: Update at the end of each day
2. **Categorize Everything**: Group similar expenses
3. **Keep Receipts**: For a week, save all receipts
4. **Review Weekly**: Check your progress every 7 days
5. **Adjust Monthly**: Refine your budget based on reality

## Common Categories

**Fixed Expenses** (same each month):
- Rent/mortgage
- Insurance
- Subscriptions
- Loan payments

**Variable Expenses** (changes monthly):
- Groceries
- Utilities
- Gas
- Entertainment
- Dining out

Start tracking today - even if you're not perfect, you'll learn valuable lessons about your spending habits!`,
          estimatedMinutes: 15,
          xpReward: 20,
        },
        {
          courseId: budgetingCourse.id,
          title: 'Creating Your First Budget',
          description: 'Step-by-step guide to building a budget',
          order: 4,
          contentType: 'INTERACTIVE',
          content: `# Creating Your First Budget

Now it's time to create your own budget! Follow these steps:

## Step 1: Calculate Your Income

List all sources of money you receive monthly:
- Job salary/wages (after taxes)
- Side hustle income
- Allowance
- Gifts/other

**Total Monthly Income: $______**

## Step 2: List Your Fixed Expenses

Write down expenses that are the same each month:
- Rent: $______
- Phone: $______
- Internet: $______
- Insurance: $______
- Subscriptions: $______
- Other: $______

**Total Fixed: $______**

## Step 3: Estimate Variable Expenses

Estimate expenses that change monthly (use last month as a guide):
- Groceries: $______
- Gas/Transportation: $______
- Utilities: $______
- Entertainment: $______
- Dining out: $______
- Other: $______

**Total Variable: $______**

## Step 4: Set Savings Goals

Decide how much to save:
- Emergency Fund: $______
- Specific Goal: $______
- Retirement: $______

**Total Savings: $______**

## Step 5: Do the Math

**Income - Expenses - Savings = $_____**

### If Positive:
Great! You have extra to save or spend intentionally.

### If Negative:
You need to either:
1. Increase income
2. Reduce expenses
3. Adjust savings temporarily

## Step 6: Track and Adjust

Your first budget won't be perfect. That's okay! Track your actual spending for a month, then adjust your budget to match reality.

## Action Item

Create your budget this week. Use a notebook, spreadsheet, or app. The important thing is to start!`,
          estimatedMinutes: 20,
          xpReward: 25,
        },
        {
          courseId: budgetingCourse.id,
          title: 'Common Budgeting Mistakes',
          description: 'Avoid these pitfalls when managing your budget',
          order: 5,
          contentType: 'TEXT',
          content: `# Common Budgeting Mistakes

Learn from others' mistakes! Here are the most common budgeting errors and how to avoid them.

## Mistake #1: Being Too Restrictive

**Problem**: Setting unrealistic limits that are impossible to follow
**Solution**: Be realistic. Allow yourself some fun money within reason

## Mistake #2: Forgetting Irregular Expenses

**Problem**: Not planning for annual costs (car registration, gifts, etc.)
**Solution**: Calculate yearly costs, divide by 12, budget monthly

## Mistake #3: Not Having an Emergency Fund

**Problem**: Using credit cards when unexpected costs arise
**Solution**: Start small - even $500 can prevent disaster

## Mistake #4: Ignoring Small Expenses

**Problem**: $5 daily coffee = $150/month you didn't plan for
**Solution**: Track EVERYTHING for one month to see true spending

## Mistake #5: Giving Up After One Bad Month

**Problem**: One slip-up leads to abandoning the budget entirely
**Solution**: Budget is a skill - it takes practice to master

## Mistake #6: Not Involving Your Partner

**Problem**: Only one person budgets, causing conflict
**Solution**: Make it a team effort with regular money meetings

## Mistake #7: Using the Wrong Tools

**Problem**: Method doesn't fit your lifestyle (too complex or too simple)
**Solution**: Try different tools until you find what works

## Mistake #8: Budgeting Only at Month's Start

**Problem**: Not tracking or adjusting throughout the month
**Solution**: Check in weekly, adjust as needed

## Mistake #9: No Buffer Category

**Problem**: Budget so tight there's zero flexibility
**Solution**: Include a "miscellaneous" category for surprises

## Mistake #10: Focusing Only on Cutting

**Problem**: Only thinking about reducing expenses, not increasing income
**Solution**: Also explore side hustles and career advancement

## Remember

Budgeting is personal. What works for others might not work for you. Experiment, adjust, and find your own rhythm. The best budget is the one you'll actually use!`,
          estimatedMinutes: 15,
          xpReward: 20,
        }
      ]
    })

    console.log('✅ Created sample lessons for Personal Budgeting Basics')

    // Add quizzes for each lesson
    const lessons = await prisma.lesson.findMany({
      where: { courseId: budgetingCourse.id },
      orderBy: { order: 'asc' }
    })

    if (lessons.length > 0) {
      // Quiz for Lesson 1: What is a Budget?
      await prisma.quiz.create({
        data: {
          lessonId: lessons[0].id,
          title: 'Budget Basics Check',
          passingScore: 70,
          questions: [
            {
              id: 1,
              question: 'What is the golden rule of budgeting?',
              type: 'multiple-choice',
              options: [
                'Always use cash',
                'Spend less than you earn',
                'Never eat out',
                'Only buy things on sale'
              ],
              correctAnswer: 1,
              explanation: 'The golden rule is to spend less than you earn. This is the foundation of financial success!',
              points: 10
            },
            {
              id: 2,
              question: 'Which of these is an example of income?',
              type: 'multiple-choice',
              options: [
                'Buying groceries',
                'Paying rent',
                'Your salary',
                'Utility bills'
              ],
              correctAnswer: 2,
              explanation: 'Your salary is income - money coming in. The others are expenses - money going out.',
              points: 10
            },
            {
              id: 3,
              question: 'A budget helps you...',
              type: 'multiple-choice',
              options: [
                'Avoid fun activities',
                'Make intentional choices with money',
                'Never spend money',
                'Become rich overnight'
              ],
              correctAnswer: 1,
              explanation: 'A budget is about making intentional choices, not restricting yourself completely!',
              points: 10
            }
          ]
        }
      })

      // Quiz for Lesson 2: The 50/30/20 Rule
      await prisma.quiz.create({
        data: {
          lessonId: lessons[1].id,
          title: 'Master the 50/30/20 Rule',
          passingScore: 70,
          questions: [
            {
              id: 1,
              question: 'In the 50/30/20 rule, what percentage goes to needs?',
              type: 'multiple-choice',
              options: ['20%', '30%', '50%', '70%'],
              correctAnswer: 2,
              explanation: '50% of your income should go to essential needs like rent, utilities, and groceries.',
              points: 10
            },
            {
              id: 2,
              question: 'Which of these is a "want" not a "need"?',
              type: 'multiple-choice',
              options: [
                'Rent payment',
                'Groceries',
                'Netflix subscription',
                'Electric bill'
              ],
              correctAnswer: 2,
              explanation: 'Netflix is entertainment - a want. Rent, groceries, and utilities are needs.',
              points: 10
            },
            {
              id: 3,
              question: 'If you earn $3,000/month after taxes, how much should go to savings using the 50/30/20 rule?',
              type: 'multiple-choice',
              options: ['$300', '$600', '$900', '$1,500'],
              correctAnswer: 1,
              explanation: '20% of $3,000 = $600. This goes to savings and debt payoff.',
              points: 10
            },
            {
              id: 4,
              question: 'True or False: The 50/30/20 rule is flexible and can be adjusted to fit your situation.',
              type: 'true-false',
              options: ['True', 'False'],
              correctAnswer: 0,
              explanation: 'True! The 50/30/20 rule is a guideline. Adjust it based on your circumstances.',
              points: 10
            }
          ]
        }
      })

      // Quiz for Lesson 3: Tracking Your Expenses
      await prisma.quiz.create({
        data: {
          lessonId: lessons[2].id,
          title: 'Expense Tracking Challenge',
          passingScore: 70,
          questions: [
            {
              id: 1,
              question: 'Which expense tracking method is automatic and free?',
              type: 'multiple-choice',
              options: [
                'Pen and paper',
                'Apps like Mint',
                'Excel spreadsheet',
                'Mental math'
              ],
              correctAnswer: 1,
              explanation: 'Apps like Mint automatically track your spending by connecting to your bank account.',
              points: 10
            },
            {
              id: 2,
              question: 'How often should you update your expense tracker?',
              type: 'multiple-choice',
              options: ['Once a year', 'Once a month', 'Once a week', 'Daily'],
              correctAnswer: 3,
              explanation: 'Tracking daily gives you the most accurate picture of your spending habits.',
              points: 10
            },
            {
              id: 3,
              question: 'Which is a fixed expense?',
              type: 'multiple-choice',
              options: [
                'Groceries',
                'Dining out',
                'Rent',
                'Entertainment'
              ],
              correctAnswer: 2,
              explanation: 'Rent is fixed - it stays the same each month. The others vary.',
              points: 10
            },
            {
              id: 4,
              question: 'Why is tracking expenses important?',
              type: 'multiple-choice',
              options: [
                'To feel guilty about purchases',
                'To see where money actually goes',
                'To impress friends',
                'To avoid having fun'
              ],
              correctAnswer: 1,
              explanation: 'Tracking gives you awareness of your spending patterns so you can make better decisions.',
              points: 10
            }
          ]
        }
      })

      // Quiz for Lesson 4: Creating Your First Budget
      await prisma.quiz.create({
        data: {
          lessonId: lessons[3].id,
          title: 'Budget Creation Challenge',
          passingScore: 70,
          questions: [
            {
              id: 1,
              question: 'Sarah earns $2,000/month, spends $1,800, and saves $200. Is her budget balanced?',
              type: 'multiple-choice',
              options: [
                'Yes, perfectly balanced',
                'No, she\'s overspending',
                'No, she needs to save more',
                'Cannot determine'
              ],
              correctAnswer: 0,
              explanation: 'Yes! Income ($2,000) = Expenses ($1,800) + Savings ($200). She\'s spending less than she earns.',
              points: 10
            },
            {
              id: 2,
              question: 'What should you do first when creating a budget?',
              type: 'multiple-choice',
              options: [
                'Cut all entertainment',
                'Calculate your income',
                'Delete your credit cards',
                'Buy a budgeting book'
              ],
              correctAnswer: 1,
              explanation: 'Always start with your income - you need to know how much money you have coming in.',
              points: 10
            },
            {
              id: 3,
              question: 'If your expenses exceed your income, you should...',
              type: 'multiple-choice',
              options: [
                'Ignore it',
                'Use credit cards',
                'Increase income or reduce expenses',
                'Stop budgeting'
              ],
              correctAnswer: 2,
              explanation: 'When expenses exceed income, you need to either earn more or spend less to balance your budget.',
              points: 10
            },
            {
              id: 4,
              question: 'Your first budget will likely be...',
              type: 'multiple-choice',
              options: [
                'Perfect and never need changes',
                'Wrong and need adjustments',
                'Too complicated to use',
                'Exactly like everyone else\'s'
              ],
              correctAnswer: 1,
              explanation: 'Your first budget is a starting point! Track actual spending and adjust as needed.',
              points: 10
            }
          ]
        }
      })

      // Quiz for Lesson 5: Common Budgeting Mistakes
      await prisma.quiz.create({
        data: {
          lessonId: lessons[4].id,
          title: 'Avoid These Mistakes!',
          passingScore: 70,
          questions: [
            {
              id: 1,
              question: 'Spending $4 on coffee daily equals how much per month (30 days)?',
              type: 'multiple-choice',
              options: ['$40', '$80', '$120', '$160'],
              correctAnswer: 2,
              explanation: '$4 × 30 days = $120/month. Small daily expenses add up quickly!',
              points: 10
            },
            {
              id: 2,
              question: 'What should you do if you fail to stick to your budget one month?',
              type: 'multiple-choice',
              options: [
                'Give up budgeting',
                'Feel guilty forever',
                'Adjust and try again',
                'Never have fun again'
              ],
              correctAnswer: 2,
              explanation: 'One bad month doesn\'t mean failure. Learn from it, adjust, and keep going!',
              points: 10
            },
            {
              id: 3,
              question: 'How should you handle irregular expenses like annual insurance?',
              type: 'multiple-choice',
              options: [
                'Ignore them until they happen',
                'Divide yearly cost by 12 and budget monthly',
                'Use emergency fund',
                'Put on credit card'
              ],
              correctAnswer: 1,
              explanation: 'Plan ahead! Divide annual costs by 12 and save monthly so you\'re ready when the bill comes.',
              points: 10
            },
            {
              id: 4,
              question: 'A good emergency fund to start with is...',
              type: 'multiple-choice',
              options: ['$50', '$500', '$5,000', '$50,000'],
              correctAnswer: 1,
              explanation: 'Start with $500-$1,000. This covers most minor emergencies and is achievable for beginners.',
              points: 10
            },
            {
              id: 5,
              question: 'True or False: Your budget should be so tight you never enjoy life.',
              type: 'true-false',
              options: ['True', 'False'],
              correctAnswer: 1,
              explanation: 'False! A sustainable budget includes fun money. Being too restrictive leads to burnout.',
              points: 10
            }
          ]
        }
      })

      console.log('✅ Created quizzes for all lessons')
    }
  }

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