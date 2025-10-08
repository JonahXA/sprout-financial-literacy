'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<any>(null)
  const [lessonData, setLessonData] = useState<any>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sectionState, setSectionState] = useState<any>({})

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)

        // Parse the lesson content
        if (data.lessons && data.lessons[0]) {
          const lesson = data.lessons[0]
          try {
            const parsedContent = JSON.parse(lesson.content)
            setLessonData(parsedContent)
          } catch (e) {
            console.error('Error parsing lesson content:', e)
          }
        }
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const completeSection = async () => {
    // For new curriculum, sections are activities + mastery_check combined
    const totalSections = lessonData?.type === 'duolingo-style-lesson'
      ? (lessonData.activities?.length || 0) + 1 // +1 for quiz at end
      : lessonData?.sections?.length || 0

    if (!lessonData || currentSectionIndex >= totalSections - 1) {
      // Complete the entire lesson
      try {
        const res = await fetch('/api/student/complete-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonId: course.lessons[0].id,
            progressIncrement: 100
          })
        })

        if (res.ok) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error completing lesson:', error)
      }
    } else {
      // Move to next section
      setCurrentSectionIndex(currentSectionIndex + 1)
      setSectionState({})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!course || !lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No lessons available</p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Handle new curriculum format
  if (lessonData.type === 'duolingo-style-lesson') {
    const activities = lessonData.activities || []
    const totalSections = activities.length + 1 // +1 for quiz

    let currentSection
    if (currentSectionIndex === 0) {
      // Welcome screen
      currentSection = { type: 'new-welcome', data: lessonData }
    } else if (currentSectionIndex <= activities.length) {
      // Activity
      currentSection = { type: 'new-activity', data: activities[currentSectionIndex - 1] }
    } else {
      // Quiz from course.lessons[0].quizzes
      currentSection = { type: 'new-quiz', data: course.lessons[0].quizzes?.[0] }
    }

    const progress = ((currentSectionIndex + 1) / totalSections) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
        {/* Header with Progress */}
        <div className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 text-lg font-semibold"
              >
                ✕ Exit
              </button>
              <div className="text-sm text-gray-600">
                Section {currentSectionIndex + 1} of {totalSections}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {renderNewSection(currentSection, sectionState, setSectionState, completeSection)}
        </div>
      </div>
    )
  }

  // Handle old PF Essentials format
  const currentSection = lessonData.sections[currentSectionIndex]
  const progress = ((currentSectionIndex + 1) / lessonData.sections.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
      {/* Header with Progress */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 text-lg font-semibold"
            >
              ✕ Exit
            </button>
            <div className="text-sm text-gray-600">
              Section {currentSectionIndex + 1} of {lessonData.sections.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {renderSection(currentSection, sectionState, setSectionState, completeSection)}
      </div>
    </div>
  )
}

// Render new curriculum sections
function renderNewSection(section: any, state: any, setState: any, onComplete: any) {
  switch (section.type) {
    case 'new-welcome':
      return <NewWelcomeSection section={section} onContinue={onComplete} />
    case 'new-activity':
      return <NewActivitySection section={section} state={state} setState={setState} onComplete={onComplete} />
    case 'new-quiz':
      return <NewQuizSection section={section} state={state} setState={setState} onComplete={onComplete} />
    default:
      return <div>Unknown section type: {section.type}</div>
  }
}

// New Welcome Section for new curriculum
function NewWelcomeSection({ section, onContinue }: any) {
  const data = section.data
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fadeIn">
      <div className="text-6xl mb-6">🎯</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h1>

      <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-semibold text-blue-900 mb-2">📚 What You'll Learn</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {data.objectives?.map((obj: string, i: number) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </div>

      <div className="bg-yellow-50 rounded-xl p-6 mb-8 text-left">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 About This Lesson</h3>
        <p className="text-gray-700">{data.content}</p>
      </div>

      <button
        onClick={onContinue}
        className="btn-primary px-12 py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        Let's Start! →
      </button>
    </div>
  )
}

// New Activity Section
function NewActivitySection({ section, state, setState, onComplete }: any) {
  const activity = section.data
  const [selected, setSelected] = useState(state.selected || null)
  const [showResult, setShowResult] = useState(state.showResult || false)
  const [userInput, setUserInput] = useState(state.userInput || '')

  const handleCheck = () => {
    setShowResult(true)
    setState({ ...state, showResult: true, selected, userInput })
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-gray-900">Practice Activity</h2>
      </div>

      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <p className="text-lg text-gray-800 font-semibold">{activity.prompt}</p>
      </div>

      {/* Handle different activity types */}
      {activity.type === 'drag_categorize' && (
        <DragCategorizeActivity
          activity={activity}
          selected={selected}
          setSelected={setSelected}
          showResult={showResult}
        />
      )}

      {activity.type === 'type_in' && (
        <TypeInActivity
          activity={activity}
          userInput={userInput}
          setUserInput={setUserInput}
          showResult={showResult}
        />
      )}

      {activity.type === 'slider' && (
        <SliderActivity
          activity={activity}
          showResult={showResult}
        />
      )}

      {activity.type === 'scenario_sim' && (
        <ScenarioSimActivity
          activity={activity}
          selected={selected}
          setSelected={setSelected}
          showResult={showResult}
        />
      )}

      {activity.type === 'numeric' && (
        <NumericActivity
          activity={activity}
          userInput={userInput}
          setUserInput={setUserInput}
          showResult={showResult}
        />
      )}

      {activity.type === 'hotspot' && (
        <div className="bg-gray-50 rounded-xl p-8 mb-6 text-center">
          <p className="text-gray-500 italic">Interactive hotspot activity</p>
          <p className="text-sm text-gray-400 mt-2">Target areas: {activity.targets?.join(', ')}</p>
        </div>
      )}

      {showResult && activity.explain && (
        <div className="bg-green-50 rounded-xl p-6 mb-6 border-2 border-green-200">
          <p className="font-semibold text-green-900 mb-2">💡 Explanation</p>
          <p className="text-gray-700">{activity.explain}</p>
        </div>
      )}

      {!showResult ? (
        <button
          onClick={handleCheck}
          disabled={!selected && !userInput && activity.type !== 'slider' && activity.type !== 'hotspot'}
          className={`btn-primary w-full py-4 text-lg font-bold rounded-2xl ${(!selected && !userInput && activity.type !== 'slider' && activity.type !== 'hotspot') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Check Answer
        </button>
      ) : (
        <button
          onClick={onComplete}
          className="btn-primary w-full py-4 text-lg font-bold rounded-2xl"
        >
          Continue →
        </button>
      )}
    </div>
  )
}

function DragCategorizeActivity({ activity, selected, setSelected, showResult }: any) {
  const groups = activity.groups || {}
  const allItems = Object.values(groups).flat() as string[]

  return (
    <div className="space-y-4 mb-6">
      {Object.keys(groups).map((groupName: string) => (
        <div key={groupName} className="border-2 border-gray-300 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">{groupName}</h4>
          <div className="space-y-2">
            {(groups[groupName] as string[]).map((item: string, idx: number) => (
              <div key={idx} className="bg-blue-100 p-3 rounded-lg text-gray-800">
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TypeInActivity({ activity, userInput, setUserInput, showResult }: any) {
  return (
    <div className="mb-6">
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={showResult}
        placeholder="Type your answer here..."
        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none min-h-[100px]"
      />
      {showResult && activity.answer && (
        <div className="mt-4 bg-blue-50 p-4 rounded-xl">
          <p className="font-semibold text-blue-900 mb-2">Example Answer:</p>
          <p className="text-gray-700">{activity.answer}</p>
        </div>
      )}
    </div>
  )
}

function SliderActivity({ activity, showResult }: any) {
  const [value, setValue] = useState(activity.start || activity.min || 0)

  return (
    <div className="mb-6">
      <div className="bg-gray-50 rounded-xl p-6">
        <input
          type="range"
          min={activity.min}
          max={activity.max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-center mt-4">
          <span className="text-3xl font-bold text-blue-600">{value}</span>
        </div>
      </div>
    </div>
  )
}

function ScenarioSimActivity({ activity, selected, setSelected, showResult }: any) {
  const branches = activity.branches || []

  return (
    <div className="space-y-3 mb-6">
      {branches.map((branch: any, idx: number) => (
        <button
          key={idx}
          onClick={() => !showResult && setSelected(idx)}
          disabled={showResult}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selected === idx
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-400'
          } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <p className="font-medium mb-2">{branch.choice}</p>
          {showResult && selected === idx && (
            <p className="text-sm text-gray-600 mt-2">→ {branch.outcome}</p>
          )}
        </button>
      ))}
    </div>
  )
}

function NumericActivity({ activity, userInput, setUserInput, showResult }: any) {
  const isCorrect = showResult && Math.abs(Number(userInput) - activity.answer) <= (activity.tolerance || 0.5)

  return (
    <div className="mb-6">
      <input
        type="number"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        disabled={showResult}
        placeholder="Enter a number..."
        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-center text-2xl font-bold"
      />
      {showResult && (
        <div className={`mt-4 ${isCorrect ? 'bg-green-50' : 'bg-yellow-50'} p-4 rounded-xl`}>
          <p className={`font-semibold ${isCorrect ? 'text-green-900' : 'text-yellow-900'}`}>
            {isCorrect ? '✓ Correct!' : 'Close!'} The answer is {activity.answer}
          </p>
        </div>
      )}
    </div>
  )
}

// New Quiz Section for mastery check
function NewQuizSection({ section, state, setState, onComplete }: any) {
  const quiz = section.data
  if (!quiz) {
    return <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
      <p>No quiz available</p>
      <button onClick={onComplete} className="btn-primary mt-4">Continue →</button>
    </div>
  }

  const [currentQ, setCurrentQ] = useState(state.currentQ || 0)
  const [answers, setAnswers] = useState(state.answers || {})
  const [showResults, setShowResults] = useState(state.showResults || false)

  const questions = quiz.questions || []
  const question = questions[currentQ]

  const handleAnswer = (answerIdx: number) => {
    const newAnswers = { ...answers, [currentQ]: answerIdx }
    setAnswers(newAnswers)
    setState({ ...state, answers: newAnswers })
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setState({ ...state, currentQ: currentQ + 1 })
    } else {
      setShowResults(true)
      setState({ ...state, showResults: true })
    }
  }

  if (showResults) {
    const score = Object.keys(answers).filter((key) => {
      const q = questions[parseInt(key)]
      return answers[key] === q.correctAnswer
    }).length

    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70

    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className={`text-6xl mb-4`}>{passed ? '🎉' : '💪'}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {passed ? 'Great Job!' : 'Keep Learning!'}
        </h2>
        <p className="text-5xl font-bold mb-4" style={{ color: passed ? '#10b981' : '#f59e0b' }}>
          {percentage}%
        </p>
        <p className="text-gray-600 mb-8">
          You got {score} out of {questions.length} correct
        </p>

        {passed && (
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <p className="text-green-900 font-semibold">+10 XP Earned! 🌱</p>
          </div>
        )}

        <button
          onClick={onComplete}
          className="btn-primary px-12 py-4 text-lg font-bold rounded-2xl"
        >
          {passed ? 'Complete Lesson →' : 'Try Again'}
        </button>
      </div>
    )
  }

  if (!question) {
    return <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
      <p>No questions available</p>
      <button onClick={onComplete} className="btn-primary mt-4">Continue →</button>
    </div>
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>📝 Quiz</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h3>

      <div className="space-y-3 mb-8">
        {question.options?.map((option: string, idx: number) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              answers[currentQ] === idx
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={answers[currentQ] === undefined}
        className={`btn-primary w-full py-4 text-lg font-bold rounded-2xl ${answers[currentQ] === undefined ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {currentQ === questions.length - 1 ? 'See Results' : 'Next Question →'}
      </button>
    </div>
  )
}

// OLD CURRICULUM RENDERERS (PF Essentials format)
function renderSection(section: any, state: any, setState: any, onComplete: any) {
  switch (section.type) {
    case 'welcome':
      return <WelcomeSection section={section} onContinue={onComplete} />

    case 'reading_slides':
      return <ReadingSlidesSection section={section} state={state} setState={setState} onComplete={onComplete} />

    case 'flashcards':
      return <FlashcardsSection section={section} state={state} setState={setState} onComplete={onComplete} />

    case 'simulation':
      return <SimulationSection section={section} onComplete={onComplete} />

    case 'scenario':
      return <ScenarioSection section={section} state={state} setState={setState} onComplete={onComplete} />

    case 'quiz':
      return <QuizSection section={section} state={state} setState={setState} onComplete={onComplete} />

    case 'wrap_up':
      return <WrapUpSection section={section} onComplete={onComplete} />

    default:
      return <div>Unknown section type: {section.type}</div>
  }
}

// Welcome Section Component
function WelcomeSection({ section, onContinue }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-fadeIn">
      <div className="text-6xl mb-6">🎯</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Get Ready!</h1>

      <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Story Time</h3>
        <p className="text-gray-700">{section.storyHook}</p>
      </div>

      <div className="bg-yellow-50 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-semibold text-yellow-900 mb-2">🤔 Think About It</h3>
        <p className="text-gray-700">{section.reflection}</p>
      </div>

      <div className="bg-green-50 rounded-xl p-4 mb-8">
        <p className="text-green-900 font-medium">✨ {section.quickFact}</p>
      </div>

      <button
        onClick={onContinue}
        className="btn-primary px-12 py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        Let's Start! →
      </button>
    </div>
  )
}

// Reading Slides Section Component
function ReadingSlidesSection({ section, state, setState, onComplete }: any) {
  const [currentCard, setCurrentCard] = useState(state.currentCard || 0)
  const cards = section.cards

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      const nextCard = currentCard + 1
      setCurrentCard(nextCard)
      setState({ ...state, currentCard: nextCard })
    } else {
      onComplete()
    }
  }

  const card = cards[currentCard]

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Card {currentCard + 1} of {cards.length}</span>
          <span>📖 Reading</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{card.title}</h2>
        <p className="text-lg text-gray-700 leading-relaxed">{card.text}</p>
      </div>

      {card.inlineQuestion && (
        <div className="bg-purple-50 rounded-xl p-6 mb-6">
          <p className="font-semibold text-purple-900 mb-4">{card.inlineQuestion.prompt}</p>
          <div className="space-y-2">
            {['True', 'False'].map((option, index) => (
              <button
                key={index}
                onClick={() => setState({ ...state, answered: true })}
                className="w-full p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-100 transition-all text-left font-medium"
              >
                {option}
              </button>
            ))}
          </div>
          {state.answered && (
            <div className="mt-4 p-4 bg-green-100 rounded-xl text-green-900">
              ✓ {card.inlineQuestion.explanation}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        className="btn-primary w-full py-4 text-lg font-bold rounded-2xl"
      >
        {currentCard === cards.length - 1 ? 'Continue →' : 'Next Card →'}
      </button>
    </div>
  )
}

// Flashcards Section Component
function FlashcardsSection({ section, state, setState, onComplete }: any) {
  const [currentCard, setCurrentCard] = useState(state.currentCard || 0)
  const [flipped, setFlipped] = useState(false)
  const cards = section.cards

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1)
      setFlipped(false)
      setState({ ...state, currentCard: currentCard + 1 })
    } else {
      onComplete()
    }
  }

  const card = cards[currentCard]

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
        <p className="text-gray-600">Card {currentCard + 1} of {cards.length}</p>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="relative h-64 mb-8 cursor-pointer"
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 flex items-center justify-center transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}>
          <div className={`text-white text-center ${flipped ? 'hidden' : 'block'}`}>
            <p className="text-sm uppercase tracking-wide mb-2">Term</p>
            <h3 className="text-3xl font-bold">{card.term}</h3>
            <p className="text-sm mt-4 opacity-75">👆 Tap to flip</p>
          </div>
        </div>

        <div className={`absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-2xl p-8 flex items-center justify-center transition-transform duration-500 ${!flipped ? 'rotate-y-180' : ''}`}>
          <div className={`text-white text-center ${!flipped ? 'hidden' : 'block'}`}>
            <p className="text-sm uppercase tracking-wide mb-2">Definition</p>
            <p className="text-xl">{card.definition}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!flipped}
        className={`btn-primary w-full py-4 text-lg font-bold rounded-2xl ${!flipped ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {currentCard === cards.length - 1 ? 'Finish Flashcards →' : 'Next Card →'}
      </button>
    </div>
  )
}

// Simulation Section Component (Placeholder)
function SimulationSection({ section, onComplete }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold text-gray-900">Interactive Simulation</h2>
      </div>

      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <p className="text-gray-700">{section.description}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-8 mb-8 text-center">
        <p className="text-gray-500 italic">Interactive simulation coming soon!</p>
        <p className="text-sm text-gray-400 mt-2">This will include calculators, sliders, and visual tools</p>
      </div>

      <button
        onClick={onComplete}
        className="btn-primary w-full py-4 text-lg font-bold rounded-2xl"
      >
        Continue →
      </button>
    </div>
  )
}

// Scenario Section Component
function ScenarioSection({ section, state, setState, onComplete }: any) {
  const [selected, setSelected] = useState(state.selected || null)
  const [showResult, setShowResult] = useState(state.showResult || false)

  const handleSelect = (choiceId: string) => {
    setSelected(choiceId)
    setState({ ...state, selected: choiceId })
  }

  const handleCheck = () => {
    setShowResult(true)
    setState({ ...state, showResult: true })
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">💭</div>
        <h2 className="text-2xl font-bold text-gray-900">Real-World Scenario</h2>
      </div>

      <div className="bg-yellow-50 rounded-xl p-6 mb-8">
        <p className="text-lg text-gray-800">{section.prompt}</p>
      </div>

      <div className="space-y-3 mb-8">
        {section.choices.map((choice: any) => (
          <button
            key={choice.id}
            onClick={() => !showResult && handleSelect(choice.id)}
            disabled={showResult}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected === choice.id
                ? showResult
                  ? choice.id === section.answer
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-400'
            } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="font-medium">{choice.text}</span>
            {showResult && choice.id === section.answer && (
              <span className="ml-2 text-green-600">✓ Best choice</span>
            )}
          </button>
        ))}
      </div>

      {showResult && (
        <div className="bg-green-50 rounded-xl p-6 mb-6 border-2 border-green-200">
          <p className="font-semibold text-green-900 mb-2">💡 Explanation</p>
          <p className="text-gray-700">{section.explanation}</p>
        </div>
      )}

      {!showResult ? (
        <button
          onClick={handleCheck}
          disabled={!selected}
          className={`btn-primary w-full py-4 text-lg font-bold rounded-2xl ${!selected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Check Answer
        </button>
      ) : (
        <button
          onClick={onComplete}
          className="btn-primary w-full py-4 text-lg font-bold rounded-2xl"
        >
          Continue →
        </button>
      )}
    </div>
  )
}

