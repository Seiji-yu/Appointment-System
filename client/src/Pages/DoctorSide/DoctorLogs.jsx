import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';

export default function DoctorLogs() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // status filter
  const [statusFilter, setStatusFilter] = useState('all'); // all | completed | cancelled
  const [patientEmail, setPatientEmail] = useState('');

  // Initialize statusFilter from query (?filter=completed) or state
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const q = (params.get('filter') || '').toLowerCase();
      if (q === 'completed' || q === 'cancelled' || q === 'all') setStatusFilter(q);
      const pe = params.get('patientEmail') || '';
      if (pe) setPatientEmail(pe);
      else if (location.state && typeof location.state.filter === 'string') {
        const s = location.state.filter.toLowerCase();
        if (s === 'completed' || s === 'cancelled' || s === 'all') setStatusFilter(s);
      }
    } catch {}
    // run only on mount and when search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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

  // Derived list based on status filter
  const filteredLogs = useMemo(() => {
    let out = logs;
    if (statusFilter !== 'all') {
      out = out.filter(a => (a.status || '').toLowerCase() === statusFilter);
    }
    if (patientEmail) {
      const pe = String(patientEmail).toLowerCase();
      const getEmail = (a) => (a.patient?.email || a.patientEmail || a.email || '').toLowerCase();
      out = out.filter(a => getEmail(a) === pe);
    }
    return out;
  }, [logs, statusFilter, patientEmail]);

  const counts = useMemo(() => {
    const c = { completed: 0, cancelled: 0 };
    for (const a of logs) {
      const s = (a.status || '').toLowerCase();
      if (s === 'completed') c.completed++;
      if (s === 'cancelled') c.cancelled++;
    }
    return c;
  }, [logs]);

  useEffect(() => {
    const handleTheme = () => setTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('storage', handleTheme);
    window.addEventListener('themeChange', handleTheme);
    return () => {
      window.removeEventListener('storage', handleTheme);
      window.removeEventListener('themeChange', handleTheme);
    };
  }, []);

  return (
    <div className={`doctor-layout ${theme === 'dark' ? 'theme-dark' : ''} ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main">
        <div className="dashboard-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h1>Booking Logs</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Filter buttons */}
              <div className="btn-group" role="group" aria-label="Filter by status">
                <button
                  type="button"
                  className={`btn btn-outline-secondary ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-secondary ${statusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed ({counts.completed})
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-secondary ${statusFilter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled ({counts.cancelled})
                </button>
              </div>

              <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : filteredLogs.length === 0 ? (
            <div className="card" style={{ padding: 16 }}>
              {statusFilter === 'completed' && 'No completed appointments yet.'}
              {statusFilter === 'cancelled' && 'No cancelled appointments yet.'}
              {statusFilter === 'all' && 'No completed or cancelled appointments yet.'}
            </div>
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
                  {filteredLogs.map(appt => {
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
                            <div className="muted-subtext" style={{ fontSize: 12 }}>{p.email}</div>
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