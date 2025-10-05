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
  const [showXPNotification, setShowXPNotification] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
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

  const completeLesson = async (courseId: string) => {
    try {
      const res = await fetch('/api/student/complete-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, progressIncrement: 10 })
      })

      if (res.ok) {
        const data = await res.json()

        // Show XP notification
        setXpEarned(data.xpEarned)
        setShowXPNotification(true)
        setTimeout(() => setShowXPNotification(false), 3000)

        // Show level up animation if leveled up
        if (data.leveledUp) {
          setShowLevelUp(true)
          setTimeout(() => setShowLevelUp(false), 4000)
        }

        // Refresh user data
        fetchUserData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to complete lesson')
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
      alert('Failed to complete lesson')
    }
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
          <XPBar current={user.totalPoints || 0} max={1000} level={Math.floor((user.totalPoints || 0) / 100) + 1} />
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
                <p className="text-2xl font-bold text-[#ffc800]">⚡ {user.totalPoints || 0}</p>
                <p className="text-xs text-gray-500">Total XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#ff4b4b]">🔥 {user.currentStreak || 0}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#1cb0f6] to-[#0a1628] rounded-full flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow-lg">
                {user.firstName[0]}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
	{/* Join Class Section - For Students Only */}
          {user.role === 'STUDENT' && (
            <div className="game-card mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Join a Class</h3>
              <p className="text-sm text-gray-600 mb-4">Enter the class code from your teacher to join</p>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const code = (e.target as any).code.value.toUpperCase()
                try {
                  const res = await fetch('/api/student/join-class', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                  })
                  const data = await res.json()
                  if (res.ok) {
                    alert(`Successfully joined ${data.className}!`)
                    ;(e.target as any).code.value = ''
                  } else {
                    alert(data.error || 'Invalid class code')
                  }
                } catch (error) {
                  alert('Failed to join class')
                }
              }}>
                <div className="flex gap-3">
                  <input
                    name="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="input-field flex-1"
                    maxLength={6}
                    required
                    style={{textTransform: 'uppercase'}}
                  />
                  <button type="submit" className="btn-primary">
                    Join Class →
                  </button>
                </div>
              </form>
            </div>
          )}
	{/* My Classes Section - For Students */}
          {user.role === 'STUDENT' && user.enrolledClasses && user.enrolledClasses.length > 0 && (
            <div className="game-card mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">My Classes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.enrolledClasses.map((enrollment: any) => (
                  <div key={enrollment.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-sm">{enrollment.class.name}</p>
                    <p className="text-xs text-gray-500">Teacher: {enrollment.class.teacher.firstName} {enrollment.class.teacher.lastName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Daily Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <StreakCounter streak={user.currentStreak || 0} />
            
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

          {/* My Courses Section - For Students */}
          {user.role === 'STUDENT' && (
            <div className="game-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">My Courses</h3>
              </div>

              {user.enrollments && user.enrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.enrollments.map((enrollment: any) => {
                    const isInProgress = enrollment.status === 'IN_PROGRESS' || enrollment.progress > 0
                    const isCompleted = enrollment.status === 'COMPLETED'

                    return (
                      <div
                        key={enrollment.id}
                        className={`p-4 border-2 rounded-xl ${
                          isCompleted
                            ? 'border-gray-300 bg-gray-50'
                            : isInProgress
                            ? 'border-[#58cc02] bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl">📚</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            isCompleted
                              ? 'bg-gray-300 text-gray-700'
                              : isInProgress
                              ? 'bg-[#58cc02] text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isCompleted ? 'COMPLETED' : isInProgress ? 'IN PROGRESS' : 'NOT STARTED'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{enrollment.course.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{enrollment.course.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 mr-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#58cc02] h-2 rounded-full"
                                style={{width: `${enrollment.progress}%`}}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{Math.round(enrollment.progress)}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          {enrollment.course.duration} minutes • {enrollment.course.category}
                        </div>
                        <button
                          onClick={() => completeLesson(enrollment.courseId)}
                          disabled={isCompleted}
                          className={`w-full mt-3 py-2 text-sm ${
                            isCompleted
                              ? 'btn-primary bg-gray-400 cursor-not-allowed'
                              : isInProgress
                              ? 'btn-success'
                              : 'btn-primary'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : isInProgress ? 'Continue Lesson (+10 XP)' : 'Start Course (+10 XP)'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">No courses assigned yet</p>
                  <p className="text-sm text-gray-400">Your teacher will assign courses soon!</p>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Preview */}
          <div className="game-card mb-6">
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

          {/* Teacher Portal Button */}
          {user.role === 'TEACHER' && (
            <div className="game-card bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Teacher Portal</h3>
                  <p className="text-gray-600">Access your teacher dashboard to manage classes and track student progress</p>
                </div>
                <button 
                  onClick={() => router.push('/teacher')}
                  className="btn-primary bg-purple-600 hover:bg-purple-700"
                >
                  Go to Teacher Dashboard →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* XP Notification */}
      {showXPNotification && (
        <div className="fixed top-24 right-8 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-[#ffc800] to-[#ff9500] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="font-bold text-lg">+{xpEarned} XP</p>
              <p className="text-sm opacity-90">Great job!</p>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-fade-in max-w-md">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Level Up!</h2>
            <p className="text-xl text-gray-600 mb-4">
              You're now Level {Math.floor((user?.totalPoints || 0) / 100) + 1}
            </p>
            <p className="text-gray-500">Keep up the amazing work!</p>
          </div>
        </div>
      )}
    </div>
  )
}