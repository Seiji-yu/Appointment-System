import React, { useState } from 'react'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'
import CalendarC from '../../Calendar/CalendarC.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';

function AppHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Simulated appointment status (would normally come from backend or shared context)
  const [appointments, setAppointments] = useState([
    { id: 1, name: 'Kween Lengleng', date: 'Sunday, 2 November 2025', status: 'Pending' },
    { id: 2, name: 'Kween Yasmin', date: 'Sunday, 2 November 2025', status: 'Pending' }
  ]);

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main container py-4">
        <h2 className="text-center mb-4">Appointment History</h2>

       
        <ul className="nav nav-tabs mb-3">
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
            <div className="row">
              
              <div className="col-md-8">
                <h5 className="mb-3">Your Appointment Requests</h5>
                {appointments.map(app => (
                  <div key={app.id} className="card appointment-card mb-3">
                    <div className="card-body">
                      <h5 className="card-title"> {app.name}</h5>
                      <p className="card-text">{app.date}</p>
                      <p className="status">Status: {app.status}</p>
                    </div>
                  </div>
                ))}
              </div>

            
              <div className="col-md-4">
                <aside className="calendar-section grid-calendar">
                  <CalendarC />
                </aside>
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              <h5 className="mb-3">Completed Appointments</h5>
              {appointments.filter(a => a.status === 'Completed').map(c => (
                <div key={c.id} className="card appointment-card mb-3">
                  <div className="card-body">
                    <h5 className="card-title"> {c.name}</h5>
                    <p className="card-text">{c.date}</p>
                    <p className="status">Status: {c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'cancelled' && (
            <div>
              <h5 className="mb-3">Cancelled/Rejected Appointments</h5>
              {appointments.filter(a => a.status === 'Rejected' || a.status === 'Cancelled').map(c => (
                <div key={c.id} className="card appointment-card mb-3">
                  <div className="card-body">
                    <h5 className="card-title"> {c.name}</h5>
                    <p className="card-text">{c.date}</p>
                    <p className="status">Status: {c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppHistory;