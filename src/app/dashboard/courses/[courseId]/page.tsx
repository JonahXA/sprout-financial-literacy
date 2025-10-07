'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completingLesson, setCompletingLesson] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
        setLessons(data.lessons || [])
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const completeLesson = async () => {
    setCompletingLesson(true)
    try {
      const res = await fetch('/api/student/complete-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId: lessons[currentLessonIndex].id,
          progressIncrement: 100 / lessons.length
        })
      })

      if (res.ok) {
        // Move to next lesson or back to dashboard if done
        if (currentLessonIndex < lessons.length - 1) {
          setCurrentLessonIndex(currentLessonIndex + 1)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    } finally {
      setCompletingLesson(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!course || lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No lessons available</p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentLesson = lessons[currentLessonIndex]
  const progress = ((currentLessonIndex + 1) / lessons.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕ Exit
            </button>
            <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
            <div className="w-6"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#58cc02] h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lesson {currentLessonIndex + 1} of {lessons.length}
          </p>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">📖</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="text-gray-600 mt-1">{currentLesson.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
            <span>⏱️ {currentLesson.estimatedMinutes} minutes</span>
            <span>⚡ {currentLesson.xpReward} XP</span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
              {currentLesson.contentType}
            </span>
          </div>

          <div className="prose prose-lg max-w-none mb-8">
            <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
              disabled={currentLessonIndex === 0}
              className={`px-6 py-3 rounded-xl font-medium ${
                currentLessonIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Previous
            </button>

            <button
              onClick={completeLesson}
              disabled={completingLesson}
              className="btn-primary px-8 py-3 flex items-center gap-2"
            >
              {completingLesson ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {currentLessonIndex === lessons.length - 1
                    ? 'Complete Course →'
                    : 'Next Lesson →'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
