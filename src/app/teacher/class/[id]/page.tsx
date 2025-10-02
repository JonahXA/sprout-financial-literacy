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
  const [selectedCourse, setSelectedCourse] = useState('')
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
        body: JSON.stringify({ courseId: selectedCourse })
      })
      
      if (res.ok) {
        setShowAssignModal(false)
        setSelectedCourse('')
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
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAssignModal(true)}
                className="btn-primary"
              >
                📚 Assign Course
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Students ({students.length})
              </h2>
              
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No students yet. Share the class code: <span className="font-mono font-bold">{classData.code}</span>
                </p>
              ) : (
                <div className="space-y-2">
                  {students.map((enrollment: any) => (
                    <div key={enrollment.student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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