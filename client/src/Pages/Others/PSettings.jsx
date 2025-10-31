import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/PNavbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/PatientProfile.css';

function PSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState('profile'); // profile | appearance | password | notifications

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
    <div className="dashboard">
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className="dashboard-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <h2 style={{ marginBottom: 25 }}>Settings</h2>
          <button className="btn btn-secondary" onClick={doLogout}>Log out</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {['profile','appearance','password','notifications'].map((t) => (
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

        {tab === 'notifications' && (
          <section className="card" style={{ padding: 16, maxWidth: 520 }}>
            <h3 style={{ marginTop: 0 }}>Notifications</h3>
            <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                id="mute-all-notifs-p"
                type="checkbox"
                checked={notifMuted}
                onChange={(e) => { const v = e.target.checked; setNotifMuted(v); localStorage.setItem('notifMuted', v ? 'on' : 'off'); }}
              />
              <label htmlFor="mute-all-notifs-p" className="form-label" style={{ margin: 0 }}>Mute all notifications (no sound)</label>
            </div>
            <div className="mb-1" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                id="sound-notifs-p"
                type="checkbox"
                checked={notifSound}
                disabled={notifMuted}
                onChange={(e) => { const v = e.target.checked; setNotifSound(v); localStorage.setItem('notifSound', v ? 'on' : 'off'); }}
              />
              <label htmlFor="sound-notifs-p" className="form-label" style={{ margin: 0 }}>Play sound for notifications</label>
            </div>
            <p style={{ marginTop: 6, color: '#6b7280' }}>These preferences are saved to this device and apply to the notification bell on the top bar.</p>
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