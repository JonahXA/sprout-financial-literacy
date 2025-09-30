'use client'

const badges = [
  { id: 1, name: 'First Steps', icon: '🎯', earned: true, xp: 10, description: 'Complete your first lesson' },
  { id: 2, name: 'Week Warrior', icon: '⚔️', earned: true, xp: 50, description: '7 day streak' },
  { id: 3, name: 'Budget Master', icon: '💰', earned: false, xp: 100, description: 'Complete budgeting course' },
  { id: 4, name: 'Quick Learner', icon: '⚡', earned: false, xp: 25, description: 'Complete 3 lessons in one day' },
  { id: 5, name: 'Perfect Score', icon: '💯', earned: false, xp: 75, description: 'Get 100% on any quiz' },
  { id: 6, name: 'Night Owl', icon: '🦉', earned: false, xp: 20, description: 'Study after 10 PM' },
]

export default function AchievementBadges() {
  return (
    <div className="game-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
        <span className="text-sm font-semibold text-[#58cc02]">2/6 Unlocked</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`relative p-3 rounded-xl text-center transition-all duration-300 cursor-pointer ${
              badge.earned
                ? 'bg-gradient-to-br from-[#ffc800] to-[#ff9500] text-white shadow-lg transform hover:scale-105'
                : 'bg-gray-100 text-gray-400 opacity-60'
            }`}
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