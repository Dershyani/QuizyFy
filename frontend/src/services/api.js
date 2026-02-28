import axios from 'axios'

// Base URL for our FastAPI backend
const API_BASE = 'http://127.0.0.1:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── AUTH ──────────────────────────────────────────
export const registerUser = (data) =>
  api.post('/auth/register', data)

export const loginUser = (data) =>
  api.post('/auth/login', data)

export const getMe = () =>
  api.get('/auth/me')

// ── DOCUMENTS ─────────────────────────────────────
export const uploadPDF = (formData) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const getMyDocuments = () =>
  api.get('/documents/my-documents')

// ── QUIZ ──────────────────────────────────────────
export const generateQuiz = (data) =>
  api.post('/quiz/generate', data)

export const getQuiz = (quizId) =>
  api.get(`/quiz/${quizId}`)

export const startQuiz = (quizId) =>
  api.post(`/quiz/start/${quizId}`)

export const submitAnswer = (data) =>
  api.post('/quiz/submit-answer', data)

export const finishQuiz = (attemptId) =>
  api.post(`/quiz/finish/${attemptId}`)

export default api