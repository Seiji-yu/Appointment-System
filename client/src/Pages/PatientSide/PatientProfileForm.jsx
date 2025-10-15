import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function PatientProfileForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    age: '',
    gender: '',
    contact: '',
    address: '',
    medicalHistory: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // to redirect to pdashboard

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
            patient.age && patient.gender && patient.contact && patient.address;

          if (isComplete) {
            navigate('/patient/dashboard'); //return to patient dashboard if profile is complete
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
          });
        }
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem('email'); // Get email from storage PPF
      const submitForm = { ...form, email }; // Add email to data sent PPF
      const res = await axios.post('http://localhost:3001/patient/profile', submitForm);
      setMessage('Profile saved successfully!');
      setTimeout(() => navigate('/patient/dashboard'), 1000); //redirect to patient dashboard upon saving profile
    } catch (err) {
      setMessage('Error saving profile.');
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Patient Profile Form</h1>
      <h2>Patient Profile</h2>
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
          <input type="number" className="form-control" name="age" value={form.age} onChange={handleChange} required />
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
        <button type="submit" className="btn btn-primary">Save Profile</button>
      </form>
      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}

export default PatientProfileForm;