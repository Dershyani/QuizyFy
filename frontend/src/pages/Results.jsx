import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Results() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading results...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-6">🎯</div>
        <h1 className="text-3xl font-extrabold mb-2">Quiz Complete!</h1>
        <p className="text-gray-400 mb-10">Here's how you did</p>

        {results && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
            <div className="text-6xl font-extrabold text-indigo-400 mb-2">
              {results.score}%
            </div>
            <div className="text-gray-400 mb-6">
              {results.correct} out of {results.total} correct
            </div>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{results.correct}</div>
                <div className="text-xs text-gray-500 mt-1">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{results.total - results.correct}</div>
                <div className="text-xs text-gray-500 mt-1">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{results.total}</div>
                <div className="text-xs text-gray-500 mt-1">Total</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition"
          >
            Take Another Quiz
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}