import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import '../Styles/Signup.css'
import { motion } from 'framer-motion'
import LogoImg from '../Images/Auth Images/Logo.jpg'
import Pic1 from '../Images/Auth Images/AuthPic1.jpg'
import Pic2 from '../Images/Auth Images/AuthPic2.jpg'
import Pic3 from '../Images/Auth Images/AuthPic3.jpg'

function Signup() {
  const [activeTab, setActiveTab] = useState('signup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const navigate = useNavigate()
  // slider state
  const slideImgs = [LogoImg, Pic1, Pic2, Pic3]
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const autoRef = useRef(null)
  const resumeRef = useRef(null)
  const RESUME_DELAY = 8000 // ms to resume autoplay after inactivity

  useEffect(() => {
    // clear any existing timer
    if (autoRef.current) {
      clearTimeout(autoRef.current)
      autoRef.current = null
    }
    if (!autoPlay) return
    // schedule next slide
    console.debug('[slider] schedule timeout, current=', current)
    autoRef.current = setTimeout(() => {
      console.debug('[slider] timeout fired, advancing')
      setCurrent((c) => (c + 1) % slideImgs.length)
      autoRef.current = null
    }, 3000)
    return () => {
      if (autoRef.current) {
        clearTimeout(autoRef.current)
        autoRef.current = null
      }
    }
  }, [autoPlay, current, slideImgs.length])

  const goPrev = () => {
    // stop autoplay and go to previous slide; clear pending timer immediately
    setAutoPlay(false)
    if (autoRef.current) {
      console.debug('[slider] goPrev clearing autoRef')
      clearTimeout(autoRef.current)
      autoRef.current = null
    }
    if (resumeRef.current) {
      clearTimeout(resumeRef.current)
      resumeRef.current = null
    }
    console.debug('[slider] goPrev -> current will update')
    setCurrent((c) => (c - 1 + slideImgs.length) % slideImgs.length)
    // schedule resume
    resumeRef.current = setTimeout(() => setAutoPlay(true), RESUME_DELAY)
  }

  const goNext = () => {
    // stop autoplay and go to next slide; clear pending timer immediately
    setAutoPlay(false)
    if (autoRef.current) {
      console.debug('[slider] goNext clearing autoRef')
      clearTimeout(autoRef.current)
      autoRef.current = null
    }
    if (resumeRef.current) {
      clearTimeout(resumeRef.current)
      resumeRef.current = null
    }
    console.debug('[slider] goNext -> current will update')
    setCurrent((c) => (c + 1) % slideImgs.length)
    // schedule resume
    resumeRef.current = setTimeout(() => setAutoPlay(true), RESUME_DELAY)
  }

  const goTo = (i) => {
    setAutoPlay(false)
    if (autoRef.current) {
      console.debug('[slider] goTo clearing autoRef')
      clearTimeout(autoRef.current)
      autoRef.current = null
    }
    if (resumeRef.current) {
      clearTimeout(resumeRef.current)
      resumeRef.current = null
    }
    console.debug('[slider] goTo -> current will update to', i % slideImgs.length)
    setCurrent(i % slideImgs.length)
    resumeRef.current = setTimeout(() => setAutoPlay(true), RESUME_DELAY)
  }

  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current)
      if (resumeRef.current) clearTimeout(resumeRef.current)
    }
  }, [])
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
        <div className="slider" aria-hidden="false">
          {/* slides width is e.g. 400% for 4 slides; translateX should move by 100/numSlides% each step */}
          <div className="slides" style={{ transform: `translateX(-${(current * 100) / slideImgs.length}%)`, width: `${slideImgs.length * 100}%` }}>
            {slideImgs.map((src, i) => (
              <div
                key={i}
                className="slide"
                style={{ backgroundImage: `url(${src})`, width: `${100 / slideImgs.length}%` }}
                aria-hidden={current !== i}
              />
            ))}
          </div>
          <div className="slider-overlay" />
          <button className="slider-arrow prev" aria-label="Previous" onClick={goPrev}>&larr;</button>
          <button className="slider-arrow next" aria-label="Next" onClick={goNext}>&rarr;</button>
          <div className="dots">
            {slideImgs.map((_, i) => (
              <button key={i} className={`dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} aria-label={`Go to slide ${i+1}`} />
            ))}
          </div>
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