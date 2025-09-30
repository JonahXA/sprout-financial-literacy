'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import XPBar from '@/components/gamification/XPBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import AchievementBadges from '@/components/gamification/AchievementBadges'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
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
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌱</div>
          <p className="text-white">Loading your journey...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 gradient-dark text-white">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🌱 Sprout
            <span className="text-xs bg-[#58cc02] px-2 py-1 rounded-full">BETA</span>
          </h2>
          <p className="text-sm opacity-80 mt-1">{user.school?.name}</p>
        </div>
        
        <div className="p-4">
          <XPBar current={450} max={1000} level={3} />
        </div>
        
        <nav className="px-4 mt-4">
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 bg-white bg-opacity-5">
            <span className="text-xl mr-3">🏠</span>
            <span className="font-medium">Learn</span>
          </button>
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">📊</span>
            <span className="font-medium">Progress</span>
          </button>
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">🏆</span>
            <span className="font-medium">Leaderboard</span>
          </button>
          <button className="sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10">
            <span className="text-xl mr-3">🎯</span>
            <span className="font-medium">Challenges</span>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Ready to continue your financial journey?
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#ffc800]">⚡ 450</p>
                <p className="text-xs text-gray-500">Total XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#ff4b4b]">🔥 5</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#1cb0f6] to-[#0a1628] rounded-full flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow-lg">
                {user.firstName[0]}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Daily Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <StreakCounter streak={5} />
            
            <div className="game-card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Goal</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <span className="font-medium">Complete 1 lesson</span>
                  </div>
                  <span className="text-[#58cc02] font-bold">+20 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏳</span>
                    <span className="font-medium">Practice for 10 mins</span>
                  </div>
                  <span className="text-gray-400 font-bold">+15 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <span className="font-medium">Get 80% on quiz</span>
                  </div>
                  <span className="text-gray-400 font-bold">+30 XP</span>
                </div>
              </div>
            </div>

            <AchievementBadges />
          </div>

          {/* Continue Learning Section */}
          <div className="game-card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Continue Learning</h3>
              <button className="text-[#1cb0f6] font-semibold hover:text-[#0a1628]">
                View All →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-[#58cc02] rounded-xl bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">📊</span>
                  <span className="bg-[#58cc02] text-white text-xs font-bold px-2 py-1 rounded-full">
                    IN PROGRESS
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Personal Budgeting Basics</h4>
                <p className="text-sm text-gray-600 mb-3">Lesson 3: Tracking Expenses</p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#58cc02] h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">65%</span>
                </div>
                <button className="btn-success w-full mt-3 py-2 text-sm">
                  Continue →
                </button>
              </div>
              
              <div className="p-4 border-2 border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">💳</span>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                    NEXT UP
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Understanding Credit</h4>
                <p className="text-sm text-gray-600 mb-3">Start your credit journey</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">5 lessons • 45 min</span>
                  <span className="text-sm font-bold text-[#ffc800]">+150 XP</span>
                </div>
                <button className="btn-primary w-full mt-3 py-2 text-sm">
                  Start Course
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="game-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Weekly Leaderboard</h3>
              <span className="text-sm font-semibold text-[#1cb0f6]">You're #2!</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#ffc800] to-[#ff9500] rounded-xl text-white">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <span className="font-bold">Sarah Chen</span>
                </div>
                <span className="font-bold">680 XP</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1cb0f6] to-[#0a1628] rounded-xl text-white">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥈</span>
                  <span className="font-bold">You</span>
                </div>
                <span className="font-bold">450 XP</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥉</span>
                  <span className="font-bold">Mike Johnson</span>
                </div>
                <span className="font-bold">420 XP</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}