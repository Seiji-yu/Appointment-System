import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/DoctorProfile.css';
import '../../Styles/PatientProfileForm.css';
import CalendarC from '../../Calendar/CalendarC.jsx';

function DoctorProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // profile image
  const [profilePreview, setProfilePreview] = useState(null);

  // form (doctor info)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    experience: '',
    fees: '',
    specialty: 'Mental Health',
    education: [''],
    address1: '',
    contact: '',
    about: ''
  });

  // phone input pieces (country code + local digits)
  const COUNTRY_CODES = [
    { code: '+63', label: '🇵🇭 Philippines (+63)' }
  ];
  const [countryCode, setCountryCode] = useState('+63');
  const [localNumber, setLocalNumber] = useState('');
  const LOCAL_MAX = 10; // limit local digits length

  // snapshots to restore on cancel
  const [origForm, setOrigForm] = useState(null);
  const [origPreview, setOrigPreview] = useState(null);

  // Specialty options
  const SPECIALTIES = [
    'Mental Health',
    'General Psychiatry',
    'Child and Adolescent Psychiatry',
    'Geriatric Psychiatry',
    'Addiction Psychiatry',
    'Consultation-Liaison Psychiatry',
    'Forensic Psychiatry',
    'Community Psychiatry',
    'Psychotherapy',
  ];
  const OTHER_VALUE = '__OTHER__';
  const specialtySelectValue = SPECIALTIES.includes(form.specialty) ? form.specialty : OTHER_VALUE;

  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Availability state (unchanged)
  const [availDate, setAvailDate] = useState(() => toYMD(new Date()));
  const [ranges, setRanges] = useState([{ start: '09:00', end: '10:30' }]);
  const [avLoading, setAvLoading] = useState(false);
  const [bulkDays, setBulkDays] = useState(5);

  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }, []);
  const nowHHMM = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  };

  // Round up an HH:mm string to the next step minute (default: 5 mins)
  const roundUpHHMM = (hhmm, step = 5) => {
    try {
      const [h, m] = hhmm.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
      const mins = h * 60 + m;
      const rounded = Math.ceil(mins / step) * step;
      const capped = Math.min(rounded, (24 * 60) - 1);
      const hh = String(Math.floor(capped / 60)).padStart(2, '0');
      const mm = String(capped % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return hhmm;
    }
  };

  // Fetch doctor info
  useEffect(() => {
    const email = localStorage.getItem('doctorEmail') ||
      localStorage.getItem('email') ||
      form.email;

    if (!email) {
      setMessage('Doctor email missing. Please login again.');
      return;
    }

    axios.post('http://localhost:3001/doctor/get-profile', { email })
      .then(res => {
        const doctor = res.data.doctor;
        if (doctor) {
          const next = {
            firstName: doctor.firstName || '',
            lastName: doctor.lastName || '',
            email: doctor.email || '',
            experience: doctor.experience || '',
            fees: doctor.fees || '',
            specialty: doctor.specialty || 'Mental Health',
            education: Array.isArray(doctor.education) ? doctor.education : [''],
            address1: doctor.address1 || '',
            contact: doctor.contact || '',
            about: doctor.about || ''
          };
          // derive phone parts from contact, e.g. +64 221234567
          try {
            const m = String(next.contact || '').match(/^(\+\d{1,4})\s*(.*)$/);
            if (m) {
              setCountryCode(m[1]);
              setLocalNumber(((m[2] || '').replace(/\D/g, '')).slice(0, LOCAL_MAX));
            } else {
              setCountryCode('+63');
              setLocalNumber(String(next.contact || '').replace(/\D/g, '').slice(0, LOCAL_MAX));
            }
          } catch {
            setCountryCode('+63');
            setLocalNumber('');
          }
          setForm(next);
          setOrigForm(next);
          setProfilePreview(doctor.profileImage || null);
          setOrigPreview(doctor.profileImage || null);
        } else {
          setMessage('No profile data found. Please complete your profile.');
        }
      })
      .catch(err => {
        console.error('Error fetching doctor profile:', err);
        setMessage('Error loading profile data.');
      });

      
  }, []);

  // Image upload handlers
  const handleImageUpload = (e) => {
    if (!editMode) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };
  const removeProfileImage = () => {
    if (!editMode) return;
    setProfilePreview(null);
  };

  // Form change handlers
  const handleChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    // Enforce numeric-only input for contact number (keep leading zeros by using text input)
    const nextVal = name === 'contact' ? value.replace(/\D/g, '') : value;
    setForm({ ...form, [name]: nextVal });
  };
  const handleSpecialtySelect = (e) => {
    if (!editMode) return;
    const v = e.target.value;
    // When choosing Other, switch to custom input by clearing stored specialty
    setForm({ ...form, specialty: v === OTHER_VALUE ? '' : v });
  };
  const handleEducationChange = (index, value) => {
    if (!editMode) return;
    const newEdu = [...form.education];
    newEdu[index] = value;
    setForm({ ...form, education: newEdu });
  };
  const addEducation = () => {
    if (!editMode) return;
    setForm({ ...form, education: [...form.education, ''] });
  };
  const removeEducation = (index) => {
    if (!editMode) return;
    setForm({ ...form, education: form.education.filter((_, i) => i !== index) });
  };

  // Edit mode controls
  const startEdit = () => {
    setOrigForm(form);
    setOrigPreview(profilePreview);
    setEditMode(true);
    setMessage('');
  };
  const cancelEdit = () => {
    setForm(origForm || form);
    setProfilePreview(origPreview || null);
    setEditMode(false);
    setMessage('Changes discarded.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editMode) return;
    try {
      setSaving(true);
      setMessage('');
      const doctorEmail = form.email || localStorage.getItem('doctorEmail') || localStorage.getItem('email');
      if (!doctorEmail) {
        setMessage('Cannot update profile: email missing.');
        setSaving(false);
        return;
      }

      // Compose contact in international format
      const fullContact = `${countryCode} ${localNumber}`.trim();
      const dataToSend = {
        email: doctorEmail,
        firstName: form.firstName,
        lastName: form.lastName,
        fees: form.fees,
        experience: form.experience,
        specialty: form.specialty,
        education: form.education,
        about: form.about,
        address1: form.address1,
        contact: fullContact,
        profileImage: profilePreview // save new/removed image
      };

      const res = await axios.post('http://localhost:3001/doctor/profile', dataToSend);
      if (res.data?.status === 'success') {
        setMessage('Profile saved successfully!');
        // commit snapshots and exit edit mode
        // keep submitted contact in form state
        const committed = { ...form, contact: fullContact };
        setOrigForm(committed);
        setForm(committed);
        setOrigPreview(profilePreview);
        setEditMode(false);
      } else {
        setMessage('Error saving profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage('Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  // Availability API
  const loadAvailability = async (ymd) => {
    if (!form.email || !ymd) return;
    setAvLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/doctor/availability', {
        params: { email: form.email, date: ymd }
      });
      const r = res.data?.availability?.ranges || [];
      setRanges(r.length ? r : []);
    } catch {
      setRanges([]);
    } finally {
      setAvLoading(false);
    }
  };

  const addRange = () => setRanges(prev => [...prev, { start: '09:00 ', end: '10:00' }]);
  const updateRange = (i, key, val) => {
    setRanges(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  };
  const removeRange = (i) => setRanges(prev => prev.filter((_, idx) => idx !== i));
  const setPreset = (type) => {
    switch (type) {
      case 'morning': setRanges([{ start: '09:00', end: '12:00' }]); break;
      case 'afternoon': setRanges([{ start: '13:00', end: '17:00' }]); break;
      case 'fullday': setRanges([{ start: '09:00', end: '17:00' }]); break;
      default: setRanges([]);
    }
  };

  const saveAvailability = async () => {
    try {
      const picked = new Date(availDate);
      picked.setHours(0,0,0,0);
      if (picked < todayStart) {
        setMessage('Cannot set availability for past dates.');
        return;
      }
      let payloadRanges = ranges;
      let partialToday = false;
      if (picked.getTime() === todayStart.getTime()) {
        const now = nowHHMM();
        payloadRanges = ranges.filter(r => r.end > now);
        // if any kept range overlaps now, mark partial
        partialToday = payloadRanges.some(r => r.start < now && r.end > now);
        if (payloadRanges.length === 0) {
          setMessage('All time ranges are in the past for today.');
          return;
        }
      }
      const payload = { email: form.email, date: availDate, ranges: payloadRanges };
      const res = await axios.post('http://localhost:3001/doctor/availability', payload);
      if (res.data?.status === 'success') {
        if (partialToday) {
          const from = roundUpHHMM(nowHHMM());
          setMessage(`For today, patients will only see times from ${from} onward.`);
        } else {
          setMessage('Availability saved.');
        }
      } else {
        setMessage('Error saving availability.');
      }
    } catch (e) {
      setMessage(e?.response?.data?.message || 'Error saving availability.');
    }
  };

  const applyToNextNDays = async () => {
    try {
      const base = new Date(availDate); base.setHours(0,0,0,0);
      const dates = [];
      const days = Math.max(1, Number(bulkDays) || 1);
      for (let i = 1; i <= days; i++) {
        const d = new Date(base); d.setDate(base.getDate() + i);
        if (d >= todayStart) dates.push(toYMD(d));
      }
      if (dates.length === 0) { setMessage('No future days to apply.'); return; }
      const payload = { email: form.email, dates, ranges };
      const res = await axios.post('http://localhost:3001/doctor/availability/bulk', payload);
      setMessage(res.data?.status === 'success' ? `Applied to ${res.data.updated} day(s).` : 'Bulk apply failed.');
    } catch (e) {
      setMessage(e?.response?.data?.message || 'Bulk apply failed.');
    }
  };

  useEffect(() => {
    if (form.email && availDate) loadAvailability(availDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email, availDate]);

 return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />

      <main className="doctor-main">
        <div className="doctor-profile-page">
          <div className="page-header d-flex justify-content-between align-items-center">
            <h1 className="mb-0">Doctor Profile</h1>
            {!editMode ? (
              <button className="btn btn-secondary" onClick={startEdit}>Edit Profile</button>
            ) : (
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary" type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="doctor-profile-grid">
            {/* LEFT: Profile Info */}
            <section className="left-panel">
              {/* Profile Photo */}
              <div className="card p-4 mb-4">
                <div className="text-center">
                  <div className="profile-picture-container">
                    <div className="profile-picture-wrapper" style={{ cursor: editMode ? 'pointer' : 'default' }}>
                      <img
                        src={profilePreview || '/default-avatar.png'}
                        alt="Profile"
                        className="profile-picture"
                      />
                      {editMode && (
                        <label htmlFor="profile-upload" className="profile-upload-overlay" title="Change photo">
                          <i className="fas fa-camera"></i>
                          <span>Edit Photo</span>
                        </label>
                      )}
                    </div>
                    <input
                      type="file"
                      id="profile-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    {editMode && profilePreview && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm mt-2"
                        onClick={removeProfileImage}
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Form (read-only until editMode) */}
              <form className="card p-4" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Fees (₱)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="fees"
                    value={form.fees}
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Experience</label>
                  <input
                    type="text"
                    className="form-control"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Specialty</label>
                  <select
                    className="form-select"
                    name="specialtySelect"
                    value={specialtySelectValue}
                    onChange={handleSpecialtySelect}
                    disabled={!editMode}
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value={OTHER_VALUE}>Other…</option>
                  </select>
                  {editMode && specialtySelectValue === OTHER_VALUE && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Enter specialty"
                      value={form.specialty}
                      onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    />
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Education</label>
                  {form.education.map((edu, index) => (
                    <div key={index} className="d-flex align-items-center gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={edu}
                        onChange={(e) => handleEducationChange(index, e.target.value)}
                        readOnly={!editMode}
                      />
                      {editMode && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeEducation(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {editMode && (
                    <button type="button" className="btn btn-secondary" onClick={addEducation}>
                      + Add Education
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Clinic Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address1"
                    value={form.address1}
                    onChange={handleChange}
                    readOnly={!editMode}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  {!editMode ? (
                    <input
                      type="text"
                      className="form-control"
                      name="contact"
                      value={`${countryCode} ${localNumber}`.trim()}
                      readOnly
                    />
                  ) : (
                    <div className="d-flex gap-2">
                      <select
                        className="form-select"
                        style={{ maxWidth: 210 }}
                        value={countryCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          setCountryCode(code);
                          setForm({ ...form, contact: `${code} ${localNumber}`.trim() });
                        }}
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="form-control"
                        placeholder="e.g., 9123456789"
                        maxLength={LOCAL_MAX}
                        value={localNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, LOCAL_MAX);
                          setLocalNumber(digits);
                          setForm({ ...form, contact: `${countryCode} ${digits}`.trim() });
                        }}
                      />
                    </div>
                  )}
                  <div className="form-text">Stores in international format (e.g., +64 221234567). Max {LOCAL_MAX} digits for the local number.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">About</label>
                  <textarea
                    className="form-control"
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    rows="4"
                    readOnly={!editMode}
                  />
                </div>

                {editMode && (
                  <div className="d-flex justify-content-end gap-2">
                    <button className="btn btn-outline-secondary" type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>

              {message && <div className="alert alert-info mt-3">{message}</div>}
            </section>

            {/* RIGHT: Schedule */}
            <section className="right-panel">
              <div className="card p-3">
                <h3 className="card-title mb-2">Set Available Schedule</h3>

                <div className="mb-2">
                  <label className="form-label">Pick a date</label>
                  <div className="d-flex align-items-start gap-3 flex-wrap">
                    <CalendarC
                      value={new Date(availDate)}
                      minDate={todayStart}
                      onChange={(d) => {
                        try {
                          const picked = new Date(d);
                          picked.setHours(0,0,0,0);
                          if (picked < todayStart) return;
                          setAvailDate(toYMD(picked));
                        } catch { /* ignore */ }
                      }}
                      showHeader={false}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-end gap-2 mb-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => loadAvailability(availDate)}>
                          {avLoading ? 'Loading…' : 'Reload'}
                        </button>
                        <button type="button" className="btn btn-outline-danger" onClick={() => setRanges([])}>
                          Clear Ranges
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="small text-muted mb-1">Quick presets</div>
                        <div className="d-flex flex-wrap gap-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setPreset('morning')}>Morning 09:00–12:00</button>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setPreset('afternoon')}>Afternoon 13:00–17:00</button>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setPreset('fullday')}>Full day 09:00–17:00</button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addRange}>+ Add Range</button>
                        </div>
                      </div>

                      <div className="mt-2">
                        {ranges.length === 0 && <p className="text-muted">No ranges for this date.</p>}
                        {ranges.map((r, i) => (
                          <div key={i} className="row g-2 align-items-end mb-2">
                            <div className="col-6 col-md-5">
                              <label className="form-label mb-0">Start</label>
                              <input
                                type="time"
                                className="form-control"
                                value={r.start}
                                onChange={(e) => updateRange(i, 'start', e.target.value)}
                              />
                            </div>
                            <div className="col-6 col-md-5">
                              <label className="form-label mb-0">End</label>
                              <input
                                type="time"
                                className="form-control"
                                value={r.end}
                                onChange={(e) => updateRange(i, 'end', e.target.value)}
                              />
                            </div>
                            <div className="col-12 col-md-2">
                              <button type="button" className="btn btn-outline-danger" onClick={() => removeRange(i)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted">Apply same schedule to next</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={bulkDays}
                            onChange={(e) => setBulkDays(e.target.value)}
                            className="form-control"
                            style={{ width: 80 }}
                          />
                          <span className="small text-muted">day(s)</span>
                          <button type="button" className="btn btn-outline-secondary" onClick={applyToNextNDays}>
                            Apply
                          </button>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={saveAvailability}>
                          Save Availability
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DoctorProfile;