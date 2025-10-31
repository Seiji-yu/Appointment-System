import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/PNavbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/PatientProfile.css';

function PSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState('profile'); // profile | settings
  const [sections, setSections] = useState({ appearance: false, password: false, notifications: false });

  // profile state (read-only view)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [preview, setPreview] = useState('');
  const [hmoPreview, setHmoPreview] = useState('');

  // inline edit states (bring PatientProfile editing into Settings)
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [hmoEditing, setHmoEditing] = useState(false);
  const [hmoForm, setHmoForm] = useState({ hmoNumber: '', hmoCardImage: '' });
  const [savingHmo, setSavingHmo] = useState(false);
  const hmoOriginalRef = useRef('');

  const [medEditing, setMedEditing] = useState(false);
  const [medForm, setMedForm] = useState({ medicalHistory: '' });
  const [savingMed, setSavingMed] = useState(false);

  // theme
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdBusy, setPwdBusy] = useState(false);

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

  // theme side-effect (match doctor settings behavior)
  useEffect(() => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('theme', theme);
    try { window.dispatchEvent(new Event('themeChange')); } catch {}
  }, [theme]);

  // keep theme in sync if toggled elsewhere
  useEffect(() => {
    const handleTheme = () => setTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('storage', handleTheme);
    window.addEventListener('themeChange', handleTheme);
    return () => {
      window.removeEventListener('storage', handleTheme);
      window.removeEventListener('themeChange', handleTheme);
    };
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString(); } catch { return ''; }
  };

  // compute age from birthday
  const computeAge = (dateStr) => {
    if (!dateStr) return '';
    try {
      const today = new Date();
      const birthDate = new Date(dateStr);
      if (isNaN(birthDate.getTime())) return '';
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? String(age) : '0';
    } catch { return ''; }
  };

  // image handlers
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!patient?.email) return;
    try {
      await axios.post('http://localhost:3001/patient/profile', { email: patient.email, profileImage: preview || '' });
      setPwdMsg('Profile picture saved');
      setPwdErr('');
    } catch {
      setPwdErr('Failed to save picture');
    }
  };

  // profile info edit handlers
  const startEdit = () => {
    if (!patient) return;
    setEditForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      email: patient.email || '',
      birthday: patient.birthday ? new Date(patient.birthday).toISOString().slice(0,10) : '',
      age: patient.age || '',
      gender: patient.gender || '',
      contact: patient.contact || '',
      address: patient.address || '',
      medicalHistory: patient.medicalHistory || '',
      hmoNumber: patient.hmoNumber || '',
      emergencyName: patient.emergencyName || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyAddress: patient.emergencyAddress || ''
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'birthday') next.age = computeAge(value);
      return next;
    });
  };

  const handleSaveProfile = async () => {
    if (!patient?.email || !editForm) return;
    setSavingProfile(true);
    setPwdMsg(''); setPwdErr('');
    try {
      const payload = { email: patient.email, ...editForm };
      const res = await axios.post('http://localhost:3001/patient/profile', payload);
      if (res.data && res.data.patient) {
        const p = res.data.patient;
        setPatient(p);
        setPreview(p.profileImage || preview);
        setHmoPreview(p.hmoCardImage || hmoPreview);
        setEditing(false);
        setEditForm(null);
        setPwdMsg('Profile saved successfully');
      } else {
        setPwdErr('Failed to save profile');
      }
    } catch (err) {
      setPwdErr('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // HMO edit handlers
  const handleHmoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setHmoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const startHmoEdit = () => {
    if (!patient) return;
    hmoOriginalRef.current = hmoPreview || patient.hmoCardImage || '';
    setHmoForm({ hmoNumber: patient.hmoNumber || '', hmoCardImage: patient.hmoCardImage || hmoOriginalRef.current });
    setHmoEditing(true);
  };

  const cancelHmoEdit = () => {
    setHmoEditing(false);
    setHmoPreview(hmoOriginalRef.current || '');
    setHmoForm({ hmoNumber: '', hmoCardImage: '' });
  };

  const handleHmoChange = (e) => {
    const { name, value } = e.target;
    setHmoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveHmo = async () => {
    if (!patient?.email) return;
    setSavingHmo(true);
    setPwdMsg(''); setPwdErr('');
    try {
      const payload = { email: patient.email, hmoNumber: hmoForm.hmoNumber, hmoCardImage: hmoPreview || hmoForm.hmoCardImage || '' };
      const res = await axios.post('http://localhost:3001/patient/profile', payload);
      if (res.data && res.data.patient) {
        const p = res.data.patient;
        setPatient(p);
        const newPreview = p.hmoCardImage || hmoPreview;
        setHmoPreview(newPreview);
        hmoOriginalRef.current = newPreview;
        setHmoEditing(false);
        setHmoForm({ hmoNumber: '', hmoCardImage: '' });
        setPwdMsg('HMO info saved');
      } else {
        setPwdErr('Failed to save HMO info');
      }
    } catch (err) {
      setPwdErr('Failed to save HMO info');
    } finally {
      setSavingHmo(false);
    }
  };

  // Medical history edit handlers
  const startMedEdit = () => {
    if (!patient) return;
    setMedForm({ medicalHistory: patient.medicalHistory || '' });
    setMedEditing(true);
  };

  const cancelMedEdit = () => {
    setMedEditing(false);
    setMedForm({ medicalHistory: '' });
  };

  const handleMedChange = (e) => {
    const { name, value } = e.target;
    setMedForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMed = async () => {
    if (!patient?.email) return;
    setSavingMed(true);
    setPwdMsg(''); setPwdErr('');
    try {
      const payload = { email: patient.email, medicalHistory: medForm.medicalHistory };
      const res = await axios.post('http://localhost:3001/patient/profile', payload);
      if (res.data && res.data.patient) {
        setPatient(res.data.patient);
        setMedEditing(false);
        setMedForm({ medicalHistory: '' });
        setPwdMsg('Medical history saved');
      } else {
        setPwdErr('Failed to save medical history');
      }
    } catch (err) {
      setPwdErr('Failed to save medical history');
    } finally {
      setSavingMed(false);
    }
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
    <div className={`dashboard ${theme === 'dark' ? 'theme-dark' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>Settings</h2>
          <button className="btn btn-secondary" onClick={doLogout} style={{ padding: '8px 16px' }}>Log out</button>
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
              {loading ? (
                <div style={{ marginTop: 8 }}>Loading…</div>
              ) : error ? (
                <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
              ) : !patient ? (
                <div style={{ marginTop: 8 }}>No profile yet. Please complete your profile.</div>
              ) : (
                <div className="patient-profile-container" style={{ marginTop: 16 }}>
                  {/* profile picture */}
                  <div className="profile-box profile-image-box">
                    <h3>Profile Picture</h3>
                    <img src={preview || '/default-avatar.png'} alt="Profile" className="profile-img" />
                    <div className="profile-buttons">
                      <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        Change
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      <button className="btn btn-primary" onClick={handleSavePhoto}>Save Photo</button>
                    </div>
                  </div>

                  {/* patient information */}
                  <div className="profile-box profile-info-box">
                    <h3>Patient Information</h3>
                    <div className="info-grid">
                      {!editing ? (
                        <>
                          <div className="label">First Name</div><div className="value">{patient?.firstName || ''}</div>
                          <div className="label">Last Name</div><div className="value">{patient?.lastName || ''}</div>
                          <div className="label">Birthday</div><div className="value">{formatDate(patient?.birthday)}</div>
                          <div className="label">Age</div><div className="value">{patient?.age ?? ''}</div>
                          <div className="label">Gender</div><div className="value">{patient?.gender || ''}</div>
                          <div className="label">Email</div><div className="value">{patient?.email || ''}</div>
                          <div className="label">Contact</div><div className="value">{patient?.contact || ''}</div>
                          <div className="label">Address</div><div className="value">{patient?.address || ''}</div>
                          <div className="label">Emergency Contact Name</div><div className="value">{patient?.emergencyName || ''}</div>
                          <div className="label">Emergency Contact Number</div><div className="value">{patient?.emergencyContact || ''}</div>
                          <div className="label">Emergency Contact Address</div><div className="value">{patient?.emergencyAddress || ''}</div>
                        </>
                      ) : (
                        <>
                          <div className="label">First Name</div>
                          <div className="value"><input name="firstName" value={editForm.firstName} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Last Name</div>
                          <div className="value"><input name="lastName" value={editForm.lastName} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Birthday</div>
                          <div className="value"><input type="date" name="birthday" value={editForm.birthday} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Age</div>
                          <div className="value"><input name="age" value={editForm.age} readOnly className="form-control" /></div>

                          <div className="label">Gender</div>
                          <div className="value">
                            <select name="gender" value={editForm.gender} onChange={handleEditChange} className="form-control">
                              <option value="">Select</option>
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="label">Email</div>
                          <div className="value"><input name="email" value={editForm.email} readOnly className="form-control" /></div>

                          <div className="label">Contact</div>
                          <div className="value"><input name="contact" value={editForm.contact} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Address</div>
                          <div className="value"><input name="address" value={editForm.address} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Emergency Contact Name</div>
                          <div className="value"><input name="emergencyName" value={editForm.emergencyName} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Emergency Contact Number</div>
                          <div className="value"><input name="emergencyContact" value={editForm.emergencyContact} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Emergency Contact Address</div>
                          <div className="value"><input name="emergencyAddress" value={editForm.emergencyAddress} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">HMO Number</div>
                          <div className="value"><input name="hmoNumber" value={editForm.hmoNumber} onChange={handleEditChange} className="form-control" /></div>

                          <div className="label">Medical History</div>
                          <div className="value"><textarea name="medicalHistory" value={editForm.medicalHistory} onChange={handleEditChange} className="form-control" rows={3} /></div>
                        </>
                      )}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {!editing ? (
                        <button className="btn btn-outline-primary" onClick={startEdit}>Edit</button>
                      ) : (
                        <>
                          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save'}</button>
                          <button className="btn btn-secondary" onClick={cancelEdit} disabled={savingProfile}>Cancel</button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* HMO number and card */}
                  <div className="profile-box profile-hmo-box">
                    <h3>HMO Number and Card</h3>
                    <div className="hmo-inner">
                      <div className="hmo-left">
                        {!hmoEditing ? (
                          <p className="hmo-number"><strong>HMO Number:</strong> {patient?.hmoNumber || 'Not available'}</p>
                        ) : (
                          <div>
                            <label className="form-label">HMO Number</label>
                            <input name="hmoNumber" value={hmoForm.hmoNumber} onChange={handleHmoChange} className="form-control" />
                          </div>
                        )}
                      </div>
                      <div className="hmo-right">
                        {!hmoEditing ? (
                          (hmoPreview ? (
                            <img src={hmoPreview} alt="HMO Card" className="hmo-card-img" />
                          ) : (
                            <div className="hmo-card-placeholder">No HMO card uploaded</div>
                          ))
                        ) : (
                          <div>
                            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                              Change HMO Card
                              <input type="file" accept="image/*" onChange={handleHmoUpload} style={{ display: 'none' }} />
                            </label>
                            <div style={{ marginTop: 8 }}>{hmoPreview ? <img src={hmoPreview} alt="HMO Preview" className="hmo-card-img" /> : <div className="hmo-card-placeholder">No HMO card uploaded</div>}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {!hmoEditing ? (
                        <button className="btn btn-outline-primary" onClick={startHmoEdit}>Edit</button>
                      ) : (
                        <>
                          <button className="btn btn-primary" onClick={handleSaveHmo} disabled={savingHmo}>{savingHmo ? 'Saving…' : 'Save'}</button>
                          <button className="btn btn-secondary" onClick={cancelHmoEdit} disabled={savingHmo}>Cancel</button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* medical history */}
                  <div className="profile-box profile-medbox">
                    <h3>Medical History</h3>
                    <div className="medical-history">
                      {!medEditing ? (
                        patient?.medicalHistory ? (
                          <p style={{ whiteSpace: 'pre-wrap' }}>{patient.medicalHistory}</p>
                        ) : (
                          <p>No medical history provided.</p>
                        )
                      ) : (
                        <textarea name="medicalHistory" value={medForm.medicalHistory} onChange={handleMedChange} className="form-control" rows={6} />
                      )}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {!medEditing ? (
                        <button className="btn btn-outline-primary" onClick={startMedEdit}>Edit</button>
                      ) : (
                        <>
                          <button className="btn btn-primary" onClick={handleSaveMed} disabled={savingMed}>{savingMed ? 'Saving…' : 'Save'}</button>
                          <button className="btn btn-secondary" onClick={cancelMedEdit} disabled={savingMed}>Cancel</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                <label htmlFor="theme-toggle-p" style={{ fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>
                  Dark Mode
                </label>
                <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                  {theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                </span>
              </div>
              <label className="theme-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input 
                  id="theme-toggle-p" 
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
                  <label htmlFor="mute-all-notifs-p" style={{ fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>
                    Mute All Notifications
                  </label>
                  <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    {notifMuted ? 'Notifications are muted' : 'Notifications are enabled'}
                  </span>
                </div>
                <label className="theme-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                  <input
                    id="mute-all-notifs-p"
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
                  <label htmlFor="sound-notifs-p" style={{ fontWeight: 600, fontSize: '1.05rem', cursor: notifMuted ? 'not-allowed' : 'pointer' }}>
                    Notification Sound
                  </label>
                  <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    {notifSound ? 'Sound enabled' : 'Sound disabled'}
                  </span>
                </div>
                <label className="theme-switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                  <input
                    id="sound-notifs-p"
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

function LinkBtn({ to, label, className }) {
  return (
    <a href={to} className={className || 'btn btn-primary'}>{label}</a>
  );
}

export default PSettings;