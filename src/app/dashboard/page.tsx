'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 gradient-blue text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">🌱 Sprout</h2>
          <p className="text-sm opacity-80 mt-1">{user.school?.name}</p>
        </div>
        
        <nav className="px-4">
          <button className="sidebar-item flex items-center px-4 py-3 rounded-lg mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">🏠</span>
            <span className="font-medium">Dashboard</span>
          </button>
          <button className="sidebar-item flex items-center px-4 py-3 rounded-lg mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">📚</span>
            <span className="font-medium">My Courses</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
          >
            <span className="text-xl mr-3">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.firstName}!
              </h1>
              <p className="text-sm text-gray-600">
                {user.role === 'STUDENT' ? 'Student' : 'Teacher'} at {user.school?.name}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Sprout at {user.school?.name}! Start your financial literacy journey by exploring available courses.
            </p>
            <button className="btn-primary">
              Browse Courses →
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}