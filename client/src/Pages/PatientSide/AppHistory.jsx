import React, { useEffect, useMemo, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import PNavbar from '../../SideBar/PNavbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../Styles/AppHistory.css';
import { useNavigate } from 'react-router-dom';

export default function AppHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // upcoming | completed | cancelled
  const [reloadTick, setReloadTick] = useState(0);
  const [compCount, setCompCount] = useState(0);
  const [cancCount, setCancCount] = useState(0);

  const buildBaseParams = () => {
    const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId') || null;
    const email = localStorage.getItem('email') || null;
    if (patientId) return { by: 'id', value: patientId };
    if (email) return { by: 'email', value: email };
    return { by: null, value: null };
  };

  const loadData = async () => {
    const base = 'http://localhost:3001/api/appointments';
    const { by, value } = buildBaseParams();
    if (!by || !value) { setError('Missing patient identity. Please login again.'); setAppointments([]); setLoading(false); return; }

    try {
      setLoading(true);
      setError('');

      let url = base;
      const q = new URLSearchParams();
      if (by === 'id') q.set('patientId', value); else q.set('patientEmail', value);

      // Fetch according to filter (server supports comma-separated statuses for generic fetch via /api/appointments)
      if (filter === 'completed' || filter === 'cancelled') {
        q.set('status', filter);
      } else if (filter === 'upcoming') {
        // We'll fetch approved and filter future client-side
        q.set('status', 'approved');
      }
      url += `?${q.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      let items = Array.isArray(data?.appointments) ? data.appointments : [];
      if (filter === 'upcoming') {
        const now = Date.now();
        items = items.filter(a => new Date(a.date).getTime() > now);
      }
      setAppointments(items);
    } catch (e) {
      setError('Failed to load history.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, reloadTick]);

  // Fetch counts for completed and cancelled separately so counts show regardless of current filter
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const base = 'http://localhost:3001/api/appointments';
        const { by, value } = buildBaseParams();
        if (!by || !value) return;
        const q = new URLSearchParams();
        if (by === 'id') q.set('patientId', value); else q.set('patientEmail', value);
        q.set('status', 'completed,cancelled');
        const res = await fetch(`${base}?${q.toString()}`);
        const data = await res.json();
        const items = Array.isArray(data?.appointments) ? data.appointments : [];
        let c1 = 0, c2 = 0;
        for (const a of items) {
          const s = String(a.status || '').toLowerCase();
          if (s === 'completed') c1++;
          if (s === 'cancelled') c2++;
        }
        setCompCount(c1); setCancCount(c2);
      } catch {}
    };
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTick, filter]);

  // Derived lists and counts
  const filtered = useMemo(() => {
    if (filter === 'all' || filter === 'upcoming') return appointments;
    return appointments.filter(a => (a.status || '').toLowerCase() === filter);
  }, [appointments, filter]);

  const counts = useMemo(() => {
    const c = { completed: 0, cancelled: 0 };
    for (const a of appointments) {
      const s = (a.status || '').toLowerCase();
      if (s === 'completed') c.completed++;
      if (s === 'cancelled') c.cancelled++;
    }
    return c;
  }, [appointments]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this log entry? This cannot be undone.')) return;
    try {
      await fetch(`http://localhost:3001/api/appointments/${id}`, { method: 'DELETE' });
      setAppointments(list => list.filter(a => a._id !== id));
    } catch (e) {
      setError('Failed to delete log');
    }
  };
  const navigate = useNavigate()

  return (
    <div className="apphistory-page">
      <PNavbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1>Appointment History</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="btn-group" role="group" aria-label="Filter by status">
              <button type="button" className={`btn btn-outline-secondary ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Upcoming</button>
              <button type="button" className={`btn btn-outline-secondary ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed ({compCount})</button>
              <button type="button" className={`btn btn-outline-secondary ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>Cancelled ({cancCount})</button>
            </div>
            <button className="btn btn-secondary" onClick={() => setReloadTick(t => t + 1)} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 16 }}>
            {filter === 'upcoming' && 'No upcoming appointments yet.'}
            {filter === 'completed' && 'No completed appointments yet.'}
            {filter === 'cancelled' && 'No cancelled appointments yet.'}
            {filter === 'all' && 'No completed or cancelled appointments yet.'}
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Date/Time</th>
                  <th style={{ textAlign: 'left' }}>Doctor</th>
                  <th style={{ textAlign: 'left' }}>Contact</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                  <th style={{ textAlign: 'left' }}>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(appt => {
                  const d = appt.doctor || {};
                  const name = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || '—';
                  const when = new Date(appt.date);
                  const status = (appt.status || '').toLowerCase();
                  const statusColor = status === 'completed' ? '#16a34a' : (status === 'cancelled' ? '#ef4444' : '#374151');
                  const isLog = status === 'completed' || status === 'cancelled';
                  return (
                    <tr
                      key={appt._id}
                      style={{ borderTop: '1px solid #eee', cursor: 'pointer' }}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate('/PatientAppDetails', { state: { appointmentId: appt._id, appointment: appt } })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/PatientAppDetails', { state: { appointmentId: appt._id, appointment: appt } }) }}
                    >
                      <td>{when.toLocaleString()}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={d.profileImage || 'https://via.placeholder.com/32'} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        <div>
                          <div>{name}</div>
                          <div style={{ fontSize: 12, color: '#aa9af3ff' }}>{d.email}</div>
                        </div>
                      </td>
                      <td>{d.contact || '—'}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 12, background: '#f3f4f6', color: statusColor, textTransform: 'capitalize' }}>
                          {status}
                        </span>
                      </td>
                      <td>{appt.notes || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isLog && (
                          <button className="btn btn-outline-danger" title="Delete log" onClick={(e) => { e.stopPropagation(); onDelete(appt._id); }}>
                            <FaIcons.FaTrashAlt />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
