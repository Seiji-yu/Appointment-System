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
  const [selectedSlot, setSelectedSlot] = useState('')     // holds slot start 'HH:mm'
  const [availableSlots, setAvailableSlots] = useState([]) // holds ['HH:mm', ...] slot starts
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [concerns, setConcerns] = useState('') 

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
          contact: d.contact || d.address2 || '',
          profileImage: d.profileImage || ''
        })
      })
      .catch(() => setError('Failed to load doctor'))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [emailParam, location.search, location.state])

  const displayName = doctor ? `${doctor.firstName} ${doctor.lastName}`.trim() : ''

  function hhmmTo12(hhmm) {
    if (typeof hhmm !== 'string' || !/^\d{2}:\d{2}$/.test(hhmm)) return '—';
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return '—';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = (h % 12) || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  function addMinutesHHMM(hhmm, mins) {
    if (typeof hhmm !== 'string' || !/^\d{2}:\d{2}$/.test(hhmm)) return '—';
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return '—';
    const total = h * 60 + m + mins;
    const capped = Math.min(total, (24 * 60)); // allow 24:00 as end-of-day label
    const hh = String(Math.floor(capped / 60)).padStart(2, '0');
    const mm = String(capped % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const fetchSlots = async (dId, ymd) => {
    if (!dId || !ymd) return;
    setSlotsLoading(true);
    setSelectedSlot('');
    try {
      // Request split slots (default behavior), 60-minute intervals
      const res = await axios.get(`http://localhost:3001/api/doctor/${dId}/available-slots`, {
        params: { date: ymd, slot: 60 }
      });
      const slots = Array.isArray(res.data?.slots) ? res.data.slots : [];
      const clean = slots.filter(t => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t));
      setAvailableSlots(clean);
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
    if (isSubmitting) return;
    setSubmitNotice('');
    setIsSubmitting(true);
    try {
      if (!selectedSlot) {
        setSubmitNotice('Please select a time.');
        return;
      }

      const patientEmail = localStorage.getItem('patientEmail') || localStorage.getItem('email');
      if (!patientEmail) { setError('Missing patient email in localStorage. Please login again.'); return }

      // Send local date parts to avoid timezone shifts
      const payload = {
        doctorId: doctor.id,
        patientEmail,
        localYMD: date,        // 'YYYY-MM-DD' in local time
        timeHHMM: selectedSlot, // 'HH:mm' 24h start time
        notes: concerns
      };
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
        ? (r?.data?.message || 'This time slot is not available.')
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
                  <p>Loading availability...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="no-availability">No availability for this date.</p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 8,
                      width: '100%'
                    }}
                  >
                    {availableSlots.map((t) => {
                      const end = addMinutesHHMM(t, 60);
                      const key = `${t}-${end}`;
                      const label = `${hhmmTo12(t)} - ${hhmmTo12(end)}`;
                      return (
                        <button
                          type="button"
                          key={key}
                          className={`btn ${selectedSlot === t ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ width: '100%' }}
                          onClick={() => setSelectedSlot(t)}
                        >
                          {label}
                        </button>
                      );
                    })}
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
