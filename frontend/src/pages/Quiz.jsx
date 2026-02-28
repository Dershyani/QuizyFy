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
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState([])

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
    if (feedback) return // already answered
    setSelected(option)
  }

  const handleSubmitAnswer = async () => {
    if (!selected || submitting) return
    setSubmitting(true)

    try {
      const question = quiz.questions[currentIndex]
      const res = await submitAnswer({
        quiz_attempt_id: attemptId,
        question_id: question.question_id,
        selected_answer: selected
      })
      setFeedback(res.data)
      setAnswers([...answers, res.data])
    } catch (err) {
      console.error('Error submitting answer:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (currentIndex + 1 >= quiz.questions.length) {
      // Last question - finish quiz
      try {
        await finishQuiz(attemptId)
        navigate(`/results/${attemptId}`)
      } catch (err) {
        console.error('Error finishing quiz:', err)
      }
    } else {
      setCurrentIndex(currentIndex + 1)
      setSelected(null)
      setFeedback(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-4xl mb-4">🧠</div>
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

  const getOptionStyle = (key) => {
    if (!feedback) {
      return selected === key
        ? 'border-indigo-500 bg-indigo-900/30'
        : 'border-gray-700 hover:border-gray-500'
    }
    if (key === feedback.correct_answer) return 'border-green-500 bg-green-900/20'
    if (key === selected && !feedback.is_correct) return 'border-red-500 bg-red-900/20'
    return 'border-gray-700 opacity-50'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="text-indigo-400 font-bold text-lg">QuizyFy</div>
        <div className="text-gray-400 text-sm">{quiz.title}</div>
        <div className="text-gray-400 text-sm">
          Question {currentIndex + 1} of {quiz.total_questions}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-1 bg-indigo-500 transition-all"
          style={{ width: `${((currentIndex + 1) / quiz.total_questions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">
          Question {currentIndex + 1}
        </div>
        <h2 className="text-xl font-bold mb-8 leading-relaxed">
          {question.question_text}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {options.map((opt) => (
            <div
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={`flex items-center gap-4 border-2 rounded-xl px-5 py-4 cursor-pointer transition ${getOptionStyle(opt.key)}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                ${selected === opt.key && !feedback ? 'bg-indigo-600' : 'bg-gray-800'}
                ${feedback && opt.key === feedback.correct_answer ? 'bg-green-600' : ''}
                ${feedback && opt.key === selected && !feedback?.is_correct ? 'bg-red-600' : ''}
              `}>
                {opt.key}
              </div>
              <span className="text-sm">{opt.text}</span>
            </div>
          ))}
        </div>

        {/* Feedback box */}
        {feedback && (
          <div className={`rounded-xl p-4 mb-6 border ${feedback.is_correct ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
            <div className="font-bold mb-1">
              {feedback.is_correct ? '✅ Correct!' : '❌ Incorrect!'}
            </div>
            <div className="text-sm text-gray-300">
              Correct answer: <span className="font-bold text-white">Option {feedback.correct_answer}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between">
          {!feedback ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selected || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl py-3 font-semibold transition"
            >
              {submitting ? 'Checking...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl py-3 font-semibold transition"
            >
              {currentIndex + 1 >= quiz.total_questions ? 'Finish Quiz →' : 'Next Question →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}