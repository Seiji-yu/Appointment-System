import React, { useState } from 'react';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import CalendarC from '../../Calendar/CalendarC.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function ManageApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [pending, setPending] = useState([
    { id: 1, name: 'Kween Lengleng', date: 'Sunday, 2 November 2025', status: 'Pending' },
    { id: 2, name: 'Kween Yasmin', date: 'Sunday, 2 November 2025', status: 'Pending' }
  ]);

  const [approved, setApproved] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [cancelled, setCancelled] = useState([]);

  const handleAccept = (id) => {
    const accepted = pending.find(p => p.id === id);
    setApproved([...approved, { ...accepted, status: 'Accepted' }]);
    setPending(pending.filter(p => p.id !== id));
  };

  const handleReject = (id) => {
    const rejected = pending.find(p => p.id === id);
    setCancelled([...cancelled, { ...rejected, status: 'Rejected' }]);
    setPending(pending.filter(p => p.id !== id));
  };

  const markCompleted = (id) => {
    const done = approved.find(a => a.id === id);
    setCompleted([...completed, { ...done, status: 'Completed' }]);
    setApproved(approved.filter(a => a.id !== id));
  };

  const markCancelled = (id) => {
    const cancelledApp = approved.find(a => a.id === id);
    setCancelled([...cancelled, { ...cancelledApp, status: 'Cancelled' }]);
    setApproved(approved.filter(a => a.id !== id));
  };

  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main container py-4">
        <h2 className="text-center mb-4">Manage Appointments</h2>

        {/* Tabs */}
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

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'upcoming' && (
            <div className="row">
              {/* Left Column */}
              <div className="col-md-8">
                <h5 className="mb-3">Pending Appointment Requests</h5>
                {pending.map(p => (
                  <div key={p.id} className="card appointment-card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{p.name}</h5>
                      <p className="card-text">{p.date}</p>
                      <p className="status">Status: {p.status}</p>
                      <button className="btn btn-success me-2" onClick={() => handleAccept(p.id)}>Accept</button>
                      <button className="btn btn-danger" onClick={() => handleReject(p.id)}>Reject</button>
                    </div>
                  </div>
                ))}

                <h5 className="mt-4 mb-3">Approved Appointments</h5>
                {approved.map(a => (
                  <div key={a.id} className="card appointment-card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{a.name}</h5>
                      <p className="card-text">{a.date}</p>
                      <p className="status">Status: {a.status}</p>
                      <div className="dropdown mt-2">
                        <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          Actions
                        </button>
                        <ul className="dropdown-menu">
                          <li><button className="dropdown-item" onClick={() => markCompleted(a.id)}>Mark as Completed</button></li>
                          <li><button className="dropdown-item" onClick={() => markCancelled(a.id)}>Cancel Appointment</button></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Calendar */}
              <div className="col-md-4">
                <aside className="calendar-section grid-calendar">
                  <CalendarC />
                </aside>
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="tab-pane fade show active">
              <h5 className="mb-3">Completed Appointments</h5>
              {completed.map(c => (
                <div key={c.id} className="card appointment-card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">{c.name}</h5>
                    <p className="card-text">{c.date}</p>
                    <p className="status">Status: {c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'cancelled' && (
            <div className="tab-pane fade show active">
              <h5 className="mb-3">Cancelled/Rejected Appointments</h5>
              {cancelled.map(c => (
                <div key={c.id} className="card appointment-card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">{c.name}</h5>
                    <p className="card-text">{c.date}</p>
                    <p className="status">Status: {c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
