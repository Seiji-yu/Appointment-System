import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../Styles/PatientProfileForm.css';

function PatientProfileForm() {
  const hmoInputRef = useRef(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    age: '',
    gender: '',
    contact: '',
    address: '',
    medicalHistory: '',
    hmoNumber: '',
    emergencyName: '',
    emergencyContact: '',
    emergencyAddress: '',
    hmoCardImage: '',
  });
  const [hmoPreview, setHmoPreview] = useState('');
  const [showHmoOptions, setShowHmoOptions] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // to redirect to pdashboard


  // Computes Age
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
    } catch (error) {
      console.error('Error calculating age:', error);
      return '';
    }
  };

  useEffect(() => {
    const nextAge = computeAge(form.birthday);
    if (nextAge !== form.age) {
      setForm(prev => ({ ...prev, age: nextAge }));
    }
  }, [form.birthday]);

  // check if patient is already registered and if their profile is complete
  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      // redirect to login if not registered
      navigate('/login');
      return;
    }

    // check patient profile
    axios.post('http://localhost:3001/patient/get-profile', { email })
      .then(res => {
        const patient = res.data.patient;
        if (patient) {
          const isComplete =
            patient.firstName && patient.lastName && patient.birthday &&
            patient.age && patient.gender && patient.contact && patient.address && 
            patient.emergencyName && patient.emergencyContact && patient.emergencyAddress;

          if (isComplete) {
            navigate('/PatientDashboard'); //return to patient dashboard if profile is complete
            return;
          }

          // patient profile form
          setForm({
            firstName: patient.firstName || '',
            lastName: patient.lastName || '',
            birthday: patient.birthday ? new Date(patient.birthday).toISOString().slice(0,10) : '',
            age: patient.age || '',
            gender: patient.gender || '',
            contact: patient.contact || '',
            address: patient.address || '',
            medicalHistory: patient.medicalHistory || '',
            hmoNumber: patient.hmoNumber || '',
            emergencyName: patient.emergencyName || '',
            emergencyContact: patient.emergencyContact || '',
            emergencyAddress: patient.emergencyAddress || '',
          });
          // load existing hmo card preview if available
          if (patient.hmoCardImage) setHmoPreview(patient.hmoCardImage);
        }
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHmoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setHmoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveHmo = () => {
    setHmoPreview('');
    if (hmoInputRef.current) {
      hmoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem('email'); 
      // HMO preview
      const submitForm = { ...form, email, hmoCardImage: hmoPreview };
      const res = await axios.post('http://localhost:3001/patient/profile', submitForm);
      setMessage('Profile saved successfully!');
      setTimeout(() => navigate('/PatientDashboard'), 1000); //redirect to patient dashboard upon saving profile
    } catch (err) {
      setMessage('Error saving profile.');
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Patient Profile Form</h1>
      <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
        <div className="mb-3">
          <label className="form-label">First Name</label>
          <input type="text" className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Last Name</label>
          <input type="text" className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Birthday</label>
          <input type="date" className="form-control" name="birthday" value={form.birthday} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Age</label>
          <input type="number" className="form-control" name="age" value={form.age} readOnly required />
        </div>
        <div className="mb-3">
          <label className="form-label">Gender</label>
          <select className="form-select" name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Contact Number</label>
          <input type="text" className="form-control" name="contact" value={form.contact} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Address</label>
          <input type="text" className="form-control" name="address" value={form.address} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Medical History</label>
          <textarea className="form-control" name="medicalHistory" value={form.medicalHistory} onChange={handleChange} rows={3} />
        </div>
        <div className="mb-3">
          <label className="form-label">HMO Number</label>
          <input type="text" className="form-control" name="hmoNumber" value={form.hmoNumber} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">HMO Card</label>
        </div>
        <div className="hmo-upload-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleHmoUpload}
            style={{ display: 'none' }}
            ref={hmoInputRef}
            id="hmo-upload-input"
          /> 
          {!hmoPreview ? (
            <label htmlFor="hmo-upload-input" className="hmo-upload-box">
              <span className="hmo-plus">+</span>
            </label>
          ) : (
            <div
              className="hmo-upload-box hmo-has-image"
              style={{ backgroundImage: `url(${hmoPreview})` }}
              onMouseEnter={() => setShowHmoOptions(true)}
              onMouseLeave={() => setShowHmoOptions(false)}
            > 
              {showHmoOptions && (
                <div className="hmo-options">
                  <label htmlFor="hmo-upload-input" className="hmo-option-btn">Change</label>
                  <button type="button" className="hmo-option-btn" onClick={handleRemoveHmo}>Remove</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Emergency Contact Information</label>
        </div>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input type="text" className="form-control" name="emergencyName" value={form.emergencyName} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Contact Number</label>
          <input type="text" className="form-control" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Address</label>
          <input type="text" className="form-control" name="emergencyAddress" value={form.emergencyAddress} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">Save Profile</button>
      </form>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}

export default PatientProfileForm;
