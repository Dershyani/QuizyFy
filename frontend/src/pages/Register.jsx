import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/api'
import { User, KeyRound, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', student_id: '', email: '', password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await registerUser(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      
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
            <h2 className="text-xl font-bold text-[#111827]">Create Account</h2>
            <p className="text-[#6B7280] text-sm mt-1">Join QuizyFy and study smarter</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Student ID
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="e.g. 166890"
                  value={form.student_id}
                  onChange={(e) => setForm({...form, student_id: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  required
                />
              </div>
            </div>

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
              <p className="text-xs text-[#9CA3AF] mt-1">
                Must be a valid USM student email (@student.usm.my)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white rounded-xl py-3 font-semibold hover:shadow-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <UserPlus className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F97316] hover:text-[#FF8C42] font-medium hover:underline transition">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}