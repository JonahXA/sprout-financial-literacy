'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [schools, setSchools] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/schools')
      const data = await res.json()
      setSchools(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching schools:', error)
      setLoading(false)
    }
  }

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSchoolSelect = (school: any) => {
    sessionStorage.setItem('selectedSchool', JSON.stringify(school))
    router.push('/register')
  }

  return (
    <div className="min-h-screen gradient-blue flex items-center justify-center p-4">
      <div className="card animate-fade-in max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Sprout</h1>
          <p className="text-lg text-gray-600 mb-2">Financial Literacy Platform for Schools</p>
          <p className="text-gray-500">Start by finding your school</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for your school
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type your school name..."
            className="input-field"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading schools...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolSelect(school)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{school.name}</h3>
                      {school.city && school.state && (
                        <p className="text-sm text-gray-500">{school.city}, {school.state}</p>
                      )}
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No schools found matching "{searchTerm}"</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}