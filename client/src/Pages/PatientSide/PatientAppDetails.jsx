import React, { useState, useEffect, useRef } from 'react'
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
  const pollingRef = useRef(null)

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
        const refetch = await axios.get(`http://localhost:3001/api/appointments/${appointment._id}`)
        if (refetch.data?.appointment) setAppointment(refetch.data.appointment)
      }
    } catch (err) {
      console.error('Cancel error', err)
      setError('Failed to cancel appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) {
    return (
      <div className="patient-layout">
        <PNavbar />
        <div className="pad-main">
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

  console.log('Doctor data:', doc)

    return (
    <div className="patient-layout">
      <PNavbar />
      <div className="pad-main">
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
                  <h4 className="doctor-name">{(doc.firstName || '') + ' ' + (doc.lastName || '')}</h4>
                  <p className="doctor-role">{doc.role || 'Psychiatrist'}</p>
                  <p className="doctor-fees">₱ {doc.fees ?? '—'} / session</p>
                </div>
              </div>
            </div>

            <div className="doctor-profile-bottom">
              <div className="doctor-experience">
                <h5>Experience</h5>
                <p className="doctor-experience-text">{doc.experience || '—'}</p>
              </div>
              <div className="doctor-specialty">
                <h5>Specialization</h5>
                <p className="doctor-specialty-text">{(Array.isArray(doc.education) && doc.education.join(', ')) || doc.specialty || '—'}</p>
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
                <div>{String(appointment.status || '—').toUpperCase()}</div>
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

          <div className="pad-section action-buttons">
            <button
              className="btn btn-primary"
              onClick={cancelAppointment}
              disabled={loading || appointment.status === 'cancelled'}
            >
              {loading
                ? 'Cancelling…'
                : appointment.status === 'cancelled'
                ? 'Cancelled'
                : 'Cancel Appointment'}
            </button>
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
