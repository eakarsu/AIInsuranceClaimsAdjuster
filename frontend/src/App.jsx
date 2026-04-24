import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FeaturePage from './pages/FeaturePage.jsx'
import Reports from './pages/Reports.jsx'
import AISidebar from './components/AISidebar.jsx'
import { features } from './pages/features.js'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function Navbar({ onToggleAI }) {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  if (!token || location.pathname === '/login') return null

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-icon">🛡️</span>
        AI Insurance Claims Adjuster
      </Link>
      <div className="navbar-links">
        <Link to="/" className="navbar-link">Dashboard</Link>
        <Link to="/claims" className="navbar-link">Claims</Link>
        <Link to="/policies" className="navbar-link">Policies</Link>
        <Link to="/reports" className="navbar-link">Reports</Link>
        <button onClick={onToggleAI} className="btn btn-ai-nav">🤖 AI Assistant</button>
        <button onClick={handleLogout} className="btn btn-logout">Logout</button>
      </div>
    </nav>
  )
}

function AppContent() {
  const [aiSidebarOpen, setAISidebarOpen] = useState(false)

  return (
    <>
      <Navbar onToggleAI={() => setAISidebarOpen(true)} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/claims" element={<ProtectedRoute><FeaturePage config={features.claims} /></ProtectedRoute>} />
        <Route path="/policies" element={<ProtectedRoute><FeaturePage config={features.policies} /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><FeaturePage config={features.customers} /></ProtectedRoute>} />
        <Route path="/adjusters" element={<ProtectedRoute><FeaturePage config={features.adjusters} /></ProtectedRoute>} />
        <Route path="/fraud-detection" element={<ProtectedRoute><FeaturePage config={features.fraudDetection} /></ProtectedRoute>} />
        <Route path="/damage-assessment" element={<ProtectedRoute><FeaturePage config={features.damageAssessment} /></ProtectedRoute>} />
        <Route path="/risk-assessment" element={<ProtectedRoute><FeaturePage config={features.riskAssessment} /></ProtectedRoute>} />
        <Route path="/settlement-recommendation" element={<ProtectedRoute><FeaturePage config={features.settlementRecommendation} /></ProtectedRoute>} />
        <Route path="/document-analysis" element={<ProtectedRoute><FeaturePage config={features.documentAnalysis} /></ProtectedRoute>} />
        <Route path="/policy-coverage" element={<ProtectedRoute><FeaturePage config={features.policyCoverage} /></ProtectedRoute>} />
        <Route path="/customer-sentiment" element={<ProtectedRoute><FeaturePage config={features.customerSentiment} /></ProtectedRoute>} />
        <Route path="/claims-forecasting" element={<ProtectedRoute><FeaturePage config={features.claimsForecasting} /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><FeaturePage config={features.payments} /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute><FeaturePage config={features.auditLog} /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      </Routes>

      <AISidebar isOpen={aiSidebarOpen} onClose={() => setAISidebarOpen(false)} />

      {/* Floating AI button - visible on all pages when logged in */}
      <AIFloatingButton onClick={() => setAISidebarOpen(true)} />
    </>
  )
}

function AIFloatingButton({ onClick }) {
  const location = useLocation()
  const token = localStorage.getItem('token')
  if (!token || location.pathname === '/login') return null

  return (
    <button className="ai-floating-btn" onClick={onClick} title="Open AI Assistant">
      🤖
    </button>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
