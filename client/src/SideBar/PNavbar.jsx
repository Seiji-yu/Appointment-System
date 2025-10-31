import React, { useEffect, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PSidebar } from './PSidebar';
import '../Styles/PNavbar.css';
import { RiExpandUpDownFill } from "react-icons/ri";

export default function PNavbar(props) {
  const [internalOpen, setInternalOpen] = useState(true);
  const open = props?.isOpen ?? internalOpen;
  const location = useLocation();
  const navigate = useNavigate();
  const isPatientDashboard = location.pathname === '/PatientDashboard';
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [openDrop, setOpenDrop] = useState(false);
  const [tab, setTab] = useState('visible'); // 'visible' | 'hidden'
  const [profilePic, setProfilePic] = useState(null);

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
    // respect settings from localStorage
    const muted = (localStorage.getItem('notifMuted') ?? 'off') === 'on';
    const soundOn = (localStorage.getItem('notifSound') ?? 'on') === 'on';
    if (muted || !soundOn) return;
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
        o1.type = 'sine'; o2.type = 'sine'; o2.detune.value = 8;
        o1.frequency.setValueAtTime(base, start); o1.frequency.exponentialRampToValueAtTime(base * 1.06, start + dur * 0.6);
        o2.frequency.setValueAtTime(base, start); o2.frequency.exponentialRampToValueAtTime(base * 1.06, start + dur * 0.6);
        g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(0.4 * level, start + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o1.connect(g); o2.connect(g); g.connect(filter);
        o1.start(start); o2.start(start); o1.stop(start + dur + 0.02); o2.stop(start + dur + 0.02);
      };
      ping(t0, 740, 0.12, 0.9); ping(t0 + 0.06, 1240, 0.18);
      setTimeout(() => { try { filter.disconnect(); master.disconnect(); } catch { } }, 400);
    } catch { }
  };

  // Subscribe to SSE for appointment status updates (targeted to this patient) and load persisted notifications
  useEffect(() => {
  let es;
  
  const setupNotifications = async () => {
    const patientEmail = localStorage.getItem('email');
    const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId');
    if (!patientEmail && !patientId) return;
    
    try {
      // fetch patient profile to display avatar in sidebar bottom card
      try {
        if (patientEmail) {
          const res = await fetch('http://localhost:3001/patient/get-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: patientEmail })
          });
          const data = await res.json();
          const pic = data?.patient?.profileImage || data?.patient?.profilePicture || null;
          if (pic) setProfilePic(pic);
        }
      } catch {}

      // load persisted notifications
      await loadNotifs('visible', patientId, patientEmail);

      es = new EventSource('http://localhost:3001/api/appointments/stream');
      const onStatus = async (e) => {
        try {
          const payload = JSON.parse(e.data || '{}');
          // match by email or patientId
          if (patientEmail && payload?.patientEmail) {
            if (String(payload.patientEmail).toLowerCase() !== String(patientEmail).toLowerCase()) return;
          } else if (patientId && payload?.patientId) {
            if (String(payload.patientId) !== String(patientId)) return;
          } else { return; }
          const status = String(payload.status || '').toLowerCase();
          let text = '';
          if (status === 'approved') text = `Doctor ${payload.doctorName || ''} approved your appointment`;
          else if (status === 'cancelled') text = `Doctor ${payload.doctorName || ''} declined your appointment`;
          else if (status === 'pending') text = `Your appointment is pending`;
          else if (status === 'completed') text = `Your appointment was completed`;
          else text = `Appointment update: ${payload.status}`;
          const id = payload.notifId || payload.apptId || Math.random().toString(36).slice(2);
          setNotifs(prev => {
            if (prev.some(p => p.id === id)) return prev;
            return [{ id, text, at: new Date(payload.at || Date.now()).toLocaleString(), apptId: payload.apptId, read: false }, ...prev].slice(0, 50);
          });
          setUnread(n => n + 1);
          await playChime();
        } catch { }
      };
      es.addEventListener('appointment_status', onStatus);
      es.onerror = () => { };
      es.onopen = () => { };
    } catch { }
  };

  setupNotifications();

  return () => { 
    try { es && es.close(); } catch { } 
  };
}, []);

  // try to unlock audio on first user interaction
  useEffect(() => {
    const unlock = async () => { try { const ctx = await initAudio(); await ctx?.resume(); } catch {} };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => { try { window.removeEventListener('pointerdown', unlock); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifs = async (view, idParam, emailParam) => {
    try {
      const id = idParam || localStorage.getItem('patientId') || localStorage.getItem('userId');
      const email = emailParam || localStorage.getItem('email');
      let url = `http://localhost:3001/api/notifications?userType=patient&view=${view}`;
      if (id) url += `&userId=${encodeURIComponent(id)}`; else if (email) url += `&email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      const j = await res.json();
      if (Array.isArray(j?.notifications)) {
        const items = j.notifications.map(n => ({ id: n._id, text: n.text, at: new Date(n.createdAt || Date.now()).toLocaleString(), apptId: n.apptId, read: !!n.read }));
        setNotifs(items);
        setUnread(view === 'hidden' ? 0 : items.filter(i => !i.read).length);
      }
    } catch {}
  };

  const patchNotif = async (id, updates) => {
    try { await fetch(`http://localhost:3001/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); } catch { }
  };
  const deleteNotif = async (id) => { try { await fetch(`http://localhost:3001/api/notifications/${id}`, { method: 'DELETE' }); } catch { } };
  const markAllRead = async () => {
    try {
      const patientEmail = localStorage.getItem('email');
      const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId');
      await fetch('http://localhost:3001/api/notifications/mark-all-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userType: 'patient', userId: patientId, email: patientEmail }) });
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { }
  };

  const toggle = () => {
    if (typeof props?.onToggle === 'function') {
      props.onToggle(!open);
    } else {
      setInternalOpen(!open);
    }
  };

  useEffect(() => {
    document.body.classList.toggle('with-sidebar-open', open);
    document.body.classList.toggle('with-sidebar-collapsed', !open);
    return () => {
      document.body.classList.remove('with-sidebar-open');
      document.body.classList.remove('with-sidebar-collapsed');
    };
  }, [open]);

  return (
    <>
      {/* Top Navbar */}
      <div className="top-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaIcons.FaBars className="menu-icon" onClick={toggle} />
          {isPatientDashboard && <h2 style={{ margin: 20 }}>Patient Dashboard</h2>}
        </div>
        <div className="nav-icons">
          <div className="nav-bell" onClick={() => { setOpenDrop(o => !o); setUnread(0); }} title="Notifications" role="button" aria-label="Notifications">
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
                      <div className="notif-text" onClick={async () => { if (!n.read) { setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); setUnread(u => Math.max(0, u - 1)); await patchNotif(n.id, { read: true }); } if (n.apptId) navigate(`/PatientAppDetails?id=${n.apptId}`); setOpenDrop(false); }}>{n.text}</div>
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

      {/* Sidebar */}
      <nav className={`patient-sidebar ${open ? '' : 'collapsed'}`}>
        <div className="patient-sidebar-header">
          <h3>Patient Menu</h3>
          <IoIcons.IoMdClose onClick={toggle} />
        </div>

        <ul className="patient-sidebar-list">
          {PSidebar
            .filter((i) => !['About', 'Logout', 'Settings', 'Account Profile', 'My Profile'].includes(i.title))
            .map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index} className={`patient-sidebar-item ${isActive ? 'active' : ''}`}>
                  <Link to={item.path} title={item.title} aria-label={item.title} className={isActive ? 'active' : ''}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
        </ul>

        {/* Bottom user card -> routes to Settings */}
        <div className="patient-sidebar-bottom">
          <Link to="/PSettings" className="patient-user-card" title="User settings">
            <div className="patient-user-avatar" aria-hidden>
              {profilePic ? (
                <img src={profilePic} alt="Profile" />
              ) : (
                <FaIcons.FaUser />
              )}
            </div>
            <div className="patient-user-meta">
              <div className="patient-user-name">{localStorage.getItem('name') || 'Your Account'}</div>
              <div className="patient-user-email">{localStorage.getItem('email') || ''}</div>
            </div>
            <div className="patient-user-cta">
              <RiExpandUpDownFill />
            </div>
          </Link>
        </div>
      </nav>

      <nav className="navbar">
      </nav>
    </>
  );
}
