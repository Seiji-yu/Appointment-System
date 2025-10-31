import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PNavbar from '../../SideBar/PNavbar'
import CalendarC from '../../Calendar/CalendarC.jsx'
import '../../Styles/BookApp.css'

export default function BookApp() {
  const { email: emailParam } = useParams() // Email parameters
  const location = useLocation()

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');
  const navigate = useNavigate();

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
          specialty: d.specialty || 'Mental Health',
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
        params: { date: ymd, slot: 0 }
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
      const res = await axios.post('http://localhost:3001/api/appointments', payload);
      const created = res.data?.appointment;
      setSubmitNotice('Booked successfully. You will receive updates once approved.');

      // Redirect to appointment details page and pass the appointment object
      if (created) {
        navigate('/PatientAppDetails', { state: { appointment: created } })
        return
      }
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
          <div className="book-dashboard-grid">
            {/* Left Side: Doctor info - use same structure/styling as PatientAppDetails */}
            <section className="book-card doctor-profile">
              <h3 className="doctor-profile-title">Doctor Profile</h3>

              <div className="doctor-profile-top">
                <div className="doctor-profile-row">
                  <img
                    className="doctor-avatar"
                    src={doctor.profileImage || 'https://via.placeholder.com/180'}
                    alt="Doctor"
                  />
                  <div className="doctor-info">
                    <h4 className="bookDoctor-name">{displayName}</h4>
                    <p className="doctor-role">{doctor.specialty}</p>
                    <p className="doctor-fees">₱ {doctor.fees} / session</p>
                  </div>
                </div>
              </div>

            <div className="doctor-profile-bottom">
              <div className="doctor-about">
                <h5>About</h5>
                <p className="doctor-about-text">{doctor.about || '—'}</p>
              </div>

              <div className="doctor-experience">
                <h5>Experience</h5>
                <p className="doctor-experience-text">{doctor.experience || '—'}</p>
              </div>

              <div className="doctor-specialty">
                <h5>Specialization</h5>
                <p className="doctor-specialty-text">{doctor.specialty || '—'}</p>
              </div>

              <div className="doctor-clinicAddress">
                <h5>Clinic Address</h5>
                <p className="doctor-clinicAddress-text">{doctor.address1 || '—'}</p>
              </div>
            </div>
          </section>

            {/* Right Side: Booking */}
            <aside className="book-card book-grid-calendar" style={{ alignSelf: 'start' }}>
              <h3 style={{ marginTop: 0 }}>Book An Appointment</h3>

           <div className="mb-2">
                <label style={{ display: 'block', marginTop: 6, marginBottom: 6 }}>Select Date</label>
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
                <label style={{ display: 'block', marginTop: 6, marginBottom: 6 }}>Select Time</label>
                {slotsLoading ? (
                  <p>Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="no-availability">No availability for this date.</p>
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
