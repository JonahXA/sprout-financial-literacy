'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'teachers' | 'students' | 'classes'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [overview, setOverview] = useState<any>(null)
  const [schools, setSchools] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchOverview()
      fetchSchools()
      fetchTeachers()
      fetchStudents()
      fetchClasses()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.role !== 'SUPER_ADMIN') {
          router.push('/dashboard')
        }
        setUser(data)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview')
      if (res.ok) {
        const data = await res.json()
        setOverview(data)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
    }
  }

  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/admin/schools')
      if (res.ok) {
        const data = await res.json()
        setSchools(data)
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/admin/teachers')
      if (res.ok) {
        const data = await res.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">👑</div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`w-72 gradient-dark text-white fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            👑 Super Admin
          </h2>
          <p className="text-sm opacity-80 mt-1">Sprout Platform</p>
        </div>

        <nav className="px-4 mt-4">
          <button
            onClick={() => {
              setActiveTab('overview')
              setSidebarOpen(false)
            }}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'overview' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">📊</span>
            <span className="font-medium">Overview</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('schools')
              setSidebarOpen(false)
            }}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'schools' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">🏫</span>
            <span className="font-medium">Schools</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('teachers')
              setSidebarOpen(false)
            }}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'teachers' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">👨‍🏫</span>
            <span className="font-medium">Teachers</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('students')
              setSidebarOpen(false)
            }}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'students' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">👨‍🎓</span>
            <span className="font-medium">Students</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('classes')
              setSidebarOpen(false)
            }}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'classes' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">📚</span>
            <span className="font-medium">Classes</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all"
          >
            <span className="text-xl mr-3">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 border-b-2 border-gray-100">
          <div className="flex justify-between items-center">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 lg:flex-none">
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all schools, teachers, and students</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.firstName} {user.lastName}</span>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                👑
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Overview Tab */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <p className="text-sm opacity-90">Total Schools</p>
                    <p className="text-4xl font-bold mt-2">{overview.totalSchools}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <p className="text-sm opacity-90">Total Teachers</p>
                    <p className="text-4xl font-bold mt-2">{overview.totalTeachers}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <p className="text-sm opacity-90">Total Students</p>
                    <p className="text-4xl font-bold mt-2">{overview.totalStudents}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                    <p className="text-sm opacity-90">Total Classes</p>
                    <p className="text-4xl font-bold mt-2">{overview.totalClasses}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl">
                    <p className="text-sm opacity-90">Total Courses</p>
                    <p className="text-4xl font-bold mt-2">{overview.totalCourses}</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-xl">
                    <p className="text-sm opacity-90">Total Enrollments</p>
                    <p className="text-4xl font-bold mt-2">{overview.totalEnrollments}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schools Tab */}
          {activeTab === 'schools' && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Schools</h2>

                {schools.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">School Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Domain</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Users</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Classes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schools.map((school, index) => (
                          <tr key={school.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-900">{school.name}</td>
                            <td className="px-4 py-3 text-gray-600">{school.city}, {school.state}</td>
                            <td className="px-4 py-3 text-gray-600">{school.domain || 'N/A'}</td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-600">{school._count.users}</td>
                            <td className="px-4 py-3 text-center font-semibold text-green-600">{school._count.classes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No schools found</p>
                )}
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Teachers</h2>

                {teachers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">School</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Classes</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((teacher, index) => (
                          <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {teacher.firstName} {teacher.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{teacher.email}</td>
                            <td className="px-4 py-3 text-gray-600">{teacher.school?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-600">
                              {teacher.teachingClasses.length}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-green-600">
                              {teacher.teachingClasses.reduce((sum: number, cls: any) => sum + cls._count.students, 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No teachers found</p>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Students</h2>

                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">School</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">XP</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Streak</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Classes</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Enrollments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, index) => (
                          <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{student.email}</td>
                            <td className="px-4 py-3 text-gray-600">{student.school?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-center font-semibold text-yellow-600">
                              {student.totalPoints}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-red-600">
                              {student.currentStreak} 🔥
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-600">
                              {student.enrolledClasses.length}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-green-600">
                              {student._count.enrollments}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No students found</p>
                )}
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Classes</h2>

                {classes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teacher</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">School</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Code</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Students</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Assignments</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((classItem, index) => (
                          <tr key={classItem.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-medium text-gray-900">{classItem.name}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {classItem.teacher.firstName} {classItem.teacher.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{classItem.school?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">
                              {classItem.code}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-green-600">
                              {classItem._count.students}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-purple-600">
                              {classItem._count.assignments}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                classItem.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {classItem.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No classes found</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
