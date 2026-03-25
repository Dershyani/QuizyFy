import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="text-2xl font-bold text-indigo-400">QuizyFy</div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition font-medium"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-block bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          🎓 AI-Powered Learning for USM CS Students
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Turn Your Notes Into
          <span className="text-indigo-400"> Smart Quizzes</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Upload your PDF lecture notes and QuizyFy instantly generates
          personalized MCQ quizzes with AI feedback and resource recommendations.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-lg transition"
          >
            Get Started Free →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 border border-gray-700 hover:border-indigo-500 rounded-xl font-semibold text-lg transition"
          >
            Login
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-8 pb-24">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-3xl mb-4">📄</div>
          <h3 className="font-bold text-lg mb-2">PDF Upload</h3>
          <p className="text-gray-400 text-sm">Upload any CS lecture note and our AI extracts and processes the content automatically.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-3xl mb-4">🧠</div>
          <h3 className="font-bold text-lg mb-2">AI Quiz Generation</h3>
          <p className="text-gray-400 text-sm">LLaMA 3 via Groq API generates smart MCQs from your notes in seconds.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="text-3xl mb-4">⚡</div>
          <h3 className="font-bold text-lg mb-2">Instant Feedback</h3>
          <p className="text-gray-400 text-sm">Get AI explanations for wrong answers using RAG from your own lecture notes.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
        CAT405 FYP · School of Computer Sciences · USM · Dershyani A/P B. Thessaruva · 164062
      </div>
    </div>
  )
}