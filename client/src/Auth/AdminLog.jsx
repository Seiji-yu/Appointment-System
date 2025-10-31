import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../Styles/Login.css'

function AdminLogin() {
  const [adminName, setAdminName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (adminName.trim() === 'admin' && password === 'admin') {
      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('adminEmail', 'Admin')
      navigate('/Admin')
    } else {
      setError('Invalid username or password')
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
          <h2>Admin Login</h2>
          
          {error && <p className="auth-error">{error}</p>}
          {loading && <p className="auth-loading">Loading...</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              name="username"
              autoComplete="username"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn" disabled={loading}>
              Sign in
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: '0.9em', color: '#FAF8F1' }}>
              Need help?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'transparent', border: 'none', color: '#a28ef9', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9em' }}
              >
                Regular login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
