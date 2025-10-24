import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';

export default function DoctorLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
      if (!email) {
        setError('Missing doctor email. Please login again.');
        setLoading(false);
        return;
      }

      const prof = await axios.post('http://localhost:3001/doctor/get-profile', { email });
      const d = prof.data?.doctor;
      if (!d?._id) {
        setError('Doctor profile not found.');
        setLoading(false);
        return;
      }

      const res = await axios.get(`http://localhost:3001/api/doctor/${d._id}/appointments/logs`);
      setLogs(Array.isArray(res.data?.appointments) ? res.data.appointments : []);
    } catch (e) {
      setError('Failed to load booking logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main">
        <div className="dashboard-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>Booking Logs</h1>
            <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : logs.length === 0 ? (
            <div className="card" style={{ padding: 16 }}>No completed or cancelled appointments yet.</div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Date/Time</th>
                    <th style={{ textAlign: 'left' }}>Patient</th>
                    <th style={{ textAlign: 'left' }}>Contact</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'left' }}>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(appt => {
                    const p = appt.patient || {};
                    const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || '—';
                    const when = new Date(appt.date);
                    const status = (appt.status || '').toLowerCase();
                    const statusColor = status === 'completed' ? '#16a34a' : '#ef4444';
                    return (
                      <tr key={appt._id} style={{ borderTop: '1px solid #eee' }}>
                        <td>{when.toLocaleString()}</td>
                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src={p.profileImage || 'https://via.placeholder.com/32'} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                          <div>
                            <div>{name}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{p.email}</div>
                          </div>
                        </td>
                        <td>{p.contact || '—'}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: 12, background: '#f3f4f6', color: statusColor, textTransform: 'capitalize' }}>
                            {status}
                          </span>
                        </td>
                        <td>{appt.notes || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <a
                            className="btn btn-primary"
                            href={p.email ? `/Doctor/Patient/${encodeURIComponent(p.email)}` : '#'}
                            onClick={(e) => { if (!p.email) e.preventDefault(); }}
                          >
                            Patient Details
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}