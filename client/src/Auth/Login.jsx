import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../Styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Patient')            // role state exists
  const [licenseNumber, setLicenseNumber] = useState('') // license state exists
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('signin')
  const navigate = useNavigate()

  const profileIsComplete = (p) => {
    if (!p) return false
    return !!(p.firstName && p.lastName && p.birthday && p.age && p.gender && p.contact && p.address && p.hmoNumber 
      && p.emergencyName && p.emergencyContact && p.emergencyAddress
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Validate license client-side only if Psychiatrist
      if (role === 'Psychiatrist') {
        const lic = licenseNumber.trim()
        const ok = /^\d{4}-\d{4}-\d{3}$/.test(lic)
        if (!ok) {
          setError('Enter a valid license number (1234-1234-123)')
          setLoading(false)
          return
        }
      }

      const result = await axios.post('http://localhost:3001/login', {
        email: email.trim(),
        password,
        role, // send selected role
        licenseNumber: role === 'Psychiatrist' ? licenseNumber.trim() : undefined
      })
      console.log('login response:', result.data)
      const data = result.data

      if (data && data.status === 'success') {
        const userEmail = email.trim()
        localStorage.setItem('email', userEmail)
        if (data.userId) localStorage.setItem('userId', data.userId)   // store userId

        const roleFromServer = data.user?.role || data.role || null
        if (roleFromServer) localStorage.setItem('role', roleFromServer)

        if (roleFromServer === 'Psychiatrist') {
          localStorage.setItem('doctorEmail', userEmail)
          navigate('/dashboard')
          return
        }

        try {
          const check = await axios.post('http://localhost:3001/patient/check-profile', { email: userEmail })
          if (check.data && check.data.complete) {
            navigate('/PatientDashboard')
          } else {
            navigate('/PatientForm')
          }
          return
        } catch (_) {}

        try {
          const res = await axios.post('http://localhost:3001/patient/get-profile', { email: userEmail })
          const patient = res.data?.patient || null
          if (profileIsComplete(patient)) {
            navigate('/PatientDashboard')
          } else {
            navigate('/PatientForm')
          }
        } catch {
          navigate('/PatientForm')
        }

      } else if (data && data.status === 'role_mismatch') {
        setError('Selected role does not match this account')
      } else if (data && (data.status === 'license_required' || data.status === 'invalid_license' || data.status === 'invalid_license_format')) {
        setError(data.message || 'License verification failed')
      } else if (data && data.status === 'wrong_password') {
        setError('Incorrect password')
      } else if (data && data.status === 'not_found') {
        setError('User not registered')
      } else {
        setError('Login failed')
      }
      
    } catch (err) {
      console.error('login error', err)
      setError('Your account is not for Psychiatrist. Use patient Login instead.')
    } finally {
      setLoading(false)
    }
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
          <div className="tabs">
            <div className="tabs-bg">
              <motion.div
                className="indicator"
                initial={{ x: '0%' }}
                animate={{ x: activeTab === 'signup' ? '0%' : '100%' }}
                transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 1 }}
                style={{ transition: 'none', willChange: 'transform' }}
              />
              <button
                type="button"
                className={`tab ${activeTab === 'signup' ? 'active-tab' : ''}`}
                onClick={() => {
                  // Navigate immediately (no delay)
                  navigate('/register')
                }}
              >
                Sign up
              </button>
              <button type="button" className={`tab ${activeTab === 'signin' ? 'active-tab' : ''}`}>Sign in</button>
            </div>
          </div>

          <h2>Login to your Account</h2>

          {error && <p className="auth-error">{error}</p>}
          {loading && <p className="auth-loading">Loading...</p>}

          {/* Role select (replaces previous radio toggle) */}
          <div className="role-field">
            <select className="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="Patient">Patient</option>
              <option value="Psychiatrist">Psychiatrist</option>
            </select>
          </div>

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

            {role === 'Psychiatrist' && (
              <input
                type="text"
                placeholder="License number (1234-1234-123)"
                name="license"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                pattern="[0-9]{4}-[0-9]{4}-[0-9]{3}"
                title="Format: 1234-1234-123"
                required
              />
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login