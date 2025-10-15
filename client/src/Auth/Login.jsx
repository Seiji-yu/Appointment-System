import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../Styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const profileIsComplete = (p) => {
    if (!p) return false
    return !!(p.firstName && p.lastName && p.birthday && p.age && p.gender && p.contact && p.address)
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await axios.post('http://localhost:3001/login', { email: email.trim(), password })
      console.log('login response:', result.data)
      const data = result.data
      
      if (data && data.status === 'success') {
        const userEmail = email.trim()
        localStorage.setItem('email', userEmail)
        
        // read role in the server
        const role = data.user?.role || data.role || data.roleName || null
        if (role) localStorage.setItem('role', role)

        // if role is Psychiatrist, redirect to dashboard
        if (role === 'Psychiatrist') {
          navigate('/dashboard')
          return
        }

        // if the role is patient, check if profile is filled in the server
        try {
          const check = await axios.post('http://localhost:3001/patient/check-profile', { email: userEmail })
          console.log('check-profile response:', check.data)
          if (check.data && check.data.complete) {
            navigate('/dashboard')
          } else {
            navigate('/patient/profile')
          }
          return
        } catch (chkErr) {
          console.warn('check-profile failed, falling back to get-profile', chkErr)
        }

        try {
          const res = await axios.post('http://localhost:3001/patient/get-profile', { email: userEmail })
          console.log('get-profile response:', res.data)
          const patient = res.data?.patient || null
          if (profileIsComplete(patient)) {
            navigate('/dashboard')
          } else {
            navigate('/patient/profile')
          }
        } catch (gErr) {
          console.error('get-profile failed, redirecting to profile:', gErr)
          navigate('/patient/profile')
        }

      } else if (data && data.status === 'wrong_password') {
        setError('Incorrect password')
      } else if (data && data.status === 'not_found') {
        setError('User not registered')
      } else {
        setError('Login failed')
      }
    } catch (err) {
      console.error('login error', err)
      setError('Unable to login. Check server and network.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="glass-card">
        <div className="tabs">
          <div className="tabs-bg">
            <div className="indicator" style={{ transform: 'translateX(100%)' }} />
            <button type="button" className="tab" onClick={() => navigate('/register')}>Sign up</button>
            <button type="button" className="tab active-tab">Sign in</button>
          </div>
        </div>

        <h2>Login to your Account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            autoComplete="off"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="submit-btn">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
