import React, { useState } from 'react';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';

function DoctorLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        <h2>Booking Logs</h2>
        <div className="dashboard-cards">
          <div className="card">
            <h4>Log #1</h4>
            <p>Details about booking log 1...</p>
          </div>
          <div className="card">
            <h4>Log #2</h4>
            <p>Details about booking log 2...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorLogs;