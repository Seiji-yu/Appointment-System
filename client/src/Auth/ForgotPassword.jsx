import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../Styles/Login.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Pull the email from the Login screen (stored as 'lastLoginEmail') and lock it
  useEffect(() => {
    try {
      const last = (localStorage.getItem('lastLoginEmail') || '').trim()
      if (last) {
        setEmail(last)
        setIsLocked(true)
        return
      }
      // Optional fallback: if user is already logged in, use stored email
      const stored = (localStorage.getItem('email') || '').trim()
      if (stored) {
        setEmail(stored)
        setIsLocked(true)
      }
    } catch (_) {}
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatusMessage('')
    setLoading(true)

    try {
      const lockedEmail = (email || '').trim()
      if (!lockedEmail) {
        setError('Enter your email on the Login screen, then click "Forgot password?" to proceed.')
        setLoading(false)
        return
      }

      const res = await axios.post('http://localhost:3001/auth/forgot-password', { email: lockedEmail })
      if (res.data?.preview) {
        setStatusMessage(`Check your inbox! Preview: ${res.data.preview}`)
      } else {
        setStatusMessage('If an account exists, a reset link has been sent to your email.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.')
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
          <h2>Forgot Password</h2>
          
          {error && <p className="auth-error">{error}</p>}
          {statusMessage && <p className="auth-success">{statusMessage}</p>}
          {loading && <p className="auth-loading">Sending...</p>}

          <form onSubmit={handleSubmit}>
            <div style={{ width: '100%', marginBottom: '1rem' }}>
              <label htmlFor="locked-email" style={{ display: 'block', marginBottom: 8, color: '#FAF8F1', fontSize: '0.95em' }}>
                Email address
              </label>
              <input
                id="locked-email"
                type="email"
                value={email}
                readOnly
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#aaa',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              {!isLocked && (
                <p style={{ marginTop: 8, fontSize: '0.85em', color: 'rgba(250, 248, 241, 0.7)' }}>
                  Enter your email on the Login page first, then click "Forgot password?".
                </p>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              Send Reset Link
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
