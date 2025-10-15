import React, { useState } from 'react'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Navbar.css'

function PDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="patient-dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <h1>🎉 Welcome to Your Dashboard!</h1>
        <p className="lead mt-3">
          You have successfully logged in. Enjoy exploring your account!
        </p>
      </div>
    </div>
  )
}

export default PDashboard
