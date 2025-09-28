'use client'

import { useState } from 'react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen gradient-blue flex items-center justify-center">
        <div className="card animate-fade-in max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Sprout</h1>
            <p className="text-gray-600">Financial Literacy for Schools</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="student@lincoln.edu" 
                defaultValue="student@lincoln.edu"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter your password" 
                defaultValue="Student123!"
              />
            </div>
            
            <button type="submit" className="btn-primary w-full mb-4">
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 gradient-blue text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">🌱 Sprout</h2>
          <p className="text-sm opacity-80 mt-1">Lincoln High School</p>
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
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-sm text-gray-600">Keep up the great work</p>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Current Streak</h3>
              <p className="text-3xl font-bold text-gray-900">5 days</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Points</h3>
              <p className="text-3xl font-bold text-gray-900">450</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Courses</h3>
              <p className="text-3xl font-bold text-gray-900">1 / 4</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Badges</h3>
              <p className="text-3xl font-bold text-gray-900">3 / 10</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}