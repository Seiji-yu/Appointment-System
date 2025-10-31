// Navbar Doctor
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/DNavbar.css';
import { RiExpandUpDownFill } from "react-icons/ri";
import { SidebarData } from './Sidebar.jsx';

export default function Navbar(props) {

  const [internalOpen, setInternalOpen] = useState(true);
  const isControlled = ('isOpen' in (props || {})) && typeof props.onToggle === 'function';
  const open = isControlled ? props.isOpen : internalOpen;
  const location = useLocation();
  const isDoctorDashboard = location.pathname === '/dashboard';
  const navigate = useNavigate();

  // notifications state (new booking)
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [openDrop, setOpenDrop] = useState(false);
  const [tab, setTab] = useState('visible'); // 'visible' | 'hidden'

  // sound
  const [audioCtx, setAudioCtx] = useState(null);
  const initAudio = async () => {
    if (audioCtx) return audioCtx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      if (ctx.state === 'suspended') await ctx.resume();
      setAudioCtx(ctx);
      return ctx;
    } catch { return null; }
  };
  const playChime = async () => {
    try {
      const ctx = await initAudio();
      if (!ctx) return;
      if (ctx.state === 'suspended') await ctx.resume();
      const t0 = ctx.currentTime + 0.01;
      const master = ctx.createGain();
      master.gain.value = 0.6; master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2200; filter.Q.value = 0.7; filter.connect(master);
      const ping = (start, base, dur, level = 1) => {
        const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator(); const g = ctx.createGain();
        o1.type='sine'; o2.type='sine'; o2.detune.value=8;
        o1.frequency.setValueAtTime(base, start); o1.frequency.exponentialRampToValueAtTime(base*1.06, start+dur*0.6);
        o2.frequency.setValueAtTime(base, start); o2.frequency.exponentialRampToValueAtTime(base*1.06, start+dur*0.6);
        g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(0.4*level, start+0.01); g.gain.exponentialRampToValueAtTime(0.0001, start+dur);
        o1.connect(g); o2.connect(g); g.connect(filter);
        o1.start(start); o2.start(start); o1.stop(start+dur+0.02); o2.stop(start+dur+0.02);
      };
      ping(t0, 740, 0.12, 0.9); ping(t0+0.06, 1240, 0.18);
      setTimeout(() => { try { filter.disconnect(); master.disconnect(); } catch {} }, 400);
    } catch {}
  };

  // Subscribe to SSE for new appointments (booked by patient)
  useEffect(() => {
    let es;
    let doctorId = null;
    const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
    if (!email) return;
    const start = async () => {
      try {
        // get doctor id
        const prof = await fetch('http://localhost:3001/doctor/get-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const data = await prof.json();
        doctorId = data?.doctor?._id || null;
        // load persisted notifications (visible by default)
        await loadNotifs('visible', doctorId);

        es = new EventSource('http://localhost:3001/api/appointments/stream');
        const onBooked = async (e) => {
          try {
            const payload = JSON.parse(e.data || '{}');
            if (!payload?.doctorId || !doctorId || String(payload.doctorId) !== String(doctorId)) return;
            // add to notifications
            const id = payload.notifId || payload.apptId || Math.random().toString(36).slice(2);
            setNotifs((prev) => {
              const exists = prev.some(p => p.id === id);
              const next = [{
                id,
                text: `New appointment from ${payload.patient?.name || payload.patient?.email || 'a patient'}`,
                at: new Date(payload.date || Date.now()).toLocaleString(),
                apptId: payload.apptId,
                read: false
              }, ...prev];
              return exists ? prev : next.slice(0, 50);
            });
            setUnread((n) => n + 1);
            await playChime();
          } catch {}
        };
        es.addEventListener('appointment_booked', onBooked);
        es.onerror = () => {};
        es.onopen = () => {};
      } catch {}
    };
    start();
    return () => { try { es && es.close(); } catch {} };
  }, []);

  const loadNotifs = async (view, doctorIdParam) => {
    try {
      const id = doctorIdParam || (await (async () => {
        const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
        const prof = await fetch('http://localhost:3001/doctor/get-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const data = await prof.json();
        return data?.doctor?._id;
      })());
      if (!id) return;
      const res = await fetch(`http://localhost:3001/api/notifications?userType=doctor&userId=${id}&limit=50&view=${view}`);
      const j = await res.json();
      if (Array.isArray(j?.notifications)) {
        const items = j.notifications.map(n => ({ id: n._id, text: n.text, at: new Date(n.createdAt || Date.now()).toLocaleString(), apptId: n.apptId, read: !!n.read }));
        setNotifs(items);
        setUnread(view === 'hidden' ? 0 : items.filter(i => !i.read).length);
      }
    } catch {}
  };

  const patchNotif = async (id, updates) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    } catch {}
  };
  const deleteNotif = async (id) => {
    try { await fetch(`http://localhost:3001/api/notifications/${id}`, { method: 'DELETE' }); } catch {}
  };
  const markAllRead = async () => {
    try {
      const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
      const prof = await fetch('http://localhost:3001/doctor/get-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await prof.json(); const doctorId = data?.doctor?._id;
      if (!doctorId) return;
      await fetch('http://localhost:3001/api/notifications/mark-all-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userType: 'doctor', userId: doctorId }) });
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const toggle = () => {
    if (isControlled) {
      props.onToggle(!open);
    } else {
      setInternalOpen(!open);
    }
  };

  // Shift only the top navbar when sidebar is open (avoid double-shift of page content)
  useEffect(() => {
    if (open) document.body.classList.add('doctor-topbar-open');
    else document.body.classList.remove('doctor-topbar-open');
    return () => document.body.classList.remove('doctor-topbar-open');
  }, [open]);

  // Doctor pages manage layout shift via their own container classes, not body padding

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="top-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaIcons.FaBars className="menu-icon" onClick={toggle} />
          {isDoctorDashboard && <h2 style={{ margin: 20 }}>Dashboard</h2>}
        </div>
        <div className="nav-icons">
          <div className="nav-bell" onClick={() => { setOpenDrop((o)=>!o); setUnread(0); }} title="Notifications" role="button" aria-label="Notifications">
            <IoIcons.IoMdNotificationsOutline size={24} />
            {unread > 0 && <span className="nav-badge" aria-label={`${unread} unread`}>{unread > 9 ? '9+' : unread}</span>}
          </div>
          {openDrop && (
            <div className="notif-dropdown" onMouseLeave={() => setOpenDrop(false)}>
              <div className="notif-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-link" onClick={async () => { setTab('visible'); await loadNotifs('visible'); }}>Visible</button>
                  <button className="btn btn-sm btn-link" onClick={async () => { setTab('hidden'); await loadNotifs('hidden'); }}>Hidden</button>
                </div>
                {tab === 'visible' && <button className="btn btn-sm btn-link" onClick={markAllRead}>Mark all read</button>}
              </div>
              {notifs.length === 0 ? (
                <div className="notif-empty">No notifications yet.</div>
              ) : (
                <ul className="notif-list">
                  {notifs.map(n => (
                    <li key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      <div className="notif-text" onClick={async () => { if (!n.read) { setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); setUnread(u => Math.max(0, u - 1)); await patchNotif(n.id, { read: true }); } setOpenDrop(false); navigate('/Appointments'); }}>{n.text}</div>
                      <div className="notif-time">{n.at}</div>
                      <div className="notif-actions">
                        <button className="link-btn" title={n.read ? 'Mark as unread' : 'Mark as read'} onClick={async () => { setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: !n.read } : x)); setUnread(u => n.read ? u + 1 : Math.max(0, u - 1)); await patchNotif(n.id, { read: !n.read }); }}>
                          {n.read ? <FaIcons.FaEnvelopeOpen /> : <FaIcons.FaEnvelope />}
                        </button>
                        {tab === 'visible' ? (
                          <button className="link-btn" title="Hide" onClick={async () => { setNotifs(prev => prev.filter(x => x.id !== n.id)); if (!n.read) setUnread(u => Math.max(0, u - 1)); await patchNotif(n.id, { hidden: true }); }}>
                            <FaIcons.FaEyeSlash />
                          </button>
                        ) : (
                          <button className="link-btn" title="Restore" onClick={async () => { setNotifs(prev => prev.filter(x => x.id !== n.id)); await patchNotif(n.id, { hidden: false }); }}>
                            <FaIcons.FaEye />
                          </button>
                        )}
                        <button className="link-btn" title="Delete" onClick={async () => { setNotifs(prev => prev.filter(x => x.id !== n.id)); if (!n.read) setUnread(u => Math.max(0, u - 1)); await deleteNotif(n.id); }}>
                          <FaIcons.FaTrashAlt />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className={`sidebar ${open ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h3>Doctor Menu</h3>
          <IoIcons.IoMdClose onClick={toggle} />
        </div>
        <ul className="sidebar-list">
          {SidebarData
            .filter(i => !['About', 'Logout', 'Settings', 'Account Profile'].includes(i.title))
            .map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                  <Link to={item.path} title={item.title} aria-label={item.title} className={isActive ? 'active' : ''} onClick={() => !open && toggle()}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
        </ul>

        {/* Bottom user settings card */}
        <div className="sidebar-bottom">
          <Link
            to="/DSettings"
            className="doctor-user-card"
            title="User settings"
            onClick={() => !open && toggle()}
          >
            <div className="doctor-user-avatar" aria-hidden>
              <FaIcons.FaUser />
            </div>
            <div className="doctor-user-meta">
              <div className="doctor-user-name">
                {localStorage.getItem('name') || 'Your Account'}
              </div>
              <div className="doctor-user-email">
                {localStorage.getItem('doctorEmail') || localStorage.getItem('email') || ''}
              </div>
            </div>
            <div className="doctor-user-cta">
              <RiExpandUpDownFill />
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}