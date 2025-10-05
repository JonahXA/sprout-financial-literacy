'use client'

import { useState } from 'react'

interface AchievementBadgesProps {
  totalPoints: number
  currentStreak: number
  completedCourses: number
}

interface Badge {
  id: number
  name: string
  icon: string
  earned: boolean
  description: string
  category: string
}

export default function AchievementBadges({ totalPoints, currentStreak, completedCourses }: AchievementBadgesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const badges: Badge[] = [
    // Getting Started
    { id: 1, name: 'First Steps', icon: '🎯', earned: totalPoints > 0, description: 'Earn your first XP', category: 'Getting Started' },
    { id: 2, name: 'Beginner', icon: '🌱', earned: totalPoints >= 50, description: 'Reach 50 XP', category: 'Getting Started' },
    { id: 3, name: 'Rising Star', icon: '⭐', earned: totalPoints >= 100, description: 'Reach 100 XP', category: 'Getting Started' },

    // XP Milestones
    { id: 4, name: 'Dedicated', icon: '💪', earned: totalPoints >= 250, description: 'Reach 250 XP', category: 'XP Milestones' },
    { id: 5, name: 'Champion', icon: '👑', earned: totalPoints >= 500, description: 'Reach 500 XP', category: 'XP Milestones' },
    { id: 6, name: 'Legend', icon: '🏆', earned: totalPoints >= 1000, description: 'Reach 1000 XP', category: 'XP Milestones' },
    { id: 7, name: 'Master', icon: '💎', earned: totalPoints >= 2000, description: 'Reach 2000 XP', category: 'XP Milestones' },

    // Streaks
    { id: 8, name: 'On Fire', icon: '🔥', earned: currentStreak >= 3, description: '3 day streak', category: 'Streaks' },
    { id: 9, name: 'Week Warrior', icon: '⚔️', earned: currentStreak >= 7, description: '7 day streak', category: 'Streaks' },
    { id: 10, name: 'Unstoppable', icon: '🚀', earned: currentStreak >= 14, description: '14 day streak', category: 'Streaks' },
    { id: 11, name: 'Legendary', icon: '⚡', earned: currentStreak >= 30, description: '30 day streak', category: 'Streaks' },
    { id: 12, name: 'Marathon', icon: '🏃', earned: currentStreak >= 100, description: '100 day streak', category: 'Streaks' },

    // Courses
    { id: 13, name: 'Course Master', icon: '🎓', earned: completedCourses >= 1, description: 'Complete 1 course', category: 'Courses' },
    { id: 14, name: 'Scholar', icon: '📚', earned: completedCourses >= 3, description: 'Complete 3 courses', category: 'Courses' },
    { id: 15, name: 'Expert', icon: '🧠', earned: completedCourses >= 5, description: 'Complete 5 courses', category: 'Courses' },
    { id: 16, name: 'Professor', icon: '👨‍🏫', earned: completedCourses >= 10, description: 'Complete 10 courses', category: 'Courses' },

    // Special
    { id: 17, name: 'Overachiever', icon: '🌟', earned: totalPoints >= 500 && currentStreak >= 7, description: '500 XP + 7 day streak', category: 'Special' },
    { id: 18, name: 'Perfectionist', icon: '💯', earned: completedCourses >= 5 && currentStreak >= 14, description: '5 courses + 14 day streak', category: 'Special' },
    { id: 19, name: 'Elite', icon: '🥇', earned: totalPoints >= 1000 && completedCourses >= 10, description: '1000 XP + 10 courses', category: 'Special' },
  ]

  const categories = ['all', 'Getting Started', 'XP Milestones', 'Streaks', 'Courses', 'Special']

  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(b => b.category === selectedCategory)

  const earnedCount = badges.filter(b => b.earned).length

  return (
    <div className="game-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
        <span className="text-sm font-semibold text-[#58cc02]">{earnedCount}/{badges.length} Unlocked</span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedCategory === category
                ? 'bg-[#1cb0f6] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredBadges.map((badge) => (
          <div
            key={badge.id}
            className={`relative p-3 rounded-xl text-center transition-all duration-300 cursor-pointer ${
              badge.earned
                ? 'bg-gradient-to-br from-[#ffc800] to-[#ff9500] text-white shadow-lg transform hover:scale-105'
                : 'bg-gray-100 text-gray-400 opacity-60'
            }`}
            title={badge.description}
          >
            <div className="text-3xl mb-1">{badge.icon}</div>
            <p className="text-xs font-bold">{badge.name}</p>
            {badge.earned && (
              <div className="absolute -top-1 -right-1 bg-[#58cc02] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                ✓
              </div>
            )}
            {!badge.earned && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}