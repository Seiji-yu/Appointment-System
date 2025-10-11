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
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!role) {
      alert('Please select a role')
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
            <button type="button" className={`tab ${activeTab === 'signin' ? 'active-tab' : ''}`} onClick={() => setActiveTab('signin')}>Sign in</button>
          </div>
        </div>

        <h2>Create an Account</h2>

        <form onSubmit={handleSubmit}>
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
            <input type="checkbox" required />
            <label>I agree to the <span>Terms & Conditions</span></label>
          </div>

          <button type="submit" className="submit-btn">Create an Account</button>
        </form>

        <div className="divider">Or register with</div>

        <div className="social-login">
          <button className="google-btn">
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" />
            Google
          </button>
          <button className="apple-btn">
            <img src="https://www.svgrepo.com/show/349527/apple.svg" alt="Apple" />
            Apple
          </button>
        </div>
      </div>
    </div>
  )
}

export default Signup
