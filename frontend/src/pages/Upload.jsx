import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadPDF, generateQuiz } from '../services/api'
import { Upload as UploadIcon, FileText, Brain, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

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
      setStep('Extracting text from PDF...')
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await uploadPDF(formData)
      const documentId = uploadRes.data.document_id

      // Step 2: Generate Quiz
      setStep('Generating quiz with LLaMA 3...')
      const quizRes = await generateQuiz({
        document_id: documentId,
        num_questions: numQuestions,
        title: title || 'My Quiz'
      })

      // Step 3: Navigate to quiz
      setStep('Quiz ready! Loading...')
      navigate(`/quiz/${quizRes.data.quiz_id}`)

    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong!')
      setLoading(false)
      setStep('')
    }
  }

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
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1E3A8A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UploadIcon className="w-8 h-8 text-[#F97316]" />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Upload Lecture Notes</h1>
          <p className="text-[#6B7280]">Upload a PDF and AI will generate a quiz for you</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm">
            <p className="font-semibold mb-1">Upload Failed</p>
            <p>{error}</p>
            {error.includes("Computer Science") && (
              <p className="mt-2 text-red-500 text-xs">
                QuizyFy only supports Computer Science lecture notes such as
                Data Structures, Algorithms, Networks, AI, Databases, and more.
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#F97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-[#F97316] animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-2">Processing your notes...</h3>
            <p className="text-[#F97316] text-sm mb-4">{step}</p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="space-y-6">
              
              {/* File upload area */}
              <div
                onClick={() => document.getElementById('fileInput').click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                  file 
                    ? 'border-[#10B981] bg-[#10B981]/5' 
                    : 'border-[#E5E7EB] hover:border-[#F97316] hover:bg-[#F97316]/5'
                }`}
              >
                <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className={`w-6 h-6 ${file ? 'text-[#10B981]' : 'text-[#F97316]'}`} />
                </div>
                <h3 className="font-semibold text-[#111827] mb-1">
                  {file ? file.name : 'Drop your PDF here'}
                </h3>
                <p className="text-[#6B7280] text-sm">
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to generate`
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
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Structures Quiz"
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">
                    Number of Questions
                  </label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                  </select>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleUpload}
                disabled={!file}
                className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  file
                    ? 'bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white hover:shadow-lg shadow-md'
                    : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                }`}
              >
                Generate Quiz
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* CS Content Note */}
              <div className="mt-4 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
                <p className="text-xs text-[#6B7280] text-center">
                  Only Computer Science lecture notes are supported. 
                  Our AI will verify the content before generating your quiz.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}