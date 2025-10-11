import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import './Signup.css'

function Signup() {
  const [activeTab, setActiveTab] = useState('signup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const navigate = useNavigate()

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
      name: `${firstName} ${lastName}`,
      email,
      password,
      role
    })
    .then(result => {
      console.log(result)
      navigate('/login')
    })
    .catch(err => console.log(err))
  }

  return (
    <div className="signup-page">
      <div className="glass-card">
        <div className="tabs">
          <div className="tabs-bg">
            <div className="indicator" style={{ transform: activeTab === 'signin' ? 'translateX(100%)' : 'translateX(0%)' }} />
            <button type="button" className={`tab ${activeTab === 'signup' ? 'active-tab' : ''}`} onClick={() => setActiveTab('signup')}>Sign up</button>
            <button type="button" className={`tab ${activeTab === 'signin' ? 'active-tab' : ''}`} onClick={() => navigate('/login')}>Sign in</button>
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
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select Role</option>
            <option value="Patient">Patient</option>
            <option value="Psychiatrist">Psychiatrist</option>
          </select>

          <div className="terms">
            <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} />
            <label>I agree to the <span>Terms & Conditions</span></label>
          </div>

          <button type="submit" className="submit-btn" onClick={() => console.log('submit button clicked')}>Create an Account</button>
        </form>

      </div>
    </div>
  )
}

export default Signup
