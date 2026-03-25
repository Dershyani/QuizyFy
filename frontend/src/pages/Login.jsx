import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api'

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
      // Save token and user info
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('role', res.data.role)
      localStorage.setItem('name', res.data.name)
      localStorage.setItem('student_id', res.data.student_id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-indigo-400 mb-1">QuizyFy</div>
          <h2 className="text-xl font-bold text-white">Welcome back 👋</h2>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@student.usm.my"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl py-3 font-semibold transition mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}