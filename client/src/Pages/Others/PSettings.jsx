import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/PNavbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/PatientProfile.css';

function PSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState('profile'); // profile | appearance | password

  // profile state (read-only view)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [preview, setPreview] = useState('');
  const [hmoPreview, setHmoPreview] = useState('');

  // theme
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdBusy, setPwdBusy] = useState(false);

  const doLogout = () => {
    try {
      localStorage.removeItem('email');
      localStorage.removeItem('doctorEmail');
      localStorage.removeItem('name');
    } catch {}
    window.location.href = '/Login';
  };

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      setError('Missing email. Please login again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    axios.post('http://localhost:3001/patient/get-profile', { email })
      .then(res => {
        const p = res.data?.patient;
        if (!p) {
          setError('No profile found. You can complete it via Edit Profile.');
          return;
        }
        setPatient(p);
        setPreview(p.profileImage || '');
        setHmoPreview(p.hmoCardImage || '');
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  // theme side-effect
  useEffect(() => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString(); } catch { return ''; }
  };

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
      const email = localStorage.getItem('email');
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
    <div className="dashboard">
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <h2 style={{ marginBottom: 25 }}>Settings</h2>
          <button className="btn btn-secondary" onClick={doLogout}>Log out</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {['profile','appearance','password'].map((t) => (
            <button key={t}
              className={`btn ${tab===t? 'btn-primary':'btn-secondary'}`}
              onClick={() => setTab(t)}
            >{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <div className="settings-container"><hr className="settings-divider" /></div>
            <section style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1080, margin: '0 auto' }}>
              <LinkBtn to="/PatientForm" label="Edit Profile" />
            </div>
            {loading ? (
              <div style={{ marginTop: 8 }}>Loading…</div>
            ) : error ? (
              <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
            ) : !patient ? (
              <div style={{ marginTop: 8 }}>No profile yet. Click Edit Profile to complete.</div>
            ) : (
              <div className="patient-profile-container" style={{ marginTop: 16 }}>
                {/* Hero without card box */}
                <div className="profile-hero">
                  <img src={preview || '/default-avatar.png'} alt="Profile" className="profile-img" />
                  <div className="profile-buttons">
                    <LinkBtn to="/PatientForm" label="Change" className="btn btn-secondary" />
                  </div>
                </div>
                <div className="profile-box profile-info-box">
                  <h3>Patient Information</h3>
                  <div className="info-grid">
                    <div className="label">First Name</div><div className="value">{patient?.firstName || ''}</div>
                    <div className="label">Last Name</div><div className="value">{patient?.lastName || ''}</div>
                    <div className="label">Birthday</div><div className="value">{formatDate(patient?.birthday)}</div>
                    <div className="label">Age</div><div className="value">{patient?.age ?? ''}</div>
                    <div className="label">Gender</div><div className="value">{patient?.gender || ''}</div>
                    <div className="label">Contact</div><div className="value">{patient?.contact || ''}</div>
                    <div className="label">Address</div><div className="value">{patient?.address || ''}</div>
                    <div className="label">Emergency Contact Name</div><div className="value">{patient?.emergencyName || ''}</div>
                    <div className="label">Emergency Contact Number</div><div className="value">{patient?.emergencyContact || ''}</div>
                    <div className="label">Emergency Contact Address</div><div className="value">{patient?.emergencyAddress || ''}</div>
                  </div>
                </div>
                <div className="profile-box profile-hmo-box">
                  <h3>HMO Number and Card</h3>
                  <div className="hmo-inner">
                    <div className="hmo-left">
                      <p className="hmo-number"><strong>HMO Number:</strong> {patient?.hmoNumber || 'Not available'}</p>
                    </div>
                    <div className="hmo-right">
                      {hmoPreview ? (
                        <img src={hmoPreview} alt="HMO Card" className="hmo-card-img" />
                      ) : (
                        <div className="hmo-card-placeholder">No HMO card uploaded</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="profile-box profile-medbox">
                  <h3>Medical History</h3>
                  <div className="medical-history">
                    {patient?.medicalHistory ? (
                      <p style={{ whiteSpace: 'pre-wrap' }}>{patient.medicalHistory}</p>
                    ) : (
                      <p>No medical history provided.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            </section>
          </>
        )}

        {tab === 'appearance' && (
          <section className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Appearance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label htmlFor="theme-toggle" style={{ fontWeight: 600 }}>Dark mode, testing palang, ayusin kapag maganda na UI</label>
              <input id="theme-toggle" type="checkbox" checked={theme==='dark'} onChange={(e)=> setTheme(e.target.checked?'dark':'light')} />
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

function LinkBtn({ to, label, className }) {
  return (
    <a href={to} className={className || 'btn btn-primary'}>{label}</a>
  );
}

export default PSettings;