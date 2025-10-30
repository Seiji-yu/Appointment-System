import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/PatientProfile.css';

function DSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState('profile'); // profile | appearance | password

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
        setPreview(d.profileImage || '');
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', theme);
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

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <h2 style={{ marginBottom: 25 }}>Settings</h2>
          <button className="btn btn-secondary" onClick={doLogout}>Log out</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['profile','appearance','password'].map((t) => (
            <button key={t} className={`btn ${tab===t? 'btn-primary':'btn-secondary'}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <div className="settings-container"><hr className="settings-divider" /></div>
            <section style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1080, margin: '0 auto' }}>
                <a href="/DoctorProfile" className="btn btn-primary">Open Doctor Profile</a>
              </div>
              <div className="patient-profile-container" style={{ marginTop: 16 }}>
                <div className="profile-hero">
                  <img src={preview || '/default-avatar.png'} alt="Profile" className="profile-img" />
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

        {tab === 'appearance' && (
          <section className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Appearance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label htmlFor="theme-toggle-d" style={{ fontWeight: 600 }}>Dark mode, testing palang, ayusin kapag maganda na UI</label>
              <input id="theme-toggle-d" type="checkbox" checked={theme==='dark'} onChange={(e)=> setTheme(e.target.checked?'dark':'light')} />
            </div>
            <p style={{ marginTop: 8, color: '#6b7280' }}>Your theme preference is saved on this device.</p>
          </section>
        )}

        {tab === 'password' && (
          <section className="card" style={{ padding: 16, maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Change Password</h3>
            {pwdErr && <div style={{ color: 'red', marginBottom: 8 }}>{pwdErr}</div>}
            {pwdMsg && <div style={{ color: 'green', marginBottom: 8 }}>{pwdMsg}</div>}
            <form onSubmit={submitPassword}>
              <div className="mb-3">
                <label className="form-label">Current password</label>
                <input type="password" className="form-control" value={pwdForm.current} onChange={(e)=> setPwdForm(f=>({...f,current:e.target.value}))} required />
              </div>
              <div className="mb-3">
                <label className="form-label">New password</label>
                <input type="password" className="form-control" value={pwdForm.next} onChange={(e)=> setPwdForm(f=>({...f,next:e.target.value}))} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm new password</label>
                <input type="password" className="form-control" value={pwdForm.confirm} onChange={(e)=> setPwdForm(f=>({...f,confirm:e.target.value}))} required />
              </div>
              <button className="btn btn-primary" disabled={pwdBusy}>{pwdBusy? 'Saving…':'Update Password'}</button>
              <a href="/forgot-password" style={{ marginLeft: 12 }}>Forgot password?</a>
            </form>
          </section>
        )}

      </div>
    </div>
  );
}

export default DSettings;