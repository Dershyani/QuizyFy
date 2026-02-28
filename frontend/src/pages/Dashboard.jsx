import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('name')
  const studentId = localStorage.getItem('student_id')

  const logout = () => {
    localStorage.clear()
    navigate('/login')
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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-extrabold mb-2">
          Good day, {name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-400 mb-10">Ready to study smarter today?</p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div
            onClick={() => navigate('/upload')}
            className="bg-indigo-600/20 border border-indigo-600/40 rounded-2xl p-8 cursor-pointer hover:border-indigo-500 transition group"
          >
            <div className="text-4xl mb-4">📤</div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition">
              Upload Lecture Notes
            </h3>
            <p className="text-gray-400 text-sm">
              Upload a PDF and generate a quiz from your lecture notes using AI.
            </p>
            <div className="mt-6 text-indigo-400 font-medium text-sm">
              Upload PDF →
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Your Progress</h3>
            <p className="text-gray-400 text-sm">
              Track your quiz history and performance across all topics.
            </p>
            <div className="mt-6 text-gray-500 font-medium text-sm">
              Coming soon...
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h3 className="text-lg font-bold mb-6">How QuizyFy Works</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: '1', label: 'Upload PDF', icon: '📄' },
              { num: '2', label: 'AI Generates Quiz', icon: '🧠' },
              { num: '3', label: 'Take the Quiz', icon: '✏️' },
              { num: '4', label: 'Get Feedback', icon: '⚡' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">
                  {step.num}
                </div>
                <div className="text-sm text-gray-400">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}