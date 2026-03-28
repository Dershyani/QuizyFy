import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api'
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginUser(form)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('name', res.data.name)
      localStorage.setItem('student_id', res.data.student_id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1E3A8A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F97316]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1E3A8A] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E5E7EB]">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-3xl font-extrabold text-[#1E3A8A] mb-2">
              Quizy<span className="text-[#06B6D4]">Fy</span>
            </div>
            <h2 className="text-xl font-bold text-[#111827]">Welcome back</h2>
            <p className="text-[#6B7280] text-sm mt-1">Sign in to continue learning</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  placeholder="you@student.usm.my"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white rounded-xl py-3 font-semibold hover:shadow-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <LogIn className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F97316] hover:text-[#FF8C42] font-medium hover:underline transition">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}