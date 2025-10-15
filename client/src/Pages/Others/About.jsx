import React, { useState } from 'react';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';

function About() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        <h2>About Page</h2>
      </div>
    </div>
  );
}

export default About;