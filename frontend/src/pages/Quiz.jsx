import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuiz, startQuiz, submitAnswer, finishQuiz } from '../services/api'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Circle, Brain } from 'lucide-react'

export default function Quiz() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [attemptId, setAttemptId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  const loadQuiz = async () => {
    try {
      const quizRes = await getQuiz(quizId)
      const attemptRes = await startQuiz(quizId)
      setQuiz(quizRes.data)
      setAttemptId(attemptRes.data.quiz_attempt_id)
    } catch (err) {
      console.error('Error loading quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (option) => {
    setSelected(option)
    setAnswers({ ...answers, [currentIndex]: option })
  }

  const handleNext = async () => {
    if (!selected && !answers[currentIndex]) return
    setSubmitting(true)

    try {
      const question = quiz.questions[currentIndex]
      await submitAnswer({
        quiz_attempt_id: attemptId,
        question_id: question.question_id,
        selected_answer: answers[currentIndex] || selected
      })

      if (currentIndex + 1 >= quiz.questions.length) {
        await finishQuiz(attemptId)
        navigate(`/results/${attemptId}`)
      } else {
        setCurrentIndex(currentIndex + 1)
        setSelected(answers[currentIndex + 1] || null)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelected(answers[currentIndex - 1] || null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="text-center">
        <Brain className="w-12 h-12 text-[#F97316] animate-pulse mx-auto mb-4" />
        <p className="text-[#6B7280]">Loading quiz...</p>
      </div>
    </div>
  )

  if (!quiz) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <p className="text-red-500">Quiz not found!</p>
    </div>
  )

  const question = quiz.questions[currentIndex]
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ]

  const currentAnswer = answers[currentIndex] || selected
  const progress = ((currentIndex + 1) / quiz.total_questions) * 100

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="text-xl font-extrabold text-[#1E3A8A]">
            Quizy<span className="text-[#06B6D4]">Fy</span>
          </div>
          <div className="text-sm text-[#6B7280] font-medium">{quiz.title}</div>
          <div className="text-sm text-[#6B7280]">
            {currentIndex + 1} / {quiz.total_questions}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#E5E7EB]">
        <div
          className="h-1 bg-gradient-to-r from-[#F97316] to-[#FF8C42] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-6 py-8 md:py-12">

        {/* Question number */}
        <div className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-4">
          Question {currentIndex + 1} of {quiz.total_questions}
        </div>

        {/* Question text */}
        <h2 className="text-xl md:text-2xl font-bold text-[#111827] mb-8 leading-relaxed">
          {question.question_text}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {options.map((opt) => (
            <div
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className={`flex items-center gap-4 border rounded-xl px-5 py-4 cursor-pointer transition-all duration-200
                ${currentAnswer === opt.key
                  ? 'border-[#F97316] bg-[#F97316]/5 shadow-sm'
                  : 'border-[#E5E7EB] bg-white hover:border-[#F97316] hover:bg-[#F97316]/5'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition
                ${currentAnswer === opt.key
                  ? 'bg-[#F97316] text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280]'
                }`}
              >
                {opt.key}
              </div>
              <span className={`text-sm ${currentAnswer === opt.key ? 'text-[#111827] font-medium' : 'text-[#6B7280]'}`}>
                {opt.text}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="px-5 py-2.5 border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#F97316] hover:border-[#F97316] rounded-xl font-medium transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!currentAnswer || submitting}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              !currentAnswer || submitting
                ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white hover:shadow-lg'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : currentIndex + 1 >= quiz.total_questions ? (
              <>
                Finish Quiz
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Answer indicators at bottom */}
        <div className="flex gap-2 mt-10 flex-wrap justify-center">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              onClick={() => {
                setCurrentIndex(i)
                setSelected(answers[i] || null)
              }}
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition
                ${i === currentIndex
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : answers[i]
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#E5E7EB] text-[#9CA3AF] hover:bg-[#F97316]/20'
                }`}
            >
              {answers[i] ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}