import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'

export default function BookApp() {
  const { email: emailParam } = useParams()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)) // yyyy-mm-dd
  const slotOptions = useMemo(
    () => ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'],
    []
  )
  const [selectedSlot, setSelectedSlot] = useState('')
  const [concerns, setConcerns] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const qs = new URLSearchParams(location.search)
    const email = decodeURIComponent(emailParam || location.state?.email || qs.get('email') || '')
    if (!email) {
      setError('Invalid doctor')
      setLoading(false)
      return
    }

    axios.post('http://localhost:3001/doctor/get-profile', { email })
      .then(res => {
        if (cancelled) return
        const d = res.data?.doctor
        if (!d) { setError('Doctor not found'); return }
        setDoctor({
          id: d._id,
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || email,
          role: d.role || 'Psychiatrist',
          fees: d.fees ?? '—',
          experience: d.experience || '',
          education: Array.isArray(d.education) ? d.education : [],
          about: d.about || '',
          address1: d.address1 || '',
          address2: d.address2 || '',
          profileImage: d.profileImage || ''
        })
      })
      .catch(() => setError('Failed to load doctor'))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [emailParam, location.search, location.state])

  const displayName = doctor ? `${doctor.firstName} ${doctor.lastName}`.trim() : ''

  const handleBookPlaceholder = () => {
    if (!selectedSlot) {
      setError('Please select a time slot')
      return
    }
    // Placeholder only (no server call yet)
    alert(`Booking (placeholder): ${displayName || 'Doctor'} on ${date} at ${selectedSlot}\nConcerns: ${concerns || '(none)'}`)
    
  }

  return (
    <div className="dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <div className="dashboard-grid">
            {/* Left: Doctor Profile preview */}
            <section className="card" style={{ alignSelf: 'start' }}>
              <h3 style={{ marginTop: 0 }}>Doctor Profile</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                <img
                  src={doctor.profileImage || 'https://via.placeholder.com/180'}
                  alt="Doctor"
                  style={{ width: 180, height: 180, borderRadius: 12, objectFit: 'cover', background: '#eee' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '4px 0 8px', fontSize: '1.25rem' }}>{displayName}</h4>
                  <p style={{ margin: '4px 0' }}>{doctor.role}</p>
                  <p style={{ margin: '4px 0' }}>₱ {doctor.fees}/hr</p>
                  <hr />
                  <div>
                    <h5 style={{ margin: '8px 0' }}>Experience</h5>
                    <p style={{ margin: 0 }}>{doctor.experience || '—'}</p>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <h5 style={{ margin: '8px 0' }}>Specialty</h5>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {doctor.education.slice(0, 2).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Right: Booking panel */}
            <aside className="card grid-calendar" style={{ alignSelf: 'start' }}>
              <h3 style={{ marginTop: 0 }}>Booking Appointment</h3>

              <div className="mb-2">
                <label style={{ display: 'block', marginBottom: 6 }}>Select Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="mb-2">
                <label style={{ display: 'block', marginBottom: 6 }}>Select Time</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {slotOptions.map(s => (
                    <button
                      type="button"
                      key={s}
                      className={`btn ${selectedSlot === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSelectedSlot(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-2" style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Patient Concerns</label>
                <textarea
                  rows={4}
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  placeholder="Provide details that will help the doctor prepare..."
                  style={{ width: '100%' }}
                />
              </div>

              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleBookPlaceholder}>
                Book Now
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
