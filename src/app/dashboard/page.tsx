'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import XPBar from '@/components/gamification/XPBar'
import StreakCounter from '@/components/gamification/StreakCounter'
import AchievementBadges from '@/components/gamification/AchievementBadges'
import Toast from '@/components/Toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showXPNotification, setShowXPNotification] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'learn' | 'progress' | 'leaderboard' | 'challenges'>('learn')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [completingLesson, setCompletingLesson] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchLeaderboard()
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

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/student/leaderboard')
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard)
        setUserRank(data.userRank)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const leaveClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to leave "${className}"? You'll need a new join code to rejoin.`)) return

    try {
      const res = await fetch('/api/student/leave-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId })
      })

      if (res.ok) {
        setToast({ message: `Successfully left ${className}`, type: 'success' })
        fetchUserData()
      } else {
        const data = await res.json()
        setToast({ message: data.error || 'Failed to leave class', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Failed to leave class', type: 'error' })
    }
  }

  const completeLesson = async (courseId: string) => {
    setCompletingLesson(courseId)
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

        // Refresh user data and leaderboard
        await fetchUserData()
        await fetchLeaderboard()
      } else {
        const error = await res.json()
        setToast({ message: error.error || 'Failed to complete lesson', type: 'error' })
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
      setToast({ message: 'Failed to complete lesson', type: 'error' })
    } finally {
      setCompletingLesson(null)
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
          <button
            onClick={() => setActiveTab('learn')}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'learn' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">🏠</span>
            <span className="font-medium">Learn</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'progress' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">📊</span>
            <span className="font-medium">Progress</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'leaderboard' ? 'bg-white bg-opacity-10' : ''}`}
          >
            <span className="text-xl mr-3">🏆</span>
            <span className="font-medium">Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`sidebar-item flex items-center px-4 py-3 rounded-xl mb-2 w-full text-left hover:bg-white hover:bg-opacity-10 transition-all ${activeTab === 'challenges' ? 'bg-white bg-opacity-10' : ''}`}
          >
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
          {/* Learn Tab */}
          {activeTab === 'learn' && (
            <>
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
                    setToast({ message: `Successfully joined ${data.className}!`, type: 'success' })
                    ;(e.target as any).code.value = ''
                    fetchUserData()
                  } else {
                    setToast({ message: data.error || 'Invalid class code', type: 'error' })
                  }
                } catch (error) {
                  setToast({ message: 'Failed to join class', type: 'error' })
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
                  <div key={enrollment.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{enrollment.class.name}</p>
                      <p className="text-xs text-gray-500">Teacher: {enrollment.class.teacher.firstName} {enrollment.class.teacher.lastName}</p>
                    </div>
                    <button
                      onClick={() => leaveClass(enrollment.class.id, enrollment.class.name)}
                      className="text-red-500 hover:text-red-700 text-sm ml-3"
                      title="Leave class"
                    >
                      Leave
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Gamification Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <StreakCounter streak={user.currentStreak || 0} />

            <AchievementBadges
              totalPoints={user.totalPoints || 0}
              currentStreak={user.currentStreak || 0}
              completedCourses={user.enrollments?.filter((e: any) => e.status === 'COMPLETED').length || 0}
            />
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
                          disabled={isCompleted || completingLesson === enrollment.courseId}
                          className={`w-full mt-3 py-2 text-sm flex items-center justify-center gap-2 ${
                            isCompleted
                              ? 'btn-primary bg-gray-400 cursor-not-allowed'
                              : isInProgress
                              ? 'btn-success'
                              : 'btn-primary'
                          }`}
                        >
                          {completingLesson === enrollment.courseId ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <span>{isCompleted ? '✓ Completed' : isInProgress ? 'Continue Lesson (+10 XP)' : 'Start Course (+10 XP)'}</span>
                          )}
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
              <h3 className="text-xl font-bold text-gray-900">School Leaderboard</h3>
              {userRank && (
                <span className="text-sm font-semibold text-[#1cb0f6]">You're #{userRank}!</span>
              )}
            </div>
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 5).map((student, index) => {
                  const isCurrentUser = student.id === user?.id
                  const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        index === 0
                          ? 'bg-gradient-to-r from-[#ffc800] to-[#ff9500] text-white'
                          : isCurrentUser
                          ? 'bg-gradient-to-r from-[#1cb0f6] to-[#0a1628] text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{medal}</span>
                        <span className="font-bold">
                          {isCurrentUser ? 'You' : `${student.firstName} ${student.lastName}`}
                        </span>
                      </div>
                      <span className="font-bold">{student.totalPoints} XP</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No students yet. Start learning to get on the leaderboard!</p>
                </div>
              )}
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
            </>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h2>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-[#ffc800] to-[#ff9500] text-white p-4 rounded-xl">
                    <p className="text-sm opacity-90">Total XP</p>
                    <p className="text-3xl font-bold">{user.totalPoints || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#ff4b4b] to-[#ff2d2d] text-white p-4 rounded-xl">
                    <p className="text-sm opacity-90">Current Streak</p>
                    <p className="text-3xl font-bold">{user.currentStreak || 0} 🔥</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#58cc02] to-[#3d9b00] text-white p-4 rounded-xl">
                    <p className="text-sm opacity-90">Courses Completed</p>
                    <p className="text-3xl font-bold">
                      {user.enrollments?.filter((e: any) => e.status === 'COMPLETED').length || 0}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#1cb0f6] to-[#0a7ea4] text-white p-4 rounded-xl">
                    <p className="text-sm opacity-90">Current Level</p>
                    <p className="text-3xl font-bold">{Math.floor((user.totalPoints || 0) / 100) + 1}</p>
                  </div>
                </div>

                {/* Course Progress Details */}
                <h3 className="text-lg font-bold text-gray-900 mb-4">Course Progress</h3>
                {user.enrollments && user.enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {user.enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-900">{enrollment.course.title}</h4>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            enrollment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : enrollment.progress > 0
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {enrollment.status === 'COMPLETED' ? '✓ Completed' : enrollment.progress > 0 ? 'In Progress' : 'Not Started'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-[#58cc02] h-3 rounded-full transition-all"
                                style={{width: `${enrollment.progress}%`}}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-right">
                            {Math.round(enrollment.progress)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Started: {new Date(enrollment.startedAt).toLocaleDateString()}
                          {enrollment.completedAt && ` • Completed: ${new Date(enrollment.completedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No courses enrolled yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <div className="game-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">School Leaderboard</h2>
                  {userRank && (
                    <div className="bg-[#1cb0f6] text-white px-4 py-2 rounded-full font-bold">
                      Your Rank: #{userRank}
                    </div>
                  )}
                </div>

                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((student, index) => {
                      const isCurrentUser = student.id === user?.id
                      const medal = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : null

                      return (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                            index === 0
                              ? 'bg-gradient-to-r from-[#ffc800] to-[#ff9500] text-white shadow-lg'
                              : index === 1
                              ? 'bg-gradient-to-r from-[#c0c0c0] to-[#a8a8a8] text-white shadow-md'
                              : index === 2
                              ? 'bg-gradient-to-r from-[#cd7f32] to-[#b87333] text-white shadow-md'
                              : isCurrentUser
                              ? 'bg-gradient-to-r from-[#1cb0f6] to-[#0a1628] text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold min-w-[3rem]">
                              {medal || `#${index + 1}`}
                            </span>
                            <div>
                              <p className="font-bold text-lg">
                                {isCurrentUser ? 'You' : `${student.firstName} ${student.lastName}`}
                              </p>
                              <p className={`text-sm ${index < 3 || isCurrentUser ? 'opacity-90' : 'text-gray-600'}`}>
                                {student.currentStreak > 0 && `🔥 ${student.currentStreak} day streak`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{student.totalPoints}</p>
                            <p className={`text-xs ${index < 3 || isCurrentUser ? 'opacity-90' : 'text-gray-600'}`}>XP</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No leaderboard data yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-6">
              <div className="game-card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Challenges</h2>

                <div className="space-y-4">
                  {/* Complete a lesson */}
                  <div className={`p-4 rounded-xl border-2 ${
                    user.totalPoints > 0 ? 'bg-green-50 border-[#58cc02]' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">
                          {user.totalPoints > 0 ? '✅' : '⏳'}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900">Complete a Lesson</h3>
                          <p className="text-sm text-gray-600">Earn XP by completing any lesson today</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#ffc800]">+20 XP</p>
                      </div>
                    </div>
                  </div>

                  {/* Maintain streak */}
                  <div className={`p-4 rounded-xl border-2 ${
                    user.currentStreak >= 3 ? 'bg-green-50 border-[#58cc02]' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">
                          {user.currentStreak >= 3 ? '✅' : '🔥'}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900">Build a 3-Day Streak</h3>
                          <p className="text-sm text-gray-600">
                            Learn for 3 days in a row ({user.currentStreak}/3)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#ffc800]">+50 XP</p>
                      </div>
                    </div>
                  </div>

                  {/* Complete a course */}
                  <div className={`p-4 rounded-xl border-2 ${
                    (user.enrollments?.filter((e: any) => e.status === 'COMPLETED').length || 0) > 0
                      ? 'bg-green-50 border-[#58cc02]'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">
                          {(user.enrollments?.filter((e: any) => e.status === 'COMPLETED').length || 0) > 0 ? '✅' : '🎓'}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900">Complete a Course</h3>
                          <p className="text-sm text-gray-600">Finish any course at 100%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#ffc800]">+100 XP</p>
                      </div>
                    </div>
                  </div>

                  {/* Reach 100 XP */}
                  <div className={`p-4 rounded-xl border-2 ${
                    user.totalPoints >= 100 ? 'bg-green-50 border-[#58cc02]' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">
                          {user.totalPoints >= 100 ? '✅' : '⭐'}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900">Reach 100 XP</h3>
                          <p className="text-sm text-gray-600">
                            Earn a total of 100 XP ({user.totalPoints}/100)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#58cc02]">Achievement!</p>
                      </div>
                    </div>
                  </div>
                </div>
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}