'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-gradient-to-r from-[#58cc02] to-[#3d9b00]',
    error: 'bg-gradient-to-r from-[#ff4b4b] to-[#ff2d2d]',
    info: 'bg-gradient-to-r from-[#1cb0f6] to-[#0a7ea4]'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  }[type]

  return (
    <div className="fixed top-24 right-8 z-50 animate-fade-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <span className="text-2xl font-bold">{icon}</span>
        <p className="flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white hover:opacity-70 text-xl font-bold ml-2"
        >
          ×
        </button>
      </div>
    </div>
  )
}
