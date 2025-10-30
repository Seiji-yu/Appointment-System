import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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
    <div style={{
      backgroundColor: '#fff7e2',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '60px',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Reset Password</h2>

      <div style={{
        backgroundColor: 'rgba(241, 242, 200, 0.1)',
        border: '2px solid black',
        padding: '30px 20px',
        borderRadius: '10px',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {error && <p style={{ color: 'red', fontSize: '0.9em', textAlign: 'center' }}>{error}</p>}
        {statusMessage && <p style={{ color: 'green', fontSize: '0.9em', textAlign: 'center' }}>{statusMessage}</p>}
        {loading && <p style={{ color: 'blue', fontSize: '0.9em', textAlign: 'center' }}>Processing...</p>}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#a28ef9',
              color: 'white',
              padding: '10px',
              width: '100%',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Set New Password
          </button>
        </form>

        <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
          Remember your password?{' '}
          <span
            style={{ color: '#a28ef9', cursor: 'pointer' }}
            onClick={() => navigate('/login')}
          >
            Back to login
          </span>
        </p>
      </div>
    </div>
  )
}
