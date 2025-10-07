'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassDescription, setNewClassDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchClasses()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.role !== 'TEACHER') {
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

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/teacher/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName,
          description: newClassDescription
        })
      })
      if (res.ok) {
        setShowCreateClass(false)
        setNewClassName('')
        setNewClassDescription('')
        fetchClasses()
      }
    } catch (error) {
      console.error('Error creating class:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) return <div>Loading...</div>
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
          <h2 className="text-2xl font-bold">🌱 Sprout Teacher</h2>
          <p className="text-sm opacity-80 mt-1">{user.school?.name}</p>
        </div>
        
        <nav className="px-4 mt-4">
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left bg-white bg-opacity-10">
            <span className="text-xl mr-3">👥</span>
            <span className="font-medium">My Classes</span>
          </button>
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">📊</span>
            <span className="font-medium">Progress</span>
          </button>
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">📝</span>
            <span className="font-medium">Assignments</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 border-b-2">
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
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your classes and track student progress</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.firstName} {user.lastName}</span>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {/* Create Class Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateClass(true)}
              className="btn-primary flex items-center gap-2"
            >
              <span>➕</span> Create New Class
            </button>
          </div>

          {/* Create Class Form */}
          {showCreateClass && (
            <div className="game-card mb-6">
              <h3 className="text-lg font-bold mb-4">Create New Class</h3>
              <form onSubmit={createClass}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Period 1 - Financial Literacy"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Brief description of the class..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-success">Create Class</button>
                  <button type="button" onClick={() => setShowCreateClass(false)} className="btn-primary bg-gray-500 hover:bg-gray-600">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="game-card">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-900">{classItem.name}</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{classItem.description || 'No description'}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Students:</span>
                    <span className="font-semibold">{classItem._count?.students || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Join Code:</span>
                    <span className="font-mono font-bold text-blue-600">{classItem.code}</span>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/teacher/class/${classItem.id}`)}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Manage Class →
                </button>
              </div>
            ))}
            
            {classes.length === 0 && !showCreateClass && (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500 mb-4">No classes yet. Create your first class to get started!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}