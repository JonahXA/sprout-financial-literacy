'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ClassDetail() {
  const [classData, setClassData] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [progressFilter, setProgressFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all')
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    fetchClassData()
    fetchCourses()
  }, [])

  const fetchClassData = async () => {
    try {
      const res = await fetch(`/api/teacher/classes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setClassData(data)
        setStudents(data.students || [])
        setAssignments(data.assignments || [])
      } else {
        router.push('/teacher')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      if (res.ok) {
        const data = await res.json()
        setAvailableCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const assignCourse = async () => {
    if (!selectedCourse) return

    try {
      const res = await fetch(`/api/teacher/classes/${params.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          dueDate: dueDate || null
        })
      })

      if (res.ok) {
        setShowAssignModal(false)
        setSelectedCourse('')
        setDueDate('')
        fetchClassData()
      }
    } catch (error) {
      console.error('Error assigning course:', error)
    }
  }

  const removeStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the class?')) return

    try {
      const res = await fetch(`/api/teacher/classes/${params.id}/remove-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })

      if (res.ok) {
        fetchClassData()
      }
    } catch (error) {
      console.error('Error removing student:', error)
    }
  }

  const updateClass = async () => {
    if (!editName.trim()) return

    try {
      const res = await fetch(`/api/teacher/classes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription
        })
      })

      if (res.ok) {
        setShowEditModal(false)
        fetchClassData()
      }
    } catch (error) {
      console.error('Error updating class:', error)
    }
  }

  const archiveClass = async () => {
    if (!confirm('Archive this class? Students will no longer be able to access it.')) return

    try {
      const res = await fetch(`/api/teacher/classes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      })

      if (res.ok) {
        router.push('/teacher')
      }
    } catch (error) {
      console.error('Error archiving class:', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!classData) return <div className="p-8">Class not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/teacher')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
                <p className="text-sm text-gray-600">Class Code: <span className="font-mono font-bold text-blue-600">{classData.code}</span></p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  setEditName(classData.name)
                  setEditDescription(classData.description || '')
                  setShowEditModal(true)
                }}
                className="btn-primary bg-gray-600 hover:bg-gray-700"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="btn-primary"
              >
                📚 Assign
              </button>
              <a
                href={`/api/teacher/classes/${params.id}/export`}
                download
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                📊 Export CSV
              </a>
              <button
                onClick={archiveClass}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                🗄️ Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Students ({students.length})
                </h2>

                {/* Progress Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setProgressFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      progressFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setProgressFilter('not_started')}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      progressFilter === 'not_started' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Not Started
                  </button>
                  <button
                    onClick={() => setProgressFilter('in_progress')}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      progressFilter === 'in_progress' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setProgressFilter('completed')}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      progressFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No students yet. Share the class code: <span className="font-mono font-bold">{classData.code}</span>
                </p>
              ) : (
                <div className="space-y-2">
                  {students.filter((enrollment: any) => {
                    if (progressFilter === 'all') return true

                    const studentEnrollments = enrollment.student.enrollments || []
                    const hasNotStarted = studentEnrollments.some((e: any) => e.progress === 0)
                    const hasInProgress = studentEnrollments.some((e: any) => e.progress > 0 && e.progress < 100)
                    const hasCompleted = studentEnrollments.some((e: any) => e.progress === 100)

                    if (progressFilter === 'not_started') return hasNotStarted
                    if (progressFilter === 'in_progress') return hasInProgress
                    if (progressFilter === 'completed') return hasCompleted
                    return true
                  }).map((enrollment: any) => (
                    <div key={enrollment.student.id} className="p-4 bg-gray-50 rounded-lg mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                            {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {enrollment.student.firstName} {enrollment.student.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{enrollment.student.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeStudent(enrollment.student.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Progress indicators */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white rounded p-2">
                          <p className="text-gray-500">XP Earned</p>
                          <p className="font-bold text-lg text-[#ffc800]">{enrollment.student.totalPoints || 0}</p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-gray-500">Streak</p>
                          <p className="font-bold text-lg text-[#ff4b4b]">{enrollment.student.currentStreak || 0} 🔥</p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-gray-500">Avg Progress</p>
                          <p className="font-bold text-lg text-[#58cc02]">
                            {enrollment.student.enrollments && enrollment.student.enrollments.length > 0
                              ? Math.round(
                                  enrollment.student.enrollments.reduce((sum: number, e: any) => sum + e.progress, 0) /
                                  enrollment.student.enrollments.length
                                )
                              : 0}%
                          </p>
                        </div>
                      </div>

                      {/* Course Progress Details */}
                      {enrollment.student.enrollments && enrollment.student.enrollments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {enrollment.student.enrollments.map((courseEnrollment: any) => {
                            const progress = Math.round(courseEnrollment.progress)
                            const status = progress === 0 ? 'not_started' : progress === 100 ? 'completed' : 'in_progress'

                            return (
                              <div key={courseEnrollment.id} className="bg-white rounded p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                      status === 'completed' ? 'bg-green-500' :
                                      status === 'in_progress' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}></span>
                                    <p className="text-xs font-medium text-gray-700">{courseEnrollment.course?.title || 'Course'}</p>
                                  </div>
                                  <span className="text-xs font-bold text-gray-600">{progress}%</span>
                                </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-[#58cc02] h-1.5 rounded-full"
                                  style={{width: `${courseEnrollment.progress}%`}}
                                ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assignments */}
          <div>
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Assigned Courses ({assignments.length})
              </h2>
              
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">
                  No courses assigned yet
                </p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment: any) => (
                    <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-sm text-gray-900">{assignment.course.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {assignment.course.duration} minutes
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Class Stats */}
            <div className="card mt-6">
              <h3 className="font-bold text-gray-900 mb-3">Class Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Students:</span>
                  <span className="font-bold">{students.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courses Assigned:</span>
                  <span className="font-bold">{assignments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Progress:</span>
                  <span className="font-bold">0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Class</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field"
                placeholder="e.g., Period 1 - Financial Literacy"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Brief description..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={updateClass}
                disabled={!editName.trim()}
                className="btn-success flex-1"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-primary bg-gray-500 hover:bg-gray-600 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Course</h3>
            
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-field mb-4"
            >
              <option value="">Select a course...</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.duration} min)
                </option>
              ))}
            </select>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={assignCourse}
                disabled={!selectedCourse}
                className="btn-success flex-1"
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedCourse('')
                  setDueDate('')
                }}
                className="btn-primary bg-gray-500 hover:bg-gray-600 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}