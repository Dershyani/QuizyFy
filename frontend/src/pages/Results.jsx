import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { 
  Brain, Link, CheckCircle, XCircle, Target, ExternalLink, 
  ArrowLeft, Loader2, Sparkles, BookOpen, TrendingUp 
} from 'lucide-react'

export default function Results() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState({})
  const [loadingFeedback, setLoadingFeedback] = useState({})

  useEffect(() => {
    loadResults()
  }, [attemptId])

  const loadResults = async () => {
    try {
      const res = await api.get(`/quiz/results/${attemptId}`)
      setResults(res.data)
    } catch (err) {
      console.error('Error loading results:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFeedback = async (answerAttemptId, index) => {
    if (feedbacks[index] || loadingFeedback[index]) return
    setLoadingFeedback(prev => ({ ...prev, [index]: true }))
    try {
      const res = await api.post(`/quiz/feedback/${answerAttemptId}`)
      setFeedbacks(prev => ({ ...prev, [index]: res.data }))
    } catch (err) {
      console.error('Error loading feedback:', err)
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [index]: false }))
    }
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

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent Work!'
    if (score >= 60) return 'Good Job! Keep it up!'
    return 'Keep Practicing!'
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#F97316] animate-spin mx-auto mb-4" />
        <p className="text-[#6B7280]">Loading your results...</p>
      </div>
    </div>
  )

  if (!results) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <p className="text-red-500">Results not found!</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            onClick={() => navigate('/dashboard')}
            className="text-2xl font-extrabold text-[#1E3A8A] cursor-pointer tracking-tight"
          >
            Quizy<span className="text-[#06B6D4]">Fy</span>
          </div>
          <div className="text-sm text-[#6B7280] truncate max-w-[200px]">
            {results.title}
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Score Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center mb-8 shadow-sm">
          <div className="w-16 h-16 bg-[#F97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[#F97316]" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827] mb-1">
            {getScoreMessage(results.score)}
          </h1>
          <p className="text-[#6B7280] text-sm mb-6">{results.title}</p>
          <div className={`text-6xl md:text-7xl font-extrabold mb-4 ${getScoreColor(results.score)}`}>
            {results.score}%
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#10B981]">{results.correct}</div>
              <div className="text-xs text-[#6B7280] mt-1">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#EF4444]">
                {results.total - results.correct}
              </div>
              <div className="text-xs text-[#6B7280] mt-1">Wrong</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E3A8A]">{results.total}</div>
              <div className="text-xs text-[#6B7280] mt-1">Total</div>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#F97316]" />
            <h3 className="font-semibold text-[#111827]">Question Breakdown</h3>
          </div>

          {results.answers.map((answer, i) => (
            <div
              key={i}
              className={`bg-white border rounded-xl overflow-hidden transition ${
                answer.is_correct
                  ? 'border-[#10B981]/30'
                  : 'border-[#EF4444]/30'
              }`}
            >
              {/* Question info */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  {answer.is_correct
                    ? <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#111827] mb-3">
                      {answer.question_text}
                    </p>
                    <div className="text-xs space-y-1">
                      <p className="text-[#6B7280]">
                        Your answer:{' '}
                        <span className={`font-semibold ${answer.is_correct ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {answer.selected_answer}. {answer[`option_${answer.selected_answer.toLowerCase()}`]}
                        </span>
                      </p>
                      {!answer.is_correct && (
                        <p className="text-[#6B7280]">
                          Correct answer:{' '}
                          <span className="text-[#10B981] font-semibold">
                            {answer.correct_answer}. {answer[`option_${answer.correct_answer.toLowerCase()}`]}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Get Explanation button */}
                {!answer.is_correct && !feedbacks[i] && (
                  <button
                    onClick={() => loadFeedback(answer.answer_attempt_id, i)}
                    disabled={loadingFeedback[i]}
                    className="mt-4 flex items-center gap-1.5 text-xs bg-[#F97316]/10 hover:bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316] px-3 py-1.5 rounded-lg transition"
                  >
                    {loadingFeedback[i] ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-3 h-3" />
                        Get AI Explanation
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* RAG Explanation + Recommendations */}
              {!answer.is_correct && feedbacks[i] && (
                <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-5 space-y-4">
                  
                  {/* AI Explanation */}
                  <div className="flex items-start gap-3">
                    <Brain className="w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-2">
                        AI Explanation
                      </div>
                      <p className="text-sm text-[#6B7280] leading-relaxed">
                        {feedbacks[i].explanation}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Resources */}
                  {feedbacks[i].recommendations?.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Link className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider mb-2">
                          Recommended Resources
                        </div>
                        <div className="space-y-2">
                          {feedbacks[i].recommendations.map((rec, j) => (
                            <a
                              key={j}
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 bg-white border border-[#E5E7EB] hover:border-[#06B6D4] rounded-lg px-3 py-2 transition group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#1E3A8A] group-hover:text-[#06B6D4] font-medium truncate">
                                  {rec.title}
                                </p>
                                {rec.description && (
                                  <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">
                                    {rec.description}
                                  </p>
                                )}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="flex-1 bg-gradient-to-r from-[#F97316] to-[#FF8C42] text-white rounded-xl py-3 font-semibold hover:shadow-lg transition shadow-md"
          >
            Take Another Quiz
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#F97316] hover:border-[#F97316] rounded-xl py-3 font-semibold transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}