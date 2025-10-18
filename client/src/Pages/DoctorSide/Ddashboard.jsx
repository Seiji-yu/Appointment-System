import React, { useState, useEffect } from 'react';
import Navbar from '../../SideBar/Navbar.jsx';
import CalendarC from '../../Calendar/CalendarC.jsx';
import '../../Styles/Ddashboard.css';

export default function Ddashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalPatients, setTotalPatients] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    fetch("http://localhost:3001/api/patients/count")
      .then(res => res.json())
      .then(data => setTotalPatients(data.count))
      .catch(err => {
        console.error('Failed to fetch patient count:', err);
        setTotalPatients(0);
      });

    fetch("http://localhost:3001/api/appointments/stats")
      .then(res => res.json())
      .then(date => {
        setUpcomingCount(date.upcoming);
        setPendingCount(date.pending);
        setCompletedCount(date.completed);
      })
      .catch(err => console.error('Failed to fetch appointment stats:', err));
  }, []);

  return (
    <>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>

        <main className="dashboard-main">
          {/*Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search doctor, patient, or appointment..."
            />
          </div>

          {/*Dashboard Cards */}
          <div className="dashboard-content">
            {/* Cards */}
            <section className="cards-section">
              <div className="dashboard-cards">
                <div className="card">
                  <h4>Total Patients</h4>
                  <p>{totalPatients}</p>
                </div>
                <div className="card">
                  <h4>Upcoming Appointments</h4>
                  <p>{upcomingCount}</p>
                </div>
                <div className="card">
                  <h4>Pending Approvals</h4>
                  <p>{pendingCount}</p>
                </div>
                <div className="card">
                  <h4>Completed Appointments</h4>
                  <p>{completedCount}</p>
                </div>
              </div>
            </section>

            {/* Calendar */}
            <div className="calendar-section">
              <CalendarC />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
