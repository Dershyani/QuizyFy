import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPDF, generateQuiz } from '../services/api'

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [numQuestions, setNumQuestions] = useState(10)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setTitle(selected.name.replace('.pdf', ''))
      setError('')
    } else {
      setError('Please select a PDF file!')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      // Step 1: Upload PDF
      setStep('📄 Extracting text from PDF...')
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await uploadPDF(formData)
      const documentId = uploadRes.data.document_id

      // Step 2: Generate Quiz
      setStep('🧠 Generating quiz with LLaMA 3...')
      const quizRes = await generateQuiz({
        document_id: documentId,
        num_questions: numQuestions,
        title: title || 'My Quiz'
      })

      // Step 3: Navigate to quiz
      setStep('✅ Quiz ready! Loading...')
      navigate(`/quiz/${quizRes.data.quiz_id}`)

    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong!')
      setLoading(false)
      setStep('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div
          onClick={() => navigate('/dashboard')}
          className="text-2xl font-bold text-indigo-400 cursor-pointer"
        >
          QuizyFy
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white transition text-sm"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-2">Upload Lecture Notes 📤</h1>
        <p className="text-gray-400 mb-8">Upload a PDF and AI will generate a quiz for you!</p>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-4 animate-bounce">🤖</div>
            <h3 className="text-lg font-bold mb-2">Processing your notes...</h3>
            <p className="text-indigo-400 text-sm">{step}</p>
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File upload */}
            <div
              onClick={() => document.getElementById('fileInput').click()}
              className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer transition"
            >
              <div className="text-4xl mb-3">📁</div>
              <h3 className="font-bold mb-1">
                {file ? file.name : 'Drop your PDF here'}
              </h3>
              <p className="text-gray-500 text-sm">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready!`
                  : 'or click to browse · PDF only · Max 25MB'
                }
              </p>
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Quiz Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures Quiz"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Number of Questions</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
                >
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-4 font-semibold transition text-lg"
            >
              Generate Quiz →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}