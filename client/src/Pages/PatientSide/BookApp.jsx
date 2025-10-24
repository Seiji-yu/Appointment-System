import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import PNavbar from '../../SideBar/PNavbar'
import CalendarC from '../../Calendar/CalendarC.jsx'
import '../../Styles/Ddashboard.css'

export default function BookApp() {
  const { email: emailParam } = useParams() // Email parameters
  const location = useLocation()

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, [])
  const slotOptions = useMemo(
    () => ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'],
    []
  )
  const [selectedSlot, setSelectedSlot] = useState('')
  const [concerns, setConcerns] = useState('')
  const [availableSlots, setAvailableSlots] = useState([]) // 'HH:mm' list
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Add here (before any use of `date`)
  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const [date, setDate] = useState(() => toYMD(new Date())); // yyyy-mm-dd (local)

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

  function hhmmTo12(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  const fetchSlots = async (dId, ymd) => {
    if (!dId || !ymd) return;
    setSlotsLoading(true);
    setSelectedSlot(''); // reset selection on date/doctor change
    try {
      const res = await axios.get('http://localhost:3001/api/doctor/' + dId + '/available-slots', {
        params: { date: ymd, slot: 30 }
      });
      setAvailableSlots(res.data?.slots || []);
    } catch (e) {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (doctor && date) {
      fetchSlots(doctor.id, date);
    }
  }, [doctor, date]);

  const handleBookNow = async () => {
    if (isSubmitting) return; // prevent double-click
    setSubmitNotice('');
    setIsSubmitting(true);
    try {
      if (!selectedSlot) {
        setSubmitNotice('Please select a time.');
        return;
      }
      const iso = new Date(`${date}T${selectedSlot}:00`).toISOString();

      const patientEmail = localStorage.getItem('patientEmail') || localStorage.getItem('email')
      if (!patientEmail) { setError('Missing patient email in localStorage. Please login again.'); return }

      const payload = { doctorId: doctor.id, patientEmail, date: iso, notes: concerns }
      await axios.post('http://localhost:3001/api/appointments', payload);

      setSubmitNotice('Booked successfully. You will receive updates once approved.');
    } catch (err) {
      const r = err?.response;
      const msg = r?.status === 409
        ? (r?.data?.message || (r?.data?.status === 'conflict'
            ? 'This time slot is not available.'
            : 'Booking cannot be created.'))
        : (r?.data?.message || 'Booking failed. Please try again.');
      setSubmitNotice(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <div className="dashboard-grid">
            {/* Left Side */}
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

            {/* Right Side */}
            <aside className="card grid-calendar" style={{ alignSelf: 'start' }}>
              <h3 style={{ marginTop: 0 }}>Booking Appointment</h3>

           <div className="mb-2">
                <label style={{ display: 'block', marginBottom: 6 }}>Select Date</label>
                {/* CalendarC */}
                <CalendarC
                  value={new Date(date)}
                  showHeader={false}
                  minDate={todayStart}
                  disableDate={(d) => {
                    const x = new Date(d); x.setHours(0,0,0,0);
                    return x < todayStart;
                  }}
                  onChange={(d) => {
                    const picked = new Date(d);
                    picked.setHours(0,0,0,0);
                    if (picked < todayStart) {
                      setSubmitNotice('You cannot book a past date.');
                      return;
                    }
                    setSubmitNotice('');
                    setDate(toYMD(picked)); // Use local YMD, not ISO
                  }}
                />
              </div>

              <div className="mb-2">
                <label style={{ display: 'block', marginBottom: 6 }}>Select Time</label>
                {slotsLoading ? (
                  <p>Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p>No availability for this date.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableSlots.map(s => (
                      <button
                        type="button"
                        key={s}
                        className={`btn ${selectedSlot === s ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedSlot(s)}
                      >
                        {hhmmTo12(s)}
                      </button>
                    ))}
                  </div>
                )}
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

              <button
                type="button"
                onClick={handleBookNow}
                disabled={isSubmitting || !selectedSlot || !date || !doctor}
                aria-busy={isSubmitting ? 'true' : 'false'}
                className="btn btn-primary"
                style={{ marginTop: 12 }}
              >
                {isSubmitting ? 'Booking…' : 'Book Now'}
              </button>

              {isSubmitting && (
                <p style={{ marginTop: 8, color: '#666' }}>
                  Submitting your request.
                </p>
              )}
              {submitNotice && (
                <p style={{ marginTop: 8, color: submitNotice.startsWith('Booked') ? 'green' : 'crimson' }}>
                  {submitNotice}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
