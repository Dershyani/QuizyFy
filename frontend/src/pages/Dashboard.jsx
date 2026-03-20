import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../services/api'
import { BookOpen, Target, Clock, Upload } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('name')
  const studentId = localStorage.getItem('student_id')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await getDashboard()
      setData(res.data)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="text-2xl font-bold text-indigo-400">QuizyFy</div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{studentId}</span>
          <span className="text-white font-medium">{name}</span>
          <button
            onClick={logout}
            className="px-4 py-2 text-red-400 hover:text-red-300 transition text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">
              Welcome back, {name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-400 text-sm">
              Here is your quiz activity so far
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition text-sm"
          >
            <Upload className="w-4 h-4" />
            New Quiz
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <>
            {/* Total Quizzes Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-600/30 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-0.5">Total Quizzes Taken</p>
                <p className="text-4xl font-extrabold text-white">
                  {data?.total_quizzes || 0}
                </p>
              </div>
            </div>

            {/* Quiz History */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="font-bold">Quiz History</h3>
              </div>

              {data?.history.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">
                    No quizzes taken yet
                  </p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition"
                  >
                    Take your first quiz
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {data.history.map((attempt, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                          <Target className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{attempt.title}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {attempt.total_questions} questions
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(attempt.completed_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-extrabold ${getScoreColor(attempt.score)}`}>
                          {attempt.score}%
                        </span>
                        <button
                          onClick={() => navigate(`/results/${attempt.attempt_id}`)}
                          className="px-3 py-1.5 text-xs border border-gray-700 hover:border-indigo-500 text-gray-400 hover:text-white rounded-lg transition"
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
