import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../Styles/Login.css'

export default function ResetPassword() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token') || ''
    setToken(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatusMessage('')
    setLoading(true)

    if (!token) {
      setError('Missing token. Use the link from your email.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const res = await axios.post('http://localhost:3001/auth/reset-password', { token, password })
      if (res.data?.status === 'success') {
        setStatusMessage('Password reset successful. Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(res.data?.message || 'Invalid or expired link.')
      }
    } catch (err) {
      setError('Invalid or expired link.')
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="slider" aria-hidden="true">
          <div className="slider-card">
            <div className="slides">
              <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80')" }} />
              <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80')" }} />
              <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80')" }} />
            </div>
            <div className="slider-overlay" />
            <div className="dots" aria-hidden="true">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>

        <div className="glass-card auth-panel dark-card">
          <h2>Reset Password</h2>
          
          {error && <p className="auth-error">{error}</p>}
          {statusMessage && <p className="auth-success">{statusMessage}</p>}
          {loading && <p className="auth-loading">Processing...</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" className="submit-btn" disabled={loading}>
              Set New Password
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: '0.9em', color: '#FAF8F1' }}>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'transparent', border: 'none', color: '#a28ef9', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9em' }}
              >
                Back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
