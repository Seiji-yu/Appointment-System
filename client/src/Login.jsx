import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    axios.post('http://localhost:3001/login', {email, password})
    .then(result => {
        console.log(result)
        if(result.data === "Success") {
            navigate('/dashboard') // Redirect to dashboard on successful login
        }
    })
    .catch(err=> console.log(err))
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

        <h2>Welcome Back</h2>

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
