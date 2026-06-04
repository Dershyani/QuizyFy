import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../services/api'
import StudentLayout from '../components/StudentLayout'
import {
  BookOpen, Target, Clock, Upload,
  Award, TrendingUp, Zap, ChevronRight, BarChart3
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('name')
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
    if (!dateStr) return 'N/A'
    // Ensure UTC if no timezone is provided by Supabase
    const parsedDateStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`
    return new Date(parsedDateStr).toLocaleDateString('en-MY', {
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

  // Prepare chart data (reverse history to show chronological order)
  const chartData = data?.history ? [...data.history].reverse().map((attempt, index) => ({
    name: `Quiz ${index + 1}`,
    score: attempt.score,
    date: formatDate(attempt.completed_at),
    title: attempt.title
  })) : []

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E5E7EB] p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-[#111827] text-sm mb-1">{payload[0].payload.title}</p>
          <p className="text-[#6B7280] text-xs mb-2">{payload[0].payload.date}</p>
          <p className="text-[#F97316] font-bold">Score: {payload[0].value}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <StudentLayout>
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

            {/* Performance Trend Chart */}
            {chartData.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-8 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#F97316]" />
                    <h3 className="font-semibold text-[#111827]">Performance Trend</h3>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#F97316" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#F97316' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#F97316' }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

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
    </StudentLayout>
  )
}