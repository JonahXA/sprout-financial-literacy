'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ProgressReport() {
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/teacher/progress-report/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      } else {
        router.push('/teacher')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading progress report...</div>
      </div>
    )
  }

  if (!reportData) return <div className="p-8">Report not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/teacher/class/${params.id}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Class
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Progress Report: {reportData.className}
                </h1>
                <p className="text-sm text-gray-600">Class Code: {reportData.classCode}</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="btn-primary bg-gray-600 hover:bg-gray-700"
            >
              🖨️ Print Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-3xl font-bold text-blue-600">{reportData.summary.totalStudents}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-600">Active Students</p>
            <p className="text-3xl font-bold text-green-600">{reportData.summary.activeStudents}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-600">Assignments</p>
            <p className="text-3xl font-bold text-purple-600">{reportData.summary.totalAssignments}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-3xl font-bold text-green-600">{reportData.summary.avgCompletionRate}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-600">Total XP</p>
            <p className="text-3xl font-bold text-yellow-600">{reportData.summary.totalXPEarned}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-600">Avg XP/Student</p>
            <p className="text-3xl font-bold text-orange-600">{reportData.summary.avgXPPerStudent}</p>
          </div>
        </div>

        {/* At-Risk Students */}
        {reportData.atRiskStudents.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ At-Risk Students</h2>
            <p className="text-sm text-gray-600 mb-4">
              Students with low progress or overdue assignments needing attention
            </p>
            <div className="space-y-3">
              {reportData.atRiskStudents.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Avg Progress</p>
                      <p className="font-semibold text-red-600">{student.avgProgress}%</p>
                    </div>
                    {student.overdueCount > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Overdue</p>
                        <p className="font-semibold text-red-600">{student.overdueCount}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-green-600 mb-4">⭐ Top Performers</h2>
          <div className="space-y-3">
            {reportData.topPerformers.map((student: any, index: number) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      {student.completedCourses} courses completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total XP</p>
                    <p className="font-semibold text-yellow-600">{student.totalPoints}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Streak</p>
                    <p className="font-semibold text-red-600">🔥 {student.currentStreak}</p>
                  </div>
                  {student.avgGrade > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Avg Grade</p>
                      <p className="font-semibold text-green-600">{student.avgGrade}%</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Over Time */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Progress Over Time</h2>
          <div className="flex items-end justify-between gap-4 h-64">
            {reportData.progressOverTime.map((week: any, index: number) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-100 rounded-t-lg relative" style={{ height: `${week.avgProgress}%` }}>
                  <div className="absolute -top-8 left-0 right-0 text-center font-semibold text-sm text-blue-600">
                    {week.avgProgress}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{week.week}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course Analytics */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Course Analytics</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Course</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Due Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Completion</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">In Progress</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Not Started</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Avg Progress</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {reportData.courseAnalytics.map((course: any, index: number) => (
                  <tr key={course.courseId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{course.courseTitle}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {course.dueDate ? new Date(course.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-green-600">{course.completed}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-blue-600">{course.inProgress}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-600">{course.notStarted}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${course.avgProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold">{course.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {course.avgTimeSpent} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
