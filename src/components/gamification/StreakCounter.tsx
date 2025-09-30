'use client'

export default function StreakCounter({ streak = 0, target = 7 }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const activeDays = Math.min(streak, 7)

  return (
    <div className="game-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Daily Streak</h3>
          <p className="text-3xl font-bold text-[#ff4b4b] flex items-center gap-2">
            <span className="streak-flame">🔥</span> {streak} days
          </p>
        </div>
        {streak >= 7 && (
          <div className="xp-badge">
            WEEK STREAK!
          </div>
        )}
      </div>
      
      <div className="flex gap-2 justify-between">
        {days.map((day, index) => (
          <div
            key={index}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              index < activeDays
                ? 'bg-gradient-to-br from-[#ff4b4b] to-[#ff6b6b] text-white scale-110 shadow-lg'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {streak > 0 && (
        <div className="mt-4 p-3 bg-orange-50 rounded-xl">
          <p className="text-sm font-semibold text-orange-700">
            Keep it up! {7 - (streak % 7)} more days for bonus XP!
          </p>
        </div>
      )}
    </div>
  )
}