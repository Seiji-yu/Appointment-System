import React, { useState, useEffect, useRef } from 'react'
import { FaStar } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import PNavbar from '../../SideBar/PNavbar'
import axios from 'axios'
import '../../Styles/PatientAppDetails.css'

export default function PatientAppDetails() {
  const location = useLocation()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(location.state?.appointment || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const pollingRef = useRef(null)
  const submittingReviewRef = useRef(false)

  useEffect(() => {
    if (appointment) {
      setRating(appointment.rating || 0)
      setReviewText(appointment.review || '')
      setSubmitted(!!appointment.rating)
    }
  }, [appointment])

  const qs = new URLSearchParams(location.search)
  const appointmentId = appointment?._id || location.state?.appointmentId || qs.get('id') || null

  // fetch appointment if not passed from state
  useEffect(() => {
    let cancelled = false

    const fetchAppointment = async (id) => {
      try {
        const res = await axios.get(`http://localhost:3001/api/appointments/${id}`)
        if (cancelled) return
        if (res.data?.appointment) {
          setAppointment(res.data.appointment)
          console.log('Fetched appointment:', res.data.appointment)
        }
      } catch (err) {
        console.error('Fetch appointment error', err)
        if (!cancelled) setError('Failed to load appointment details.')
      }
    }

    if (!appointment && appointmentId) {
      fetchAppointment(appointmentId)
    }

    return () => { cancelled = true }
  }, [appointment, appointmentId])

  // poll for updates (stop if status !== pending)
  useEffect(() => {
    if (!appointmentId) return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/appointments/${appointmentId}`)
        const serverAppt = res.data?.appointment
        if (serverAppt) {
          setAppointment(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(serverAppt)) return serverAppt
            return prev
          })
          if (serverAppt.status && serverAppt.status !== 'pending') {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      } catch (err) {
        console.error('Polling error', err)
      }
    }, 5000)

    return () => clearInterval(pollingRef.current)
  }, [appointmentId])

  const cancelAppointment = async () => {
    if (!appointment?._id) return
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return

    setLoading(true)
    try {
      const res = await axios.patch(`http://localhost:3001/api/appointments/${appointment._id}`, { status: 'cancelled' })
      if (res.data?.appointment) {
        // refetch full populated appointment and stay on details page
        const refetch = await axios.get(`http://localhost:3001/api/appointments/${appointment._id}`)
        if (refetch.data?.appointment) setAppointment(refetch.data.appointment)
        // stop polling since status is no longer pending
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setMessage('Appointment cancelled')
      }
    } catch (err) {
      console.error('Cancel error', err)
      setError('Failed to cancel appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!appointment?._id) return
    // prevent submitting if there's already a stored review
    if (appointment.rating) {
      setReviewMessage('You have already submitted a review for this appointment')
      return
    }
    if (submittingReviewRef.current) return
    submittingReviewRef.current = true
    setSubmittingReview(true)
    setReviewError('')
    setReviewMessage('')
    try {
      const res = await axios.post(`http://localhost:3001/api/appointments/${appointment._id}/review`, { rating, review: reviewText })
      if (res.data?.appointment) {
        setAppointment(res.data.appointment)
        setReviewMessage('Thank you for your review')
        setSubmitted(true)
      } else {
        setReviewError('Failed to submit review')
      }
    } catch (err) {
      console.error('Submit review error', err)
      setReviewError('Failed to submit review')
    } finally {
      setSubmittingReview(false)
      submittingReviewRef.current = false
    }
  }

  if (!appointment) {
    return (
      <div className="doctor-layout sidebar-open">
        <PNavbar />
        <div className="dashboard-main">
          <p style={{ color: 'crimson' }}>{error || 'No appointment data available.'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/PatientDashboard')}>Back to Home</button>
        </div>
      </div>
    )
  }

  const doc = appointment.doctor || {}
  const pat = appointment.patient || {}
  const apptDate = appointment.date ? new Date(appointment.date) : null
  const apptDateStr = apptDate ? apptDate.toLocaleDateString() : '—'
  const apptTimeStr = apptDate ? apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

  const prettyStatus = (s) => {
    if (!s) return '—'
    const st = String(s).toLowerCase()
    return st.charAt(0).toUpperCase() + st.slice(1)
  }

  console.log('Doctor data:', doc)

    return (
    <div className="doctor-layout sidebar-open">
      <PNavbar />
      <div className="dashboard-main">
        <div className="pad-dashboard-grid">
          {/* left side doctor profile */}
          <section className="card doctor-profile">
            <h3 className="doctor-profile-title">Doctor Profile</h3>

            <div className="doctor-profile-top">
              <div className="doctor-profile-row">
                <img
                  className="doctor-avatar"
                  src={doc.profileImage || 'https://via.placeholder.com/180'}
                  alt="Doctor"
                />
                <div className="doctor-info">
                  <h4 className="padDoctor-name">{(doc.firstName || '') + ' ' + (doc.lastName || '')}</h4>
                  <p className="doctor-role">{doc.role || 'Psychiatrist'}</p>
                  <p className="doctor-fees">₱ {doc.fees ?? '—'} / session</p>
                </div>
              </div>
            </div>

            <div className="doctor-profile-bottom">
              <div className="doctor-about">
                <h5>About</h5>
                <p className="doctor-about-text">{doc.about || '—'}</p>
              </div>

              <div className="doctor-experience">
                <h5>Experience</h5>
                <p className="doctor-experience-text">{doc.experience || '—'}</p>
              </div>

              <div className="doctor-specialty">
                <h5>Specialization</h5>
                <p className="doctor-specialty-text">{doc.specialty || '—'}</p>
              </div>

              <div className="doctor-clinicAddress">
                <h5>Clinic Address</h5>
                <p className="doctor-clinicAddress-text">{doc.address1 || '—'}</p>
              </div>
            </div>
          </section>

        {/* right side appointment summary */}
        <aside className="card pad-details-right">
          <div className="pad-section thankyou">
            Thank you for booking an appointment!
          </div>

          <div className="pad-section">
            <h4>Appointment Details</h4>
            <div className="two-col">
              <div className="left">
                <div>Appointment Status</div>
                <div>Doctor Name</div>
                <div>Date</div>
                <div>Time</div>
                <div>To Pay</div>
                <div>Doctor Email</div>
                <div>Doctor Contact</div>
              </div>
              <div className="right">
                <div>
                  <span className={`appt-status status-${String(appointment.status || '').toLowerCase()}`}>
                    {prettyStatus(appointment.status)}
                  </span>
                </div>
                <div>{(doc.firstName || '') + ' ' + (doc.lastName || '')}</div>
                <div>{apptDateStr}</div>
                <div>{apptTimeStr}</div>
                <div>₱ {doc.fees ?? '—'}</div>
                <div>{doc.email || '—'}</div>
                <div>{doc.contact || '—'}</div>
              </div>
            </div>
          </div>

          <div className="pad-section patient-info">
            <h4>Patient Information</h4>
            <div className="two-col">
              <div className="left">
                <div>Patient Name</div>
                <div>Patient Email</div>
                <div>Patient Contact</div>
                <div>HMO Number</div>
                <div>HMO Card</div>
              </div>
              <div className="right">
                <div>
                  {(pat.firstName || pat.name || '') +
                    (pat.lastName ? ' ' + pat.lastName : '')}
                </div>
                <div>{pat.email || localStorage.getItem('email') || '—'}</div>
                <div>{pat.contact || '—'}</div>
                <div>{pat.hmoNumber || '—'}</div>
                <div>
                  {pat.hmoCardImage ? (
                    <img
                      src={pat.hmoCardImage}
                      alt="HMO Card"
                      className="hmo-card"
                    />
                  ) : (
                    <div style={{ color: '#9ca3af' }}>No HMO card</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pad-section patient-concern">
            <h4>Patient Concern</h4>
            <div>{appointment.notes || '—'}</div>
          </div>

          {/* review / rating section (show when appointment completed and not yet reviewed) */}
          {appointment.status === 'completed' && (
            <div className="pad-section patient-review">
              <h4>Rate Your Appointment</h4>
              <div className="rating-stars">
                {[1,2,3,4,5].map(i => {
                  const filled = appointment?.rating ? appointment.rating >= i : (hoverRating || rating) >= i
                  return (
                    <span
                      key={i}
                      className={`rating-star ${filled ? 'filled' : ''} ${appointment?.rating ? 'readonly' : ''}`}
                      onClick={appointment?.rating ? undefined : () => setRating(i)}
                      onMouseEnter={appointment?.rating ? undefined : () => setHoverRating(i)}
                      onMouseLeave={appointment?.rating ? undefined : () => setHoverRating(0)}
                    >
                      <FaStar />
                    </span>
                  )
                })}
              </div>
              <div className="rating-textarea">
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Leave a comment (optional)" rows={4} className="form-control" />
              </div>
              <div className="rating-actions">
                {!appointment?.rating ? (
                  <button
                    className="btn btn-primary"
                    disabled={submittingReview || rating < 1 || submitted}
                    onClick={submitReview}
                  >
                    {submittingReview ? 'Submitting…' : (submitted ? 'Submitted' : 'Submit Review')}
                  </button>
                ) : (
                  <div className="text-muted">You rated this appointment {appointment.rating} / 5</div>
                )}
              </div>
              {reviewMessage && <div className="alert alert-success mt-2">{reviewMessage}</div>}
              {reviewError && <div className="alert alert-danger mt-2">{reviewError}</div>}
            </div>
          )}

          <div className="pad-section action-buttons">
            {(appointment.status || '').toLowerCase() !== 'cancelled' && (appointment.status || '').toLowerCase() !== 'completed' && (
              <button
                className="btn btn-primary"
                onClick={cancelAppointment}
                disabled={loading}
              >
                {loading ? 'Cancelling…' : 'Cancel Appointment'}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/PatientDashboard')}
            >
              Back to Home
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
)
}
