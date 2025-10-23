import React, { useState, useEffect } from 'react';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import CalendarC from '../../Calendar/CalendarC.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function ManageApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [pending, setPending] = useState([]);
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
  const storedDoctorId = localStorage.getItem('doctorId');
  if (storedDoctorId) {
    setDoctorId(storedDoctorId);
  }
}, []);

useEffect(() => {
  if (doctorId) {
    refreshAppointments();
  }
}, [doctorId]);


const refreshAppointments = () => {
  fetch(`/api/appointments?doctorId=${doctorId}`)
    .then(res => res.json())
    .then(data => {
      setPending(data.filter(a => a.status === 'Pending'));
      setApproved(data.filter(a => a.status === 'Accepted'));
      setCompleted(data.filter(a => a.status === 'Completed'));
      setCancelled(data.filter(a => a.status === 'Rejected' || a.status === 'Cancelled'));
    });
};


  const [approved, setApproved] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [cancelled, setCancelled] = useState([]);

  const handleAccept = async (id) => {
  await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Accepted' })
  });
  refreshAppointments();
};

const handleReject = async (id) => {
  await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Rejected' })
  });
  refreshAppointments();
};


  const markCompleted = async (id) => {
  await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Completed' })
  });
  refreshAppointments();
};

const markCancelled = async (id) => {
  await fetch(`/api/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Cancelled' })
  });
  refreshAppointments();
};


  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main container py-4">
        <h2 className="text-center mb-4">Manage Appointments</h2>

        
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