// Quiz Section Component
function QuizSection({ section, state, setState, onComplete }: any) {
  const [currentQ, setCurrentQ] = useState(state.currentQ || 0)
  const [answers, setAnswers] = useState(state.answers || {})
  const [showResults, setShowResults] = useState(state.showResults || false)

  const questions = section.questions
  const question = questions[currentQ]

  const handleAnswer = (choiceId: string) => {
    const newAnswers = { ...answers, [currentQ]: choiceId }
    setAnswers(newAnswers)
    setState({ ...state, answers: newAnswers })
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
      setState({ ...state, currentQ: currentQ + 1 })
    } else {
      setShowResults(true)
      setState({ ...state, showResults: true })
    }
  }

  if (showResults) {
    const score = Object.keys(answers).filter((key) => {
      const q = questions[parseInt(key)]
      return answers[key] === q.answer
    }).length

    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70

    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className={`text-6xl mb-4`}>{passed ? '🎉' : '💪'}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {passed ? 'Great Job!' : 'Keep Learning!'}
        </h2>
        <p className="text-5xl font-bold mb-4" style={{ color: passed ? '#10b981' : '#f59e0b' }}>
          {percentage}%
        </p>
        <p className="text-gray-600 mb-8">
          You got {score} out of {questions.length} correct
        </p>

        {passed && (
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <p className="text-green-900 font-semibold">+50 XP Earned! 🌱</p>
          </div>
        )}

        <button
          onClick={onComplete}
          className="btn-primary px-12 py-4 text-lg font-bold rounded-2xl"
        >
          {passed ? 'Continue →' : 'Try Again'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>📝 Quiz</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-6">{question.prompt}</h3>

      <div className="space-y-3 mb-8">
        {question.choices.map((choice: any) => (
          <button
            key={choice.id}
            onClick={() => handleAnswer(choice.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              answers[currentQ] === choice.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {choice.text}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!answers[currentQ]}
        className={`btn-primary w-full py-4 text-lg font-bold rounded-2xl ${!answers[currentQ] ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {currentQ === questions.length - 1 ? 'See Results' : 'Next Question →'}
      </button>
    </div>
  )
}

// Wrap Up Section Component
function WrapUpSection({ section, onComplete }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
      <div className="text-6xl mb-6">🎊</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Awesome Work!</h1>

      <div className="bg-green-50 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-semibold text-green-900 mb-2">📝 Quick Recap</h3>
        <p className="text-gray-700">{section.summary}</p>
      </div>

      <div className="bg-yellow-50 rounded-xl p-6 mb-8 text-left">
        <h3 className="font-semibold text-yellow-900 mb-2">🎯 Your Challenge</h3>
        <p className="text-gray-700">{section.challenge}</p>
      </div>

      <button
        onClick={onComplete}
        className="btn-primary px-12 py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
      >
        Complete Lesson! 🌱
      </button>
    </div>
  )
}
