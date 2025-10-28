import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import CalendarC from '../../Calendar/CalendarC.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function ManageApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // all / pending / approved / completed / cancelled

  // derive filtered list
  const filtered = useMemo(() => {
    if (filter === 'all') return appointments;
    return appointments.filter(a => (a.status || '').toLowerCase() === filter); // ManageApp Filter Case Sensitive
  }, [appointments, filter]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
        if (!email) { setError('Missing doctor email in localStorage. Please login again.'); setLoading(false); return; }

        const prof = await axios.post('http://localhost:3001/doctor/get-profile', { email });
        const d = prof.data?.doctor;
        if (!d) { setError('Doctor profile not found'); setLoading(false); return; }
        if (cancelled) return;
        setDoctor(d);

        const url = `http://localhost:3001/api/doctor/${d._id}/appointments/active`;
        const list = await axios.get(url);
        if (cancelled) return;
        setAppointments(list.data?.appointments || []);
      } catch (e) {
        if (!cancelled) setError('Failed to load appointments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const updateAppt = async (id, payload) => {
    const prev = [...appointments];
    try {
      // optimistic update
      setAppointments(appts => appts.map(a => a._id === id ? { ...a, ...payload } : a));
      const res = await axios.patch(`http://localhost:3001/api/appointments/${id}`, payload);
      const updated = res.data?.appointment;
      if (updated.status === 'completed' || updated.status === 'cancelled') {
        // remove from active list correctly
        setAppointments(appts => appts.filter(a => a._id === id !== id));
      } else {
        setAppointments(appts => appts.map(a => a._id === id ? updated : a));
      }
    } catch (e) {
      setAppointments(prev);
      setError('Update failed');
    }
  };

  const onApprove = (id) => updateAppt(id, { status: 'approved' });
  const onComplete = (id) => updateAppt(id, { status: 'completed' });
  const onCancel = (id) => updateAppt(id, { status: 'cancelled' });

  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main">
        <div className="dashboard-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Manage Appointments</h1>
            <div>
              <label style={{ marginRight: 8 }}>Filter:</label>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 16 }}>No appointments to show.</div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Date/Time</th>
                    <th style={{ textAlign: 'left' }}>Patient</th>
                    <th style={{ textAlign: 'left' }}>Contact</th>
                    <th style={{ textAlign: 'left' }}>Notes</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(appt => {
                    const p = appt.patient || {};
                    const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || '—';
                    const when = new Date(appt.date);
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
                          <input
                            type="text"
                            value={appt.notes || ''}
                            onChange={(e) => setAppointments(appts => appts.map(a => a._id === appt._id ? { ...a, notes: e.target.value } : a))}
                            onBlur={(e) => updateAppt(appt._id, { notes: e.target.value })}
                            placeholder="Add note..."
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{appt.status}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary" disabled={appt.status !== 'pending'} onClick={() => onApprove(appt._id)}>Approve</button>
                          <button className="btn btn-primary" style={{ marginLeft: 8 }} disabled={appt.status === 'completed' || appt.status === 'cancelled'} onClick={() => onComplete(appt._id)}>Complete</button>
                          <button className="btn btn-danger" style={{ marginLeft: 8 }} disabled={appt.status === 'completed' || appt.status === 'cancelled'} onClick={() => onCancel(appt._id)}>Cancel</button>
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
