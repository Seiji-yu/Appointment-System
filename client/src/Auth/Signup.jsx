import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import '../Styles/Signup.css'
import { motion } from 'framer-motion'

function Signup() {
  const [activeTab, setActiveTab] = useState('signup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const navigate = useNavigate()
  const handleGoLogin = () => {
    // Navigate immediately (no delay)
    navigate('/login')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log('handleSubmit called', { firstName, lastName, email, password, role, termsChecked })

    if (!role) {
      alert('Please select a role')
      return
    }

    if (!termsChecked) {
      alert('Please agree to the Terms & Conditions')
      return
    }

    axios.post('http://localhost:3001/register', {
      firstName,
      lastName,
      email,
      password,
      role
    })
      .then(result => {
        console.log('Signup success:', result.data);
        navigate('/login');
      })
      .catch(err => console.error('Signup error:', err));

  }

   return (
    <div className="signup-page">
      <div className="auth-container">
        <div className="slider" aria-hidden="true">
          <div className="slides">
            <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=800&q=80')" }} />
            <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80')" }} />
            <div className="slide" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80')" }} />
          </div>
          <div className="slider-overlay" />
        </div>

        <div className="glass-card auth-panel">
          <div className="tabs">
            <div className="tabs-bg">
              <motion.div
                className="indicator"
                initial={{ x: '100%' }}
                animate={{ x: activeTab === 'signin' ? '100%' : '0%' }}
                transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 1 }}
                style={{ transition: 'none', willChange: 'transform' }}
              />
              <button type="button" className={`tab ${activeTab === 'signup' ? 'active-tab' : ''}`} onClick={() => setActiveTab('signup')}>Sign up</button>
              <button type="button" className={`tab ${activeTab === 'signin' ? 'active-tab' : ''}`} onClick={handleGoLogin}>Sign in</button>
            </div>
          </div>

          <h2>Create an Account</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="name-fields">
              <input
                type="text"
                placeholder="First Name"
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <input
              type="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              {/* Placeholder option is disabled so user must actively pick a role */}
              <option value="" disabled>Select Role</option>
              <option value="Patient">Patient</option>
              <option value="Psychiatrist">Psychiatrist</option>
            </select>

            <div className="terms">
              <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />
              <label>I agree to the <span>Terms & Conditions</span></label>
            </div>

            <button type="submit" className="submit-btn">Create an Account</button>
          </form>

        </div>
      </div>
    </div>
  )
}

export default Signup