import { useState } from 'react'
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
      <div className="glass-card">
        <div className="tabs">
          <div className="tabs-bg">
            <div className="indicator" style={{ transform: 'translateX(100%)' }} />
            <button type="button" className="tab" onClick={() => navigate('/register')}>Sign up</button>
            <button type="button" className="tab active-tab">Sign in</button>
          </div>
        </div>

        <h2>Login to your Account</h2>

        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
        {loading && <p style={{ color: 'blue', marginBottom: '10px' }}>Loading...</p>}

        {/* Role toggle */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
          <label>
            <input
              type="radio"
              name="role"
              value="Patient"
              checked={role === 'Patient'}
              onChange={() => setRole('Patient')}
            /> Patient
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="Psychiatrist"
              checked={role === 'Psychiatrist'}
              onChange={() => setRole('Psychiatrist')}
            /> Psychiatrist
          </label>
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
  )
}

export default Login
