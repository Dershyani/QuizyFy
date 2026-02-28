import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/api'

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-indigo-400 mb-1">QuizyFy</div>
          <h2 className="text-xl font-bold text-white">Create Account ✨</h2>
          <p className="text-gray-400 text-sm mt-1">Join QuizyFy and study smarter</p>
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
            <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Student ID</label>
            <input
              type="text"
              placeholder="e.g. 164062"
              value={form.student_id}
              onChange={(e) => setForm({...form, student_id: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>
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
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl py-3 font-semibold transition mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}