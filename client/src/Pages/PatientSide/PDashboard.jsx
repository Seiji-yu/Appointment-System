import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PNavbar from "../../SideBar/PNavbar";
import "../../Styles/PNavbar.css";
import "../../Styles/PDashboard.css";
import PDashboardCalendar from "../../Calendar/PatientCalendar/PDashboardCalendar";

function PDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate("/DoctorLists");
  };

  useEffect(() => {
    const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId') || null;
    const email = localStorage.getItem('email') || null;
    if (!patientId && !email) return;

    const buildUrl = () => {
      if (patientId) return `http://localhost:3001/api/appointments?patientId=${patientId}`;
      return `http://localhost:3001/api/appointments?patientEmail=${encodeURIComponent(email)}`;
    };

    const fetchAppointments = async () => {
      try {
        const res = await fetch(buildUrl());
        const data = await res.json();
        if (data && data.appointments) setAppointments(data.appointments);
      } catch (err) {
        console.error('Failed loading appointments', err);
      }
    };

    fetchAppointments();
    const iv = setInterval(fetchAppointments, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="patient-dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Grid container with named areas */}
        <div className="dashboard-grid">
          <div className="welcome-box">
            <h1>Welcome to Your Dashboard!</h1>
            <p className="lead">Healing is not linear, but it is possible.</p>
          </div>

          <div className="calendar-section">
            <PDashboardCalendar onDateChange={() => {}} />
          </div>

          <div className="appointments-section">
              <h3>My Appointments</h3>

              <div className="my-appointments-list">
                {appointments.length === 0 && (
                  <p className="no-appointments">You have no pending or approved appointments.</p>
                )}

                {appointments.map((a) => {
                  const doc = a.doctor || {};
                  const apptDate = a.date ? new Date(a.date) : null;
                  const dateStr = apptDate ? apptDate.toLocaleString() : '—';
                  const handleOpen = () => {
                    try {
                      navigate('/PatientAppDetails', { state: { appointment: a, appointmentId: a._id } });
                    } catch (e) {
                      console.error('Navigation error', e);
                    }
                  };

                  const onKeyDown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpen();
                    }
                  };

                  // format date and time separately
                  const dt = apptDate;
                  const dateOnly = dt ? dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
                  const timeOnly = dt ? dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';

                  return (
                    <div
                      className="appt-item appt-row-style"
                      key={a._id}
                      role="button"
                      tabIndex={0}
                      onClick={handleOpen}
                      onKeyDown={onKeyDown}
                    >
                      <div className="appt-left">
                        <img className="appt-avatar" src={doc.profileImage || '/public/avatar-placeholder.png'} alt="avatar" />
                      </div>

                      <div className="appt-center">
                        <div className="doctor-name">{(doc.firstName || '') + (doc.lastName ? ' ' + doc.lastName : '') || 'Doctor'}</div>
                        <div className="appt-datetime">{dateOnly} / {timeOnly}</div>
                      </div>

                      <div className="appt-right">
                        <div className={`appt-status status-${a.status || ''}`}>{(a.status || '').toUpperCase()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="book-btn" onClick={handleBookAppointment}>
                Book an Appointment
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDashboard;
