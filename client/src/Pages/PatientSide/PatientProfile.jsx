import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'
import '../../Styles/PatientProfile.css'

function PatientProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [patient, setPatient] = useState(null)
  const [preview, setPreview] = useState('')
  const [hmoPreview, setHmoPreview] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const email = localStorage.getItem('email')
    if (!email) {
      navigate('/login')
      return
    }
    setLoading(true)
    setError('')

    axios.post('http://localhost:3001/patient/get-profile', { email })
      .then(res => {
        const p = res.data?.patient
        if (!p) {
          setError('No profile found. Please complete your profile.')
          return
        }
        setPatient(p)
        setPreview(p.profileImage || '')
        setHmoPreview(p.hmoCardImage || '')
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSavePhoto = async () => {
    if (!patient?.email) return
    setMessage('')
    setError('')
    try {
      await axios.post('http://localhost:3001/patient/profile', {
        email: patient.email,
        profileImage: preview || ''
      })
      setMessage('Profile picture saved')
    } catch {
      setError('Failed to save picture')
    }
  }

  const formatDate = (d) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div className="dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        <h2>Patient Profile</h2>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
<div className="patient-profile-container">
  {/* profile picture */}
  <div className="profile-box profile-image-box">
    <h3>Profile Picture</h3>
    <img
      src={preview || '/default-avatar.png'}
      alt="Profile"
      className="profile-img"
    />
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

  {/* HMO number and card */}
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

  {/* medical history */}
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
        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  );
}

export default PatientProfile;
