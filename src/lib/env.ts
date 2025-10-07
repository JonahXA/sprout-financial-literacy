/**
 * Environment Variable Validation
 *
 * This file validates that all required environment variables are present
 * and properly configured. Import this at application startup to fail fast
 * if configuration is missing.
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string

  // Authentication
  JWT_SECRET: string

  // Email (optional in development)
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string

  // Application
  NEXT_PUBLIC_BASE_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
}

/**
 * Validates required environment variables
 * @throws Error if any required variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = []

  // Required variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required')
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long')
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    errors.push('NEXT_PUBLIC_BASE_URL is required')
  }

  // Production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.RESEND_API_KEY) {
      errors.push('RESEND_API_KEY is required in production')
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      errors.push('RESEND_FROM_EMAIL is required in production')
    }

    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
      errors.push('JWT_SECRET must be changed from the default value in production')
    }
  }

  // Throw error if any validations failed
  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    )
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL!,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
  }
}

/**
 * Get validated environment config
 * Call this once at application startup
 */
export const env = validateEnv()

/**
 * Helper to check if running in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Helper to check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development'
