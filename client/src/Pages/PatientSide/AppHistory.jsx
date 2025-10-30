import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PNavbar from '../../SideBar/PNavbar'
import CalendarC from '../../Calendar/CalendarC.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../Styles/AppHistory.css'

function AppHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId') || null;
    const email = localStorage.getItem('email') || null;
    if (!patientId && !email) return;

    const statusForTab = () => {
      if (activeTab === 'upcoming') return 'pending,approved';
      if (activeTab === 'completed') return 'completed';
      if (activeTab === 'cancelled') return 'cancelled,rejected';
      return '';
    };

    const buildUrl = () => {
      const status = statusForTab();
      const base = patientId ? `http://localhost:3001/api/appointments?patientId=${patientId}` : `http://localhost:3001/api/appointments?patientEmail=${encodeURIComponent(email)}`;
      return status ? `${base}&status=${encodeURIComponent(status)}` : base;
    };

    const fetchAppointments = async () => {
      try {
        const res = await fetch(buildUrl());
        const data = await res.json();
        if (data && data.appointments) setAppointments(data.appointments);
        else setAppointments([]);
      } catch (err) {
        console.error('Failed to load appointments', err);
        setAppointments([]);
      }
    };

    fetchAppointments();
    const iv = setInterval(fetchAppointments, 5000);
    return () => clearInterval(iv);
  }, [activeTab]);

  return (
    <div className={`dashboard patient-history ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
     <div className="dashboard-main container-fluid py-4">
        <div className="ph-container">
          <h2 className="text-center mb-4">Appointment History</h2>

          <ul className="nav nav-tabs justify-content-center mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Completed</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>Cancelled/Rejected</button>
            </li>
          </ul>

          <div className="tab-content">
            {activeTab === 'upcoming' && (
              <div className="row justify-content-center g-4">
                {/* Left column: list */}
                <div className="col-12 col-lg-7">
                  <h5 className="mb-3">Your Appointment Requests</h5>
                  {appointments.map(a => {
                    const doc = a.doctor || {};
                    const apptDate = a.date ? new Date(a.date) : null;
                    const dateOnly = apptDate ? apptDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
                    const timeOnly = apptDate ? apptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
                    const handleOpen = () => navigate('/PatientAppDetails', { state: { appointment: a, appointmentId: a._id } });
                    const onKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } };
                    return (
                      <div key={a._id} className="appt-item appt-row-style card mb-2" role="button" tabIndex={0} onClick={handleOpen} onKeyDown={onKeyDown}>
                        <div className="appt-left"><img className="appt-avatar" src={doc.profileImage || '/default-avatar.png'} alt="avatar" /></div>
                        <div className="appt-center">
                          <div className="doctor-name">{(doc.firstName||'') + (doc.lastName ? ' '+doc.lastName : '') || 'Doctor'}</div>
                          <div className="appt-datetime">{dateOnly} / {timeOnly}</div>
                        </div>
                        <div className="appt-right"><div className={`appt-status status-${a.status||''}`}>{(a.status||'').toUpperCase()}</div></div>
                      </div>
                    )
                  })}
                </div>

                {/* Right column: calendar */}
                <div className="col-12 col-lg-5">
                  <aside className="calendar-section ph-calendar">
                    <CalendarC />
                  </aside>
                </div>
              </div>
            )}

            {activeTab === 'completed' && (
              <div>
                <h5 className="mb-3">Completed Appointments</h5>
                {appointments.map(a => {
                  const doc = a.doctor || {};
                  const apptDate = a.date ? new Date(a.date) : null;
                  const dateOnly = apptDate ? apptDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
                  const timeOnly = apptDate ? apptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <div key={a._id} className="appt-item appt-row-style card mb-2" role="button" tabIndex={0} onClick={() => navigate('/PatientAppDetails', { state: { appointment: a, appointmentId: a._id } })}>
                      <div className="appt-left"><img className="appt-avatar" src={doc.profileImage || '/default-avatar.png'} alt="avatar" /></div>
                      <div className="appt-center">
                        <div className="doctor-name">{(doc.firstName||'') + (doc.lastName ? ' '+doc.lastName : '') || 'Doctor'}</div>
                        <div className="appt-datetime">{dateOnly} / {timeOnly}</div>
                      </div>
                      <div className="appt-right"><div className={`appt-status status-${a.status||''}`}>{(a.status||'').toUpperCase()}</div></div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'cancelled' && (
              <div>
                <h5 className="mb-3">Cancelled/Rejected Appointments</h5>
                {appointments.map(a => {
                  const doc = a.doctor || {};
                  const apptDate = a.date ? new Date(a.date) : null;
                  const dateOnly = apptDate ? apptDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
                  const timeOnly = apptDate ? apptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';
                  return (
                    <div key={a._id} className="appt-item appt-row-style card mb-2" role="button" tabIndex={0} onClick={() => navigate('/PatientAppDetails', { state: { appointment: a, appointmentId: a._id } })}>
                      <div className="appt-left"><img className="appt-avatar" src={doc.profileImage || '/default-avatar.png'} alt="avatar" /></div>
                      <div className="appt-center">
                        <div className="doctor-name">{(doc.firstName||'') + (doc.lastName ? ' '+doc.lastName : '') || 'Doctor'}</div>
                        <div className="appt-datetime">{dateOnly} / {timeOnly}</div>
                      </div>
                      <div className="appt-right"><div className={`appt-status status-${a.status||''}`}>{(a.status||'').toUpperCase()}</div></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHistory;
