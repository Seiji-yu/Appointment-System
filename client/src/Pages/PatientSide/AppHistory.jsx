import React, { useState } from 'react'
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'

function AppHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main">
        <h1>Appointment History</h1>
        {/* You can add cards, tables, or lists here */}
      </div>
    </div>
  )
}

export default AppHistory
