'use client'

export default function XPBar({ current = 0, max = 100, level = 1 }) {
  const percentage = (current / max) * 100

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ffc800] to-[#ff9500] rounded-full flex items-center justify-center text-white font-bold text-lg">
            {level}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">LEVEL {level}</p>
            <p className="text-sm font-bold text-gray-900">{current} / {max} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#58cc02]">+10</p>
          <p className="text-xs text-gray-500">Today</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#58cc02] to-[#4caf00] rounded-full progress-fill shadow-inner"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}