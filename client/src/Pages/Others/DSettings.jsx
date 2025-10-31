import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/PatientProfile.css';

function DSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState('profile'); // profile | settings
  const [sections, setSections] = useState({ appearance: false, password: false, notifications: false });

  // profile state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [preview, setPreview] = useState('');

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });

  // notifications prefs
  const [notifMuted, setNotifMuted] = useState(() => (localStorage.getItem('notifMuted') ?? 'off') === 'on');
  const [notifSound, setNotifSound] = useState(() => (localStorage.getItem('notifSound') ?? 'on') === 'on');

  const doLogout = () => {
    try {
      localStorage.removeItem('email');
      localStorage.removeItem('doctorEmail');
      localStorage.removeItem('name');
    } catch {}
    window.location.href = '/Login';
  };

  useEffect(() => {
    const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
    if (!email) {
      setError('Missing email. Please login again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    axios.post('http://localhost:3001/doctor/get-profile', { email })
      .then(res => {
        const d = res.data?.doctor;
        if (!d) {
          setError('Doctor profile not found.');
          return;
        }
        setDoctor(d);
        setPreview(d.profileImage || d.profilePicture || '');
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', theme);
    // notify app to update theme immediately
    try { window.dispatchEvent(new Event('themeChange')); } catch {}
  }, [theme]);

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwdErr('');
    setPwdMsg('');
    if (!pwdForm.next || pwdForm.next !== pwdForm.confirm) {
      setPwdErr('New password and confirm do not match.');
      return;
    }
    try {
      setPwdBusy(true);
      const email = localStorage.getItem('doctorEmail') || localStorage.getItem('email');
      const res = await fetch('http://localhost:3001/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword: pwdForm.current, newPassword: pwdForm.next })
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json().catch(() => ({}));
      if (data.status === 'success') setPwdMsg('Password updated successfully.');
      else setPwdErr(data.message || 'Unable to change password.');
    } catch (e) {
      setPwdErr('Change-password API not available. Use Forgot Password instead.');
    } finally {
      setPwdBusy(false);
    }
  };

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
    <div className={`dashboard ${theme === 'dark' ? 'theme-dark' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Settings</h2>
          <button className="btn btn-secondary" onClick={doLogout} style={{ padding: '8px 16px' }}>
            Log out
          </button>
        </div>

        <div style={{ 
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          maxWidth: '400px'
        }}>
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'settings', label: 'Preferences' }
          ].map(({ key, label }) => (
            <button 
              key={key} 
              className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                transform: tab === key ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: tab === key ? '0 4px 12px rgba(142,172,205,0.25)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <div className="settings-container"><hr className="settings-divider" /></div>
            <section style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1080, margin: '0 auto' }}>
                <a href="/DoctorProfile" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
                  Open Doctor Profile
                  <span style={{ display: 'inline-flex', transition: 'transform 0.25s ease', transform: 'rotate(0deg)' }} 
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(180deg)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}>
                    ⇅
                  </span>
                </a>
              </div>
              <div className="patient-profile-container" style={{ marginTop: 16 }}>
                <div className="profile-hero">
                  <img src={preview || doctor?.profilePicture || '/default-avatar.png'} alt="Profile" className="profile-img" />
                </div>
                <div className="profile-box profile-info-box">
                  <h3>Doctor Information</h3>
                  <div className="info-grid">
                    <div className="label">First Name</div><div className="value">{doctor?.firstName || ''}</div>
                    <div className="label">Last Name</div><div className="value">{doctor?.lastName || ''}</div>
                    <div className="label">Email</div><div className="value">{doctor?.email || ''}</div>
                    <div className="label">Contact</div><div className="value">{doctor?.contact || ''}</div>
                    <div className="label">Specialty</div><div className="value">{doctor?.specialty || ''}</div>
                    <div className="label">Experience</div><div className="value">{doctor?.experience || ''}</div>
                    <div className="label">Address</div><div className="value">{doctor?.address1 || ''}</div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === 'settings' && (
          <div style={{ maxWidth: '900px' }}>
            {/* Appearance */}
            <section className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSections(s => ({ ...s, appearance: !s.appearance }))}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '16px 24px', 
                  borderRadius: 0, 
                  border: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent'
                }}
              >
                <span>Appearance</span>
                <span style={{ transition: 'transform 0.2s', transform: sections.appearance ? 'rotate(180deg)' : 'rotate(0)', fontSize: '1.2rem' }}>▾</span>
              </button>
              {sections.appearance && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: theme === 'dark' ? 'rgba(142,172,205,0.1)' : 'rgba(142,172,205,0.08)',
                  borderRadius: '12px',
                  border: `2px solid ${theme === 'dark' ? 'rgba(142,172,205,0.2)' : 'rgba(142,172,205,0.15)'}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label htmlFor="theme-toggle-d" style={{ fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>
                      Dark Mode
                    </label>
                    <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                    </span>
                  </div>
                  <label className="theme-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                    <input 
                      id="theme-toggle-d" 
                      type="checkbox" 
                      checked={theme==='dark'} 
                      onChange={(e)=> setTheme(e.target.checked?'dark':'light')}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: theme === 'dark' ? '#6B8FA3' : '#ccc',
                      transition: '0.4s',
                      borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '26px',
                        width: '26px',
                        left: theme === 'dark' ? '30px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '0.4s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
              )}
            </section>

            {/* Password */}
            <section className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSections(s => ({ ...s, password: !s.password }))}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '16px 24px', 
                  borderRadius: 0, 
                  border: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent'
                }}
              >
                <span>Password</span>
                <span style={{ transition: 'transform 0.2s', transform: sections.password ? 'rotate(180deg)' : 'rotate(0)', fontSize: '1.2rem' }}>▾</span>
              </button>
              {sections.password && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '4px', fontSize: '1.1rem', fontWeight: 600 }}>Change Password</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Update your password to keep your account secure</p>
                </div>
                {pwdErr && (
                  <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>{pwdErr}</div>
                )}
                {pwdMsg && (
                  <div style={{ color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(22,163,74,0.2)' }}>{pwdMsg}</div>
                )}
                <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '0.9rem' }}>Current Password</label>
                    <input type="password" className="form-control" value={pwdForm.current} onChange={(e)=> setPwdForm(f=>({...f,current:e.target.value}))} placeholder="Enter your current password" required style={{ padding: '10px 14px', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '0.9rem' }}>New Password</label>
                    <input type="password" className="form-control" value={pwdForm.next} onChange={(e)=> setPwdForm(f=>({...f,next:e.target.value}))} placeholder="Enter your new password" required style={{ padding: '10px 14px', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '0.9rem' }}>Confirm New Password</label>
                    <input type="password" className="form-control" value={pwdForm.confirm} onChange={(e)=> setPwdForm(f=>({...f,confirm:e.target.value}))} placeholder="Confirm your new password" required style={{ padding: '10px 14px', fontSize: '0.95rem' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: `1px solid ${theme === 'dark' ? 'rgba(142,172,205,0.2)' : 'rgba(142,172,205,0.15)'}` }}>
                    <button className="btn btn-primary" disabled={pwdBusy} style={{ padding: '10px 16px', fontSize: '0.95rem', fontWeight: 600 }}>
                      {pwdBusy ? 'Updating...' : 'Update Password'}
                    </button>
                    <a href="/forgot-password" style={{ textAlign: 'center', fontSize: '0.9rem', color: theme === 'dark' ? '#8EACCD' : '#6B8FA3', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                      Forgot your password?
                    </a>
                  </div>
                </form>
              </div>
              )}
            </section>

            {/* Notifications */}
            <section className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSections(s => ({ ...s, notifications: !s.notifications }))}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '16px 24px', 
                  borderRadius: 0, 
                  border: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent'
                }}
              >
                <span>Notifications</span>
                <span style={{ transition: 'transform 0.2s', transform: sections.notifications ? 'rotate(180deg)' : 'rotate(0)', fontSize: '1.2rem' }}>▾</span>
              </button>
              {sections.notifications && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '4px', fontSize: '1.1rem', fontWeight: 600 }}>Manage Notifications</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Control how you receive notifications</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: notifMuted ? 'rgba(239,68,68,0.08)' : 'rgba(142,172,205,0.08)',
                    borderRadius: '12px',
                    border: `2px solid ${notifMuted ? 'rgba(239,68,68,0.15)' : 'rgba(142,172,205,0.15)'}`
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label htmlFor="mute-all-notifs-d" style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                        Mute All Notifications
                      </label>
                      <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        {notifMuted ? 'Notifications are muted' : 'Notifications are enabled'}
                      </span>
                    </div>
                    <label className="theme-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                      <input
                        id="mute-all-notifs-d"
                        type="checkbox"
                        checked={notifMuted}
                        onChange={(e) => {
                          const v = e.target.checked; setNotifMuted(v); localStorage.setItem('notifMuted', v ? 'on' : 'off');
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: notifMuted ? '#ef4444' : '#ccc',
                        transition: '0.4s',
                        borderRadius: '34px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '26px',
                          width: '26px',
                          left: notifMuted ? '30px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.4s',
                          borderRadius: '50%'
                        }}></span>
                      </span>
                    </label>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: notifMuted ? 'rgba(142,172,205,0.03)' : (notifSound ? 'rgba(142,172,205,0.08)' : 'rgba(142,172,205,0.03)'),
                    borderRadius: '12px',
                    border: `2px solid ${notifMuted ? 'rgba(142,172,205,0.1)' : 'rgba(142,172,205,0.15)'}`,
                    opacity: notifMuted ? 0.5 : 1,
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label htmlFor="sound-notifs-d" style={{ fontWeight: 600, fontSize: '1rem', cursor: notifMuted ? 'not-allowed' : 'pointer' }}>
                        Notification Sound
                      </label>
                      <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        {notifSound ? 'Sound enabled' : 'Sound disabled'}
                      </span>
                    </div>
                    <label className="theme-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                      <input
                        id="sound-notifs-d"
                        type="checkbox"
                        checked={notifSound}
                        disabled={notifMuted}
                        onChange={(e) => {
                          const v = e.target.checked; setNotifSound(v); localStorage.setItem('notifSound', v ? 'on' : 'off');
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: notifMuted ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: (notifSound && !notifMuted) ? '#6B8FA3' : '#ccc',
                        transition: '0.4s',
                        borderRadius: '34px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '26px',
                          width: '26px',
                          left: notifSound ? '30px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.4s',
                          borderRadius: '50%'
                        }}></span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}

export default DSettings;