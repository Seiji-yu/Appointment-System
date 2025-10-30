import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import CalendarC from '../../Calendar/CalendarC.jsx';
import '../../Styles/Ddashboard.css';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function Ddashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // doctor-scoped metrics
  const [totalPatients, setTotalPatients] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  // cancelled metric for charts
  const [cancelledCount, setCancelledCount] = useState(0);

  const [recentPatients, setRecentPatients] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState('');

  // trend data for last 14 days
  const [trend, setTrend] = useState([]);

  // selected date and appointment logs for per-day agenda
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [apptLogs, setApptLogs] = useState([]);

  const [activeAppts, setActiveAppts] = useState([])

  // helpers
  const toYMD = (d) => {
    const _d = new Date(d);
    const y = _d.getFullYear();
    const m = String(_d.getMonth() + 1).padStart(2, '0');
    const day = String(_d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError('');
        setRecentLoading(true);

        // Resolve current doctor by email from localStorage
        const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
        if (!email) {
          setError('Missing doctor email. Please login again.');
          setRecentLoading(false);
          return;
        }

        // Get doctor profile -> id
        const prof = await axios.post('http://localhost:3001/doctor/get-profile', { email });
        const doctor = prof.data?.doctor;
        if (!doctor?._id) {
          setError('Doctor profile not found.');
          setRecentLoading(false);
          return;
        }
        const doctorId = doctor._id;

        // Fetch doctor-scoped metrics, recent patients, and logs for charts
        const [countRes, statsRes, recentRes, logsRes, activeRes] = await Promise.all([
          axios.get(`http://localhost:3001/api/doctor/${doctorId}/patients/count`),
          axios.get(`http://localhost:3001/api/doctor/${doctorId}/stats`),
          axios.get('http://localhost:3001/api/patients/recent', { params: { doctorId, limit: 6 } }),
          axios.get(`http://localhost:3001/api/doctor/${doctorId}/appointments/logs`),
          axios.get(`http://localhost:3001/api/doctor/${doctorId}/appointments/active`),
        ]);

        if (cancelled) return;

        // Unique patients seen by this doctor (any status)
        setTotalPatients(countRes.data?.count || 0);

        // Appointments stats scoped to this doctor
        setUpcomingCount(statsRes.data?.upcoming || 0);
        setPendingCount(statsRes.data?.pending || 0);
        setCompletedCount(statsRes.data?.completed || 0);

        // Recent patients from completed appointments
        if (recentRes.data?.status === 'success' && Array.isArray(recentRes.data.patients)) {
          const mapped = recentRes.data.patients.map(p => ({
            id: p.patientId,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Patient',
            email: p.email || ''
          }));
          setRecentPatients(mapped);
        } else {
          setRecentPatients([]);
        }

        // Logs for charts (completed + cancelled)
        const logs = Array.isArray(logsRes.data?.appointments) ? logsRes.data.appointments : [];
        const cancelledOnly = logs.filter(a => (a.status || '').toLowerCase() === 'cancelled');
        setCancelledCount(cancelledOnly.length);
        // keep logs for agenda
        setApptLogs(logs);

        // Active appointments (pending/approved) for schedule under calendar
        const active = Array.isArray(activeRes.data?.appointments) ? activeRes.data.appointments : [];
        setActiveAppts(active);

        // Build 14-day trend: counts per date for completed and cancelled
        const days = [];
        const map = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = toYMD(d);
          days.push(key);
          map[key] = { date: key, completed: 0, cancelled: 0 };
        }
        for (const a of logs) {
          const key = toYMD(a.date || a.createdAt || Date.now());
          if (map[key]) {
            const s = (a.status || '').toLowerCase();
            if (s === 'completed') map[key].completed++;
            if (s === 'cancelled') map[key].cancelled++;
          }
        }
        setTrend(days.map(d => map[d]));
      } catch (e) {
        setError('Failed to load dashboard data.');
        setRecentPatients([]);
        setTotalPatients(0);
        setUpcomingCount(0);
        setPendingCount(0);
        setCompletedCount(0);
        setCancelledCount(0);
        setTrend([]);
        setApptLogs([]);
        setActiveAppts([]);
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Pie data (Recharts expects an array, not labels/datasets)
  const pieData = useMemo(() => ([
    { name: 'Pending', value: Number(pendingCount) || 0 },
    { name: 'Approved', value: Number(upcomingCount) || 0 },
    { name: 'Completed', value: Number(completedCount) || 0 },
    { name: 'Cancelled', value: Number(cancelledCount) || 0 },
  ]), [pendingCount, upcomingCount, completedCount, cancelledCount]);

  const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

  // Format date tick as M/D
  const shortMD = (ymd) => {
    try {
      const [y, m, d] = ymd.split('-').map(Number);
      return `${m}/${d}`;
    } catch { return ymd; }
  };

  // Helpers for agenda display
  const prettyLongDate = (ymd) => {
    try {
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return ymd; }
  };

  const extractStart = (a) => {
    // Try several common shapes
    return (
      a.startTime ||
      a.timeStart ||
      a.start ||
      a.slotStart ||
      a.time ||
      a.date ||
      a.createdAt
    );
  };

  const extractEnd = (a) => a.endTime || a.timeEnd || a.end || a.slotEnd || null;

  const fmtTime = (v) => {
    if (!v) return null;
    const dt = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)
      ? new Date(v)
      : new Date(v);
    if (isNaN(dt)) return null;
    return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatRange = (a) => {
    const s = fmtTime(extractStart(a));
    const e = fmtTime(extractEnd(a));
    if (s && e) return `${s} - ${e}`;
    if (s) return s;
    return 'All day';
  };

  const todayYMD = toYMD(new Date());
  const nowMs = Date.now();

  const upcomingActive = useMemo(() => {
    const items = Array.isArray(activeAppts) ? activeAppts : [];
    return items.filter(a => {
      const start = extractStart(a);
      const dt = new Date(start);
      if (isNaN(dt)) return false;
      const ymd = toYMD(dt);
      // exclude past dates
      if (ymd < todayYMD) return false;
      // for today, exclude past times
      if (ymd === todayYMD && dt.getTime() < nowMs) return false;
      return true;
    });
  }, [activeAppts]);

  const selectedUpcoming = useMemo(() => {
    const withStartMs = (a) => {
      const s = extractStart(a);
      const t = new Date(s).getTime();
      return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    };
    return upcomingActive
      .filter(a => toYMD(extractStart(a)) === selectedDate || toYMD(a.date || a.createdAt) === selectedDate)
      .sort((a, b) => withStartMs(a) - withStartMs(b));
  }, [upcomingActive, selectedDate]);

  const otherUpcomingGroups = useMemo(() => {
    const map = new Map();
    for (const a of upcomingActive) {
      const ymd = toYMD(a.date || extractStart(a));
      if (ymd === selectedDate) continue;
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(a);
    }
    // sort each group by time
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const ta = new Date(extractStart(a)).getTime();
        const tb = new Date(extractStart(b)).getTime();
        return ta - tb;
      });
    }
    // return sorted by date ascending
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, items]) => ({ date, items }));
  }, [upcomingActive, selectedDate]);

  // Agenda for the selected day
  const agenda = useMemo(() => {
    const sameDay = (a) => toYMD(a.date || a.startTime || a.timeStart || a.createdAt) === selectedDate;
    const withStartMs = (a) => {
      const s = extractStart(a);
      const t = new Date(s).getTime();
      return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    };
    return (apptLogs || [])
      .filter(sameDay)
      .sort((a, b) => withStartMs(a) - withStartMs(b));
  }, [apptLogs, selectedDate]);

  return (
    <>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <main className="dashboard-main">
          {/* Search Bar */}
          <div className="search-bar">
            <input type="text" placeholder="Search doctor, patient, or appointment..." />
          </div>

          {error && <div className="card" style={{ padding: 12, color: 'red', marginBottom: 12 }}>{error}</div>}

          <div className="dashboard-grid">
            {/* Cards */}
            <section className="cards-section grid-cards">
              <div className="dashboard-cards">
                <div className="card"><h4>Total Patients Handled</h4><p>{totalPatients}</p></div>
                <div className="card"><h4>Pending Approvals</h4><p>{pendingCount}</p></div>
                <div className="card"><h4>Approved Appointments</h4><p>{upcomingCount}</p></div>
                <div className="card"><h4>Completed Appointments</h4><p>{completedCount}</p></div>
              </div>
            </section>

            {/*Charts row */}
            <section className="charts-section grid-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 12, minHeight: 320 }}>
                <h3 style={{ margin: '4px 0 8px' }}>Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: 12, minHeight: 320 }}>
                <h3 style={{ margin: '4px 0 8px' }}>Last 14 Days</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={shortMD} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => `Date: ${v}`} />
                    <Legend />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <aside className="calendar-section grid-calendar">
              {/* Bind to selectedDate using CalendarC's props */}
              <CalendarC
                value={new Date(selectedDate)}
                onChange={(d) => {
                  if (!d) return;
                  const dt = d instanceof Date ? d : new Date(d);
                  setSelectedDate(toYMD(dt));
                }}
              />
              {/*  Upcoming-only schedule */}
              <div className="card" style={{ marginTop: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ margin: 0 }}>Schedule</h4>
                  <span className="section-subtitle">{prettyLongDate(selectedDate)}</span>
                </div>

                <div style={{ marginTop: 8 }}>
                  <h5 style={{ margin: '8px 0' }}>Selected Date</h5>
                  {selectedUpcoming.length === 0 ? (
                    <div style={{ color: '#000000ff' }}>No upcoming appointments for this day.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {selectedUpcoming.map((a, i) => {
                        const label = a.title || a.reason || a.purpose || 'Appointment';
                        const who = a.patient?.name || `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim() || a.patient?.email || '';
                        const status = (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1);
                        return (
                          <li key={a._id || i} style={{ padding: '8px 0', borderBottom: '1px solid #eef2f7' }}>
                            <div style={{ fontWeight: 600 }}>{formatRange(a)} - {label}{who ? ` (${who})` : ''}</div>
                            <div style={{ fontSize: 12, color: '#8b646aff' }}>{status}</div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <h5 style={{ margin: '8px 0' }}>Other Upcoming Dates</h5>
                  {otherUpcomingGroups.length === 0 ? (
                    <div style={{ color: '#000000ff' }}>No other upcoming appointments.</div>
                  ) : (
                    otherUpcomingGroups.map(group => (
                      <div key={group.date}
                        style={{ marginBottom: 12 }}>
                        <div style={{
                          fontWeight: 600,
                          marginBottom: 4
                        }}>
                          {prettyLongDate(group.date)}</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {group.items.map((a, i) => {
                            const label = a.title || a.reason || a.purpose || 'Appointment';
                            const who = a.patient?.name || `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim() || a.patient?.email || '';
                            const status = (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1);
                            return (
                              <li key={(a._id || '') + i} style={{ padding: '6px 0', borderBottom: '1px dashed #eef2f7' }}>
                                <div>{formatRange(a)} - {label}{who ? ` (${who})` : ''}</div>
                                <div style={{
                                  fontSize: 12,
                                  color: '#000000ff'
                                }}
                                >{status}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <section className="recent-patients-section grid-recent">
              <div className="section-header">
                <h3>Previous Patients</h3>
                <span className="section-subtitle">Recent consultations</span>
              </div>

              {recentLoading ? (
                <div className="card" style={{ padding: 16 }}>Loading...</div>
              ) : recentPatients.length === 0 ? (
                <div className="card" style={{ padding: 16 }}>No previous patients yet.</div>
              ) : (
                <div className="patient-grid">
                  {recentPatients.map((p) => (
                    <div key={p.id} className="patient-card">
                      <div className="avatar-skeleton" />
                      <div className="patient-meta">
                        <h5 className="patient-name">{p.name}</h5>
                        <div className="patient-actions">
                          <button className="btn btn-secondary" onClick={() => alert('History (placeholder)')}>History</button>
                          <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/Doctor/Patient/${encodeURIComponent(p.email)}`)}
                            disabled={!p.email}
                          >
                            Patient Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
