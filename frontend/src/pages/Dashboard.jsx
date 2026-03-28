import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../services/api'
import { 
  BookOpen, Target, Clock, Upload, LogOut, 
  Award, TrendingUp, Zap, ChevronRight, BarChart3 
} from 'lucide-react'

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
    if (score >= 80) return 'text-[#10B981]'
    if (score >= 60) return 'text-[#F97316]'
    return 'text-[#EF4444]'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-[#10B981]/10'
    if (score >= 60) return 'bg-[#F97316]/10'
    return 'bg-[#EF4444]/10'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate stats
  const totalQuizzes = data?.total_quizzes || 0
  const averageScore = totalQuizzes > 0 
    ? Math.round(data.history.reduce((sum, a) => sum + a.score, 0) / totalQuizzes)
    : 0
  const bestScore = totalQuizzes > 0 
    ? Math.max(...data.history.map(a => a.score))
    : 0
  const totalQuestions = data?.history.reduce((sum, a) => sum + a.total_questions, 0) || 0

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            onClick={() => navigate('/dashboard')}
            className="text-2xl font-extrabold text-[#1E3A8A] cursor-pointer tracking-tight"
          >
            Quizy<span className="text-[#06B6D4]">Fy</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] rounded-lg">
              <BookOpen className="w-4 h-4 text-[#F97316]" />
              <span className="text-[#6B7280] text-sm">{studentId}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#111827] font-medium text-sm">{name}</span>
              <button
                onClick={logout}
                className="p-2 hover:bg-red-50 rounded-lg transition text-[#6B7280] hover:text-red-500"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827]">
            Welcome back, {name?.split(' ')[0]}.
          </h1>
          <p className="text-[#6B7280] mt-1">
            Track your learning progress and continue where you left off.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <BookOpen className="w-5 h-5 text-[#F97316]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Total Attempts</p>
                <p className="text-3xl font-bold text-[#111827]">{totalQuizzes}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-5 h-5 text-[#F97316]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Average Score</p>
                <p className="text-3xl font-bold text-[#111827]">{averageScore}%</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-5 h-5 text-[#F97316]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Best Score</p>
                <p className="text-3xl font-bold text-[#111827]">{bestScore}%</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <Zap className="w-5 h-5 text-[#F97316]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Questions Answered</p>
                <p className="text-3xl font-bold text-[#111827]">{totalQuestions}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white rounded-xl font-medium hover:shadow-lg transition shadow-md"
              >
                <Upload className="w-5 h-5" />
                Upload New Notes
              </button>
            </div>

            {/* Quiz History */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#F97316]" />
                  <h3 className="font-semibold text-[#111827]">Quiz History</h3>
                </div>
                <span className="text-[#6B7280] text-sm">
                  {totalQuizzes} attempts
                </span>
              </div>

              {data?.history.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <BookOpen className="w-12 h-12 text-[#E5E7EB] mx-auto mb-4" />
                  <p className="text-[#6B7280] mb-4">No quizzes taken yet</p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white rounded-lg text-sm font-medium hover:shadow-md transition"
                  >
                    Start your first quiz
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {data.history.map((attempt, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${getScoreBg(attempt.score)}`}>
                          <span className={getScoreColor(attempt.score)}>
                            {attempt.score}%
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#111827]">{attempt.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[#6B7280] text-xs flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {attempt.total_questions} questions
                            </span>
                            <span className="text-[#6B7280] text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(attempt.completed_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/results/${attempt.attempt_id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#F97316] border border-[#E5E7EB] hover:border-[#F97316] rounded-lg transition"
                      >
                        Review
                        <ChevronRight className="w-4 h-4" />
                      </button>
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