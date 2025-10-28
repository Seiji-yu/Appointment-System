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
    <div className="admin-login" style={{
      backgroundColor: '#fff7e2',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '60px',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Admin Login</h2>

      <div style={{
        backgroundColor: 'rgba(241, 242, 200, 0.1)',
        border: '2px solid black',
        padding: '30px 20px',
        borderRadius: '10px',
        width: '320px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {error && <p style={{ color: 'red', fontSize: '0.9em', textAlign: 'center' }}>{error}</p>}
        {loading && <p style={{ color: 'blue', fontSize: '0.9em', textAlign: 'center' }}>Loading...</p>}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="Username"
            name="username"
            autoComplete="username"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
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
            placeholder="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
