import React, { useEffect, useState } from 'react'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'
import '../../Styles/DoctorList.css'

function DoctorLists() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    fetch('http://localhost:3001/api/doctors')
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error('Error fetching doctors:', err))
  }, [])

  return (
    <div className="dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main doctor-page">
        <h2 className="doctor-title">List of Doctors</h2>

        {doctors.length > 0 ? (
          <div className="doctor-grid">
            {doctors.map((doc) => (
              <div key={doc._id} className="doctor-card">
                {/* doctor picture on left side */}
                <div className="doctor-image">
                  <img
                    src="https://via.placeholder.com/120" // placeholder for now sabi ni bespren
                    alt={`${doc.name}`}
                  />
                </div>

                {/* info + book now on left side*/}
                <div className="doctor-info">
                  <h3 className="doctor-name">{doc.name}</h3>
                  <p className="doctor-role">{doc.role}</p>
                  <p className="doctor-price">₱ — / session</p> {/* placeholder for fees */}

                  <div className="doctor-buttons">
                    <button className="book-btn">Book Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No available doctors as of the moment...</p>
        )}
      </div>
    </div>
  )
}

export default DoctorLists
