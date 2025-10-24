import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import CalendarC from '../../Calendar/CalendarC.jsx';
import '../../Styles/Ddashboard.css';
import { useNavigate } from 'react-router-dom';

export default function Ddashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // doctor-scoped metrics
  const [totalPatients, setTotalPatients] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [recentPatients, setRecentPatients] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError('');
        setRecentLoading(true);

        // Resolve current doctor by email from localStorage
        const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
        if (!email) {
          setError('Missing doctor email. Please login again.');
          setRecentLoading(false);
          return;
        }

        // Get doctor profile -> id
        const prof = await axios.post('http://localhost:3001/doctor/get-profile', { email });
        const doctor = prof.data?.doctor;
        if (!doctor?._id) {
          setError('Doctor profile not found.');
          setRecentLoading(false);
          return;
        }
        const doctorId = doctor._id;

        // Fetch doctor-scoped metrics and recent patients
        const [countRes, statsRes, recentRes] = await Promise.all([
          axios.get(`http://localhost:3001/api/doctor/${doctorId}/patients/count`),
          axios.get(`http://localhost:3001/api/doctor/${doctorId}/stats`),
          axios.get('http://localhost:3001/api/patients/recent', { params: { doctorId, limit: 6 } }),
        ]);

        if (cancelled) return;

        // Unique patients seen by this doctor (any status)
        setTotalPatients(countRes.data?.count || 0);

        // Appointments stats scoped to this doctor
        setUpcomingCount(statsRes.data?.upcoming || 0);
        setPendingCount(statsRes.data?.pending || 0);
        setCompletedCount(statsRes.data?.completed || 0);

        // Recent patients from completed appointments
        if (recentRes.data?.status === 'success' && Array.isArray(recentRes.data.patients)) {
          const mapped = recentRes.data.patients.map(p => ({
            id: p.patientId,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Patient',
            email: p.email || ''
          }));
          setRecentPatients(mapped);
        } else {
          setRecentPatients([]);
        }
      } catch (e) {
        setError('Failed to load dashboard data.');
        setRecentPatients([]);
        setTotalPatients(0);
        setUpcomingCount(0);
        setPendingCount(0);
        setCompletedCount(0);
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <main className="dashboard-main">
          {/* Search Bar */}
          <div className="search-bar">
            <input type="text" placeholder="Search doctor, patient, or appointment..." />
          </div>

          {error && <div className="card" style={{ padding: 12, color: 'red', marginBottom: 12 }}>{error}</div>}

          <div className="dashboard-grid">
            {/* Cards */}
            <section className="cards-section grid-cards">
              <div className="dashboard-cards">
                <div className="card"><h4>Total Patients Handled</h4><p>{totalPatients}</p></div>
                <div className="card"><h4>Pending Approvals</h4><p>{pendingCount}</p></div>
                <div className="card"><h4>Approved Appointments</h4><p>{upcomingCount}</p></div>
                <div className="card"><h4>Completed Appointments</h4><p>{completedCount}</p></div>
              </div>
            </section>

            <aside className="calendar-section grid-calendar">
              <CalendarC />
            </aside>

            <section className="recent-patients-section grid-recent">
              <div className="section-header">
                <h3>Previous Patients</h3>
                <span className="section-subtitle">Recent consultations</span>
              </div>

              {recentLoading ? (
                <div className="card" style={{ padding: 16 }}>Loading...</div>
              ) : recentPatients.length === 0 ? (
                <div className="card" style={{ padding: 16 }}>No previous patients yet.</div>
              ) : (
                <div className="patient-grid">
                  {recentPatients.map((p) => (
                    <div key={p.id} className="patient-card">
                      <div className="avatar-skeleton" />
                      <div className="patient-meta">
                        <h5 className="patient-name">{p.name}</h5>
                        <div className="patient-actions">
                          <button className="btn btn-secondary" onClick={() => alert('History (placeholder)')}>History</button>
                          <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/Doctor/Patient/${encodeURIComponent(p.email)}`)}
                            disabled={!p.email}
                          >
                            Patient Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
