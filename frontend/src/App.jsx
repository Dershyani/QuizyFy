import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Quiz from './pages/Quiz'
import Results from './pages/Results'

// Protected route - only logged in users can access
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute><Upload /></ProtectedRoute>
        } />
        <Route path="/quiz/:quizId" element={
          <ProtectedRoute><Quiz /></ProtectedRoute>
        } />
        <Route path="/results/:attemptId" element={
          <ProtectedRoute><Results /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App