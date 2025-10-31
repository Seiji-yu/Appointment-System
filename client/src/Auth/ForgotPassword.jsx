import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatusMessage('')
    setLoading(true)

    try {
      const res = await axios.post('http://localhost:3001/auth/forgot-password', { email: email.trim() })
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
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Forgot Password</h2>

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
        {loading && <p style={{ color: 'blue', fontSize: '0.9em', textAlign: 'center' }}>Sending...</p>}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Send Reset Link
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
