// C:\Users\dersh\Desktop\quizyfy-new-ui\frontend\src\pages\AdminDashboard.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOverview } from '../services/api'
import AdminLayout from '../components/AdminLayout'
import { 
  Users, FileText, BookOpen, Target, TrendingUp, LogOut, 
  ChevronRight, Calendar, Mail, UserCheck, Activity, BarChart3,
  Award, Zap, Clock
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    try {
      const res = await getAdminOverview()
      setData(res.data)
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const parsedDateStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`
    return new Date(parsedDateStr).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Prepare chart data for weak topics
  const chartData = data?.weak_topics || []
  const usageData = data?.system_usage || []

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E5E7EB] p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-[#111827] text-sm mb-1">{payload[0].payload.topic}</p>
          <p className="text-[#F97316] font-bold">Struggling Count: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  const UsageTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E5E7EB] p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-[#111827] text-sm mb-1">{label}</p>
          <p className="text-[#06B6D4] font-bold">Quizzes Taken: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <AdminLayout>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827]">
            Admin Dashboard
          </h1>
          <p className="text-[#6B7280] mt-1">
            Monitor system activity and student progress
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid - Matching Dashboard Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Total Students</p>
                <p className="text-3xl font-bold text-[#111827]">{data?.stats?.total_students || 0}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <FileText className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Documents</p>
                <p className="text-3xl font-bold text-[#111827]">{data?.stats?.total_documents || 0}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Quizzes Generated</p>
                <p className="text-3xl font-bold text-[#111827]">{data?.stats?.total_quizzes || 0}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <Target className="w-5 h-5 text-[#F97316]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Quiz Attempts</p>
                <p className="text-3xl font-bold text-[#111827]">{data?.stats?.total_attempts || 0}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <p className="text-[#6B7280] text-sm mb-1">Average Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(data?.stats?.average_score || 0)}`}>
                  {Math.round(data?.stats?.average_score || 0)}%
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[#E5E7EB]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg ${
                  activeTab === 'overview'
                    ? 'bg-white text-[#F97316] border-t border-l border-r border-[#E5E7EB] -mb-px'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activity
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg ${
                  activeTab === 'students'
                    ? 'bg-white text-[#F97316] border-t border-l border-r border-[#E5E7EB] -mb-px'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Students
                </div>
              </button>
            </div>

            {/* Recent Activity Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Analytics Charts */}
                <div className="space-y-6">
                  {chartData.length > 0 && (
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-[#F97316]" />
                        <h3 className="font-semibold text-[#111827]">Common Weak Topics</h3>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis 
                              type="number"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#6B7280', fontSize: 12 }} 
                              allowDecimals={false}
                            />
                            <YAxis 
                              type="category"
                              dataKey="topic" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#6B7280', fontSize: 11 }}
                              width={150}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                            <Bar 
                              dataKey="count" 
                              fill="#F97316" 
                              radius={[0, 4, 4, 0]}
                              barSize={24}
                              animationDuration={1500}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {usageData.length > 0 && (
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-[#06B6D4]" />
                        <h3 className="font-semibold text-[#111827]">System Usage (Attempts/Day)</h3>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={usageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#6B7280', fontSize: 12 }} 
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#6B7280', fontSize: 12 }}
                              dx={-10}
                              allowDecimals={false}
                            />
                            <Tooltip content={<UsageTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#06B6D4" 
                              strokeWidth={3}
                              dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                              animationDuration={1500}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#F97316]" />
                    <h3 className="font-semibold text-[#111827]">Recent Quiz Attempts</h3>
                  </div>
                  <span className="text-[#6B7280] text-xs">
                    Last 10 attempts
                  </span>
                </div>
                
                {(data?.recent_attempts || []).length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <Zap className="w-12 h-12 text-[#E5E7EB] mx-auto mb-4" />
                    <p className="text-[#6B7280]">No quiz attempts yet</p>
                    <p className="text-[#9CA3AF] text-sm mt-1">Students haven't taken any quizzes</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E7EB]">
                    {(data.recent_attempts || []).map((attempt, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${getScoreBg(attempt.score)}`}>
                            <span className={getScoreColor(attempt.score)}>
                              {attempt.score}%
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#111827]">{attempt.student_name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[#6B7280] text-xs flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {attempt.quiz_title}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-[#6B7280] block">{attempt.student_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#F97316]" />
                    <h3 className="font-semibold text-[#111827]">Registered Students</h3>
                  </div>
                  <span className="text-[#6B7280] text-xs">
                    Total: {data?.stats?.total_students || 0} students
                  </span>
                </div>
                
                {(data?.recent_students || []).length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <UserCheck className="w-12 h-12 text-[#E5E7EB] mx-auto mb-4" />
                    <p className="text-[#6B7280]">No students registered yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E7EB]">
                    {(data.recent_students || []).map((student, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#06B6D4] rounded-xl flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {student.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#111827]">{student.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3 text-[#6B7280]" />
                              <span className="text-xs text-[#6B7280]">{student.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-[#6B7280]">{student.student_id}</p>
                          <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            Joined {formatDate(student.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Additional Stats Section - Optional */}
            {activeTab === 'overview' && data?.stats && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-[#F97316]" />
                    <h3 className="font-semibold text-[#111827]">Performance Insights</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B7280] text-sm">Average Score</span>
                      <span className={`font-semibold ${getScoreColor(data.stats.average_score || 0)}`}>
                        {Math.round(data.stats.average_score || 0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B7280] text-sm">Total Questions Answered</span>
                      <span className="font-semibold text-[#111827]">
                        {data.stats.total_attempts * 10 || 0}+
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B7280] text-sm">Engagement Rate</span>
                      <span className="font-semibold text-[#111827]">
                        {data.stats.total_students > 0 
                          ? Math.round((data.stats.total_attempts / data.stats.total_students) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-[#F97316]" />
                    <h3 className="font-semibold text-[#111827]">Quick Actions</h3>
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate('/admin/students')}
                      className="w-full text-left px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F9FAFB] rounded-lg transition"
                    >
                      View all students →
                    </button>
                    <button 
                      onClick={() => navigate('/admin/quizzes')}
                      className="w-full text-left px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F9FAFB] rounded-lg transition"
                    >
                      View all quizzes →
                    </button>
                    <button 
                      onClick={() => navigate('/admin/analytics')}
                      className="w-full text-left px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F9FAFB] rounded-lg transition"
                    >
                      View detailed analytics →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}