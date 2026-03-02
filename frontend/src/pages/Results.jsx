import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Results() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState({})
  const [loadingFeedback, setLoadingFeedback] = useState({})

  useEffect(() => {
    loadResults()
  }, [attemptId])

  const loadResults = async () => {
    try {
      const res = await api.get(`/quiz/results/${attemptId}`)
      setResults(res.data)
    } catch (err) {
      console.error('Error loading results:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFeedback = async (answerAttemptId, index) => {
    if (feedbacks[index] || loadingFeedback[index]) return
    setLoadingFeedback(prev => ({ ...prev, [index]: true }))
    try {
      const res = await api.post(`/quiz/feedback/${answerAttemptId}`)
      setFeedbacks(prev => ({ ...prev, [index]: res.data }))
    } catch (err) {
      console.error('Error loading feedback:', err)
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [index]: false }))
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent Work! 🎉'
    if (score >= 60) return 'Good Job! Keep it up! 💪'
    return 'Keep Practicing! 📚'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-400">Loading your results...</p>
      </div>
    </div>
  )

  if (!results) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-red-400">Results not found!</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="text-2xl font-bold text-indigo-400">QuizyFy</div>
        <div className="text-gray-400 text-sm">{results.title}</div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Score Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-2xl font-extrabold mb-1">
            {getScoreMessage(results.score)}
          </h1>
          <p className="text-gray-400 text-sm mb-6">{results.title}</p>
          <div className={`text-7xl font-extrabold mb-2 ${getScoreColor(results.score)}`}>
            {results.score}%
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{results.correct}</div>
              <div className="text-xs text-gray-500 mt-1">Correct ✅</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {results.total - results.correct}
              </div>
              <div className="text-xs text-gray-500 mt-1">Wrong ❌</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">{results.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total 📝</div>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-4 mb-8">
          <h3 className="font-bold text-lg">Question Breakdown</h3>

          {results.answers.map((answer, i) => (
            <div
              key={i}
              className={`rounded-2xl border overflow-hidden ${
                answer.is_correct
                  ? 'border-green-800 bg-green-900/10'
                  : 'border-red-800 bg-red-900/10'
              }`}
            >
              {/* Question info */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">
                    {answer.is_correct ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">
                      {answer.question_text}
                    </p>
                    <div className="text-xs space-y-1">
                      <p className="text-gray-400">
                        Your answer:{' '}
                        <span className={`font-bold ${answer.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                          {answer.selected_answer}. {answer[`option_${answer.selected_answer.toLowerCase()}`]}
                        </span>
                      </p>
                      {!answer.is_correct && (
                        <p className="text-gray-400">
                          Correct answer:{' '}
                          <span className="text-green-400 font-bold">
                            {answer.correct_answer}. {answer[`option_${answer.correct_answer.toLowerCase()}`]}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Get Explanation button */}
                {!answer.is_correct && !feedbacks[i] && (
                  <button
                    onClick={() => loadFeedback(answer.answer_attempt_id, i)}
                    disabled={loadingFeedback[i]}
                    className="mt-3 ml-8 text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-600/50 text-indigo-300 px-3 py-1.5 rounded-lg transition"
                  >
                    {loadingFeedback[i]
                      ? '🧠 Generating explanation...'
                      : '🧠 Get AI Explanation'
                    }
                  </button>
                )}
              </div>

              {/* RAG Explanation */}
              {!answer.is_correct && feedbacks[i] && (
                <div className="border-t border-red-800/50 bg-gray-900/50 p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🧠</span>
                    <div>
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                        AI Explanation (from your lecture notes)
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {feedbacks[i].explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl py-3 font-semibold transition"
          >
            📤 Take Another Quiz
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 border border-gray-700 hover:border-indigo-500 rounded-xl py-3 font-semibold transition"
          >
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
