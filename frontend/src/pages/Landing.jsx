import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { ArrowRight, FileText, Brain, Zap, LogIn, ChevronDown, ChevronUp, TrendingUp, BookOpen, Sparkles, UserPlus } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [visibleSections, setVisibleSections] = useState({})

  const sectionsRef = {
    hero: useRef(null),
    why: useRef(null),
    how: useRef(null),
    faq: useRef(null),
    cta: useRef(null)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    )

    Object.values(sectionsRef).forEach((ref) => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [])

  const toggleFaq = (id) => setOpenFaq(openFaq === id ? null : id)

  const faqs = [
    {
      id: 1,
      question: "What is QuizyFy and how does it work?",
      answer: "QuizyFy is an AI-powered quiz generator designed for USM Computer Science students. Simply upload your lecture PDF, and our AI extracts the content, generates multiple-choice questions, and provides instant feedback with explanations from your own notes using RAG (Retrieval-Augmented Generation)."
    },
    {
      id: 2,
      question: "Is QuizyFy free to use?",
      answer: "Yes! QuizyFy is completely free for USM CS students. You can upload PDFs, generate quizzes, and track your progress at no cost."
    },
    {
      id: 3,
      question: "What types of PDFs can I upload?",
      answer: "QuizyFy is designed specifically for Computer Science lecture notes — topics like Data Structures, Algorithms, Networks, OS, AI/ML, Databases, and more. Non-CS content will be automatically rejected."
    },
    {
      id: 4,
      question: "How does the AI generate questions?",
      answer: "We use LLaMA 3 via Groq API to analyze your lecture notes and generate relevant multiple-choice questions. The AI identifies key concepts, creates plausible distractors, and ensures questions test real understanding."
    },
    {
      id: 5,
      question: "What is RAG feedback and why is it special?",
      answer: "RAG (Retrieval-Augmented Generation) means explanations come directly from YOUR lecture notes. When you answer incorrectly, we find the most relevant sections of your PDF using SBERT embeddings and LLaMA 3 generates an explanation based on your actual study material."
    },
    {
      id: 6,
      question: "Who can use QuizyFy?",
      answer: "QuizyFy is exclusively for USM Computer Science students. Registration requires a valid @student.usm.my email address."
    }
  ]

  const fadeUpClass = (id) => `
    transition-all duration-700 ease-out
    ${visibleSections[id] 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 translate-y-10'
    }
  `

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="text-2xl font-extrabold text-[#1E3A8A] cursor-pointer tracking-tight"
          >
            Quizy<span className="text-[#06B6D4]">Fy</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#6B7280] hover:text-[#1E3A8A] font-medium transition"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-white text-sm rounded-lg font-semibold transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section 
        id="hero" 
        ref={sectionsRef.hero}
        className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0e7490]"
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none'
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className={`max-w-3xl mx-auto text-center ${fadeUpClass('hero')}`}>
            <div className="inline-flex items-center gap-2 bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#06B6D4] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Learning
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
              Master CS Topics<br />
              <span className="text-[#F97316]">With AI-Guided Quizzes</span>
            </h1>

            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Upload your lecture notes and QuizyFy instantly generates personalized
              MCQ quizzes, provides RAG-based feedback, and recommends resources
              tailored to your weak areas.
            </p>

            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#F97316] hover:bg-[#ea6c0a] text-white rounded-xl font-semibold transition shadow-md"
            >
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </button>

            {/* pills */}
            <div className="flex flex-wrap justify-center gap-2.5 mt-8">
              {[
                { dot: '#10B981', label: 'USM CS Students Only' },
                { dot: '#06B6D4', label: 'LLaMA 3 Powered' },
                { dot: '#F97316', label: 'RAG Feedback' },
              ].map((p) => (
                <span key={p.label} className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/75 text-xs px-3.5 py-1.5 rounded-full">
                  <span style={{ color: p.dot, fontSize: '0.6rem' }}>●</span>
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem → Solution ── */}
      <section 
        id="why" 
        ref={sectionsRef.why}
        className={`bg-white py-20 border-b border-[#E5E7EB] ${fadeUpClass('why')}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#06B6D4] mb-2">Why QuizyFy</p>
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Study Smarter, Not Harder
            </h2>
            <p className="text-[#6B7280] mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Traditional revision is passive. QuizyFy turns your static PDF notes into an active learning cycle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-6 h-6 text-[#06B6D4]" />,
                bg: 'rgba(6,182,212,0.08)',
                title: 'AI Builds Your Quiz',
                desc: 'LLaMA 3 reads your notes and creates targeted MCQs — no generic question banks, only content from your own materials.'
              },
              {
                icon: <Zap className="w-6 h-6 text-[#F97316]" />,
                bg: 'rgba(249,115,22,0.08)',
                title: 'Instant RAG Feedback',
                desc: 'Wrong answers trigger a retrieval pipeline that pulls the most relevant chunks from your PDF to explain the concept clearly.'
              },
              {
                icon: <BookOpen className="w-6 h-6 text-[#10B981]" />,
                bg: 'rgba(16,185,129,0.08)',
                title: 'Curated Resources',
                desc: 'Get recommended links to GeeksforGeeks, W3Schools and more — matched to the exact topic you struggled with.'
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-7 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl hover:shadow-md transition">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-[#111827] mb-2">{item.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section 
        id="how" 
        ref={sectionsRef.how}
        className={`py-20 bg-[#F3F4F6] ${fadeUpClass('how')}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#06B6D4] mb-2">How It Works</p>
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              From Notes to Quiz in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <FileText className="w-6 h-6 text-white" />,
                title: 'Upload Your PDF',
                desc: 'Upload any CS lecture note. Our system verifies the content and extracts text automatically.'
              },
              {
                step: '02',
                icon: <Brain className="w-6 h-6 text-white" />,
                title: 'AI Generates Quiz',
                desc: 'LLaMA 3 analyzes your notes and generates smart MCQs based on key concepts and topics.'
              },
              {
                step: '03',
                icon: <TrendingUp className="w-6 h-6 text-white" />,
                title: 'Learn & Improve',
                desc: 'Answer questions, get AI explanations for mistakes, and track your progress over time.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-lg transition group">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-[#1E3A8A] group-hover:bg-[#06B6D4] rounded-xl flex items-center justify-center transition-colors duration-300">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-[#9CA3AF] tracking-widest">STEP {item.step}</span>
                </div>
                <h3 className="font-bold text-[#111827] mb-2">{item.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section 
        id="faq" 
        ref={sectionsRef.faq}
        className={`py-20 bg-white border-t border-[#E5E7EB] ${fadeUpClass('faq')}`}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#06B6D4] mb-2">FAQ</p>
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-[#6B7280] mt-3 text-sm">Everything you need to know about QuizyFy</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F9FAFB] transition"
                >
                  <span className="font-semibold text-[#111827] text-sm pr-4">{faq.question}</span>
                  {openFaq === faq.id
                    ? <ChevronUp className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  }
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 pb-5 pt-1 border-t border-[#F3F4F6]">
                    <p className="text-[#6B7280] text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section 
        id="cta" 
        ref={sectionsRef.cta}
        className={`bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] py-20 px-6 text-center ${fadeUpClass('cta')}`}
      >
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
            Ready to Study Smarter?
          </h2>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            Start turning your lecture notes into an active learning experience — free for all USM CS students.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F97316] hover:bg-[#ea6c0a] text-white rounded-xl font-semibold transition shadow-lg"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-white/40 text-xs mt-4">Requires a @student.usm.my email address</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111827] py-6 text-center">
        <p className="text-[#4B5563] text-xs">
          © 2026 QuizyFy · AI-Powered Quiz Generator for USM Computer Science Students
        </p>
      </footer>

    </div>
  )
}