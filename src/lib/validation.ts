import { z } from 'zod'

/**
 * Authentication Schemas
 */

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  schoolId: z.string().cuid().optional()
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
})

/**
 * Class Schemas
 */

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Class name too long'),
  description: z.string().max(500, 'Description too long').optional()
})

export const joinClassSchema = z.object({
  code: z.string()
    .length(6, 'Join code must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Join code must contain only letters and numbers')
    .transform(val => val.toUpperCase())
})

/**
 * Course Schemas
 */

export const enrollCourseSchema = z.object({
  courseId: z.string().cuid('Invalid course ID')
})

export const completeLessonSchema = z.object({
  lessonId: z.string().cuid('Invalid lesson ID').optional(),
  courseId: z.string().cuid('Invalid course ID').optional(),
  progressIncrement: z.number().min(0).max(100).default(10),
  timeSpent: z.number().min(0).optional() // in seconds
}).refine(
  data => data.lessonId || data.courseId,
  { message: 'Either lessonId or courseId is required' }
)

/**
 * Quiz Schemas
 */

export const submitQuizSchema = z.object({
  answers: z.array(z.union([
    z.string(),
    z.number(),
    z.boolean()
  ])).min(1, 'At least one answer is required'),
  timeSpent: z.number().min(0).optional() // in seconds
})

export const createQuizSchema = z.object({
  lessonId: z.string().cuid('Invalid lesson ID'),
  title: z.string().min(1, 'Quiz title is required').max(200, 'Title too long'),
  questions: z.array(z.object({
    id: z.string().optional(),
    question: z.string().min(1, 'Question text is required'),
    options: z.array(z.string()).min(2, 'At least 2 options required').max(6, 'Maximum 6 options'),
    correctAnswer: z.union([z.string(), z.number()]),
    explanation: z.string().optional()
  })).min(1, 'At least one question is required'),
  passingScore: z.number().min(0).max(100).default(70)
})

/**
 * Assignment Schemas
 */

export const createAssignmentSchema = z.object({
  classId: z.string().cuid('Invalid class ID'),
  courseId: z.string().cuid('Invalid course ID'),
  title: z.string().min(1, 'Assignment title is required').max(200, 'Title too long'),
  dueDate: z.string().datetime().optional().or(z.null()),
  points: z.number().min(0).default(100),
  allowLateSubmissions: z.boolean().default(true)
})

/**
 * Helper function to validate request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(error: z.ZodError<any>): Record<string, string> {
  const formatted: Record<string, string> = {}

  error.issues.forEach((err) => {
    const path = err.path.join('.')
    formatted[path] = err.message
  })

  return formatted
}
