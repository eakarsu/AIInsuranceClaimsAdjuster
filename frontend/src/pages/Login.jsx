import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submitLogin = async (loginEmail, loginPassword) => {
    setError('')
    setLoading(true)
    try {
      const data = await login(loginEmail, loginPassword)
      localStorage.setItem('token', data.token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submitLogin(email, password)
  }

  const handleDemoLogin = async () => {
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL || ''
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || ''
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
    if (demoEmail && demoPassword) {
      await submitLogin(demoEmail, demoPassword)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">🛡️</div>
        <h1>Welcome Back</h1>
        <p className="login-subtitle">AI Insurance Claims Adjuster</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || !import.meta.env.VITE_DEMO_EMAIL || !import.meta.env.VITE_DEMO_PASSWORD}
            aria-label="Fill demo credentials"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Fill demo credentials
          </button>
          {(!import.meta.env.VITE_DEMO_EMAIL || !import.meta.env.VITE_DEMO_PASSWORD) && <p className="login-subtitle">Demo credentials are not configured for this session.</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
