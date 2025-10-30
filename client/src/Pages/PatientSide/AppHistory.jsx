import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PNavbar from '../../SideBar/PNavbar'
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../Styles/AppHistory.css'

export default function AppHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId') || null;
    const email = localStorage.getItem('email') || null;
    if (!patientId && !email) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(buildUrl());
        const data = await res.json();
        if (data && data.appointments) setAppointments(data.appointments);
        else setAppointments([]);
      } catch (err) {
        console.error('Failed to load appointments', err);
        setAppointments([]);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const completed = appointments.filter(a => a.status === 'completed');
  const rejected = appointments.filter(a => a.status === 'rejected');

  const renderEntry = (appt) => (
    <div key={appt._id} className="mb-4">
      <h6 className="fw-semibold">Doctor: {appt.doctor}</h6>
      <p>Date: {appt.date}</p>
      <p>Time: {appt.time}</p>
      <p className="text-muted fw-bold">Status: {appt.status}</p>
      <hr />
    </div>
  );

  return (
    <div className={`dashboard patient-history ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <h2 className="mb-4">Appointment History</h2>

            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                >
                  Completed
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setActiveTab('rejected')}
                >
                  Cancelled/Rejected
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {activeTab === 'completed' && (
                <>
                  {completed.map(renderEntry)}
                </>
              )}

              {activeTab === 'rejected' && (
                <>
                  {rejected.map(renderEntry)}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
