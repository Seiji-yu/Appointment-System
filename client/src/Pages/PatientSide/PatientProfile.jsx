import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'

function PatientProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [patient, setPatient] = useState(null)
  const [preview, setPreview] = useState('')
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
          <div className="card" style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* Photo */}
              <div style={{ minWidth: 160 }}>
                <img
                  src={preview || '/default-avatar.png'}
                  alt="Profile"
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 12, background: '#eee' }}
                />
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    Change
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  <button className="btn btn-primary" onClick={handleSavePhoto}>Save Photo</button>
                </div>
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: 8, columnGap: 12 }}>
                  <div><strong>First Name</strong></div><div>{patient?.firstName || ''}</div>
                  <div><strong>Last Name</strong></div><div>{patient?.lastName || ''}</div>
                  <div><strong>Birthday</strong></div><div>{formatDate(patient?.birthday)}</div>
                  <div><strong>Age</strong></div><div>{patient?.age ?? ''}</div>
                  <div><strong>Gender</strong></div><div>{patient?.gender || ''}</div>
                  <div><strong>Contact</strong></div><div>{patient?.contact || ''}</div>
                  <div><strong>Address</strong></div><div>{patient?.address || ''}</div>
                  <div><strong>Medical History</strong></div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{patient?.medicalHistory || ''}</div>
                </div>
              </div>
            </div>

            {message && <div className="alert alert-info mt-3">{message}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientProfile
