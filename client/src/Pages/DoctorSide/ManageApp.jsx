import React, { useState } from 'react';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';

export default function ManageApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main">
        <div className="dashboard-main">
          <h1>Manage Appointments</h1>
        </div>
      </main>
    </div>
  );
}