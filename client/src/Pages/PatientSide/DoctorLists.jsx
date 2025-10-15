import React, { useState } from 'react'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'

function DoctorLists() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        <h2>List of Doctors</h2>
        {/* You can add cards, tables, or lists here */}
      </div>
    </div>
  )
}

export default DoctorLists
