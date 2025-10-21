import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import CalendarC from '../../Calendar/CalendarC.jsx';
import '../../Styles/Ddashboard.css';

export default function Ddashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Replace placeholders with server data (add lang kapag gusto pa dagdagan)
  const placeholderPatients = [
    { id: 'p1', name: 'Patient 1' }, 
    { id: 'p2', name: 'Patient 2' },
    { id: 'p3', name: 'Patient 3' }, 
    { id: 'p4', name: 'Patient 4' },
    { id: 'p5', name: 'Patient 5' }, 
    { id: 'p6', name: 'Patient 6' }, 
    { id: 'p7', name: 'Patient 7' }, 
    { id: 'p8', name: 'Patient 8' }, 
    { id: 'p9', name: 'Patient 9' }, 
    { id: 'p10', name: 'Patient 10' }, 
    { id: 'p11', name: 'Patient 11' }, 
    { id: 'p12', name: 'Patient 12' }
  ];
  const [recentPatients, setRecentPatients] = useState(placeholderPatients);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/patients/count")
      .then(res => res.json())
      .then(data => setTotalPatients(data.count))
      .catch(() => setTotalPatients(0));

    fetch("http://localhost:3001/api/appointments/stats")
      .then(res => res.json())
      .then(data => {
        setUpcomingCount(data.upcoming);
        setPendingCount(data.pending);
        setCompletedCount(data.completed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const doctorId = localStorage.getItem('userId');
    if (!doctorId) {
      setRecentLoading(false);
      return;
    }
    setRecentLoading(true);
    axios.get('http://localhost:3001/api/patients/recent', {
      params: { doctorId, limit: 6 }
    })
    .then(res => {
      if (res.data?.status === 'success' && Array.isArray(res.data.patients) && res.data.patients.length) {
        const mapped = res.data.patients.map(p => ({
          id: p.patientId,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Patient'
        }));
        setRecentPatients(mapped);
      } else {
        setRecentPatients(placeholderPatients);
      }
    })
    .catch(() => setRecentPatients(placeholderPatients))
    .finally(() => setRecentLoading(false));
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

        
          <div className="dashboard-grid">
            {/* Cards */}
            <section className="cards-section grid-cards">
              <div className="dashboard-cards">
                <div className="card"><h4>Total Patients</h4><p>{totalPatients}</p></div>
                <div className="card"><h4>Upcoming Appointments</h4><p>{upcomingCount}</p></div>
                <div className="card"><h4>Pending Approvals</h4><p>{pendingCount}</p></div>
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
              <div className="patient-grid">
                {recentPatients.map((p) => (
                  <div key={p.id} className="patient-card">
                    <div className="avatar-skeleton" />
                    <div className="patient-meta">
                      <h5 className="patient-name">{p.name}</h5>
                      <div className="patient-actions">
                        <button className="btn btn-secondary" onClick={() => alert('History (placeholder)')}>History</button>
                        <button className="btn btn-primary" onClick={() => alert('Patient Details (placeholder)')}>Patient Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
