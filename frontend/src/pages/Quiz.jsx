import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuiz, startQuiz, submitAnswer, finishQuiz } from '../services/api'

export default function Quiz() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [attemptId, setAttemptId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  const loadQuiz = async () => {
    try {
      const quizRes = await getQuiz(quizId)
      const attemptRes = await startQuiz(quizId)
      setQuiz(quizRes.data)
      setAttemptId(attemptRes.data.quiz_attempt_id)
    } catch (err) {
      console.error('Error loading quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (option) => {
    // Save selected answer for current question
    setSelected(option)
    setAnswers({ ...answers, [currentIndex]: option })
  }

  const handleNext = async () => {
    if (!selected && !answers[currentIndex]) return
    setSubmitting(true)

    try {
      const question = quiz.questions[currentIndex]
      // Submit answer to backend (no feedback shown yet!)
      await submitAnswer({
        quiz_attempt_id: attemptId,
        question_id: question.question_id,
        selected_answer: answers[currentIndex] || selected
      })

      if (currentIndex + 1 >= quiz.questions.length) {
        // Last question - finish quiz and go to results
        await finishQuiz(attemptId)
        navigate(`/results/${attemptId}`)
      } else {
        // Go to next question
        setCurrentIndex(currentIndex + 1)
        setSelected(answers[currentIndex + 1] || null)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelected(answers[currentIndex - 1] || null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-4xl mb-4 animate-bounce">🧠</div>
        <p className="text-gray-400">Loading quiz...</p>
      </div>
    </div>
  )

  if (!quiz) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-red-400">Quiz not found!</p>
    </div>
  )

  const question = quiz.questions[currentIndex]
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ]

  const currentAnswer = answers[currentIndex] || selected
  const progress = ((currentIndex + 1) / quiz.total_questions) * 100

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="text-indigo-400 font-bold text-lg">QuizyFy</div>
        <div className="text-gray-400 text-sm font-medium">{quiz.title}</div>
        <div className="text-gray-400 text-sm">
          {currentIndex + 1} / {quiz.total_questions}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-800">
        <div
          className="h-1.5 bg-indigo-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Question number */}
        <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">
          Question {currentIndex + 1} of {quiz.total_questions}
        </div>

        {/* Question text */}
        <h2 className="text-xl font-bold mb-8 leading-relaxed text-white">
          {question.question_text}
        </h2>

        {/* Options - no correct/wrong colors! */}
        <div className="space-y-3 mb-10">
          {options.map((opt) => (
            <div
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={`flex items-center gap-4 border-2 rounded-xl px-5 py-4 cursor-pointer transition
                ${currentAnswer === opt.key
                  ? 'border-indigo-500 bg-indigo-900/30'
                  : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition
                ${currentAnswer === opt.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400'
                }`}
              >
                {opt.key}
              </div>
              <span className="text-sm text-gray-200">{opt.text}</span>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-xl font-medium transition text-sm"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!currentAnswer || submitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-semibold transition"
          >
            {submitting
              ? 'Saving...'
              : currentIndex + 1 >= quiz.total_questions
                ? 'Finish Quiz →'
                : 'Next Question →'
            }
          </button>
        </div>

        {/* Answer indicators at bottom */}
        <div className="flex gap-2 mt-8 flex-wrap justify-center">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition
                ${i === currentIndex
                  ? 'bg-indigo-600 text-white'
                  : answers[i]
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
