import React from 'react';
import Navbar from '../SideBar/Navbar';

function Ddashboard() {
  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <h1>Welcome to Doctor Dashboard</h1>
        <p>This is where you can manage appointments, view patients, etc.</p>
      </div>
    </div>
  );
}

export default Ddashboard;
