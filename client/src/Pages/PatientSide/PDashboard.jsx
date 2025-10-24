import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PNavbar from "../../SideBar/PNavbar";
import "../../Styles/PNavbar.css";
import "../../Styles/PDashboard.css";
import PDashboardCalendar from "../../Calendar/PatientCalendar/PDashboardCalendar";

function PDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate("/DoctorLists");
  };

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
            <p className="no-appointments">
              Appointments unavailable as of the moment.
            </p>
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
