import React, { useState } from 'react'
import * as FaIcons from "react-icons/fa"
import * as IoIcons from "react-icons/io"
import { Link } from 'react-router-dom'
import '../Styles/Navbar.css'


function Navbar() {

  const [sidebar, setSidebar] = useState(false)

  const showSidebar = () => setSidebar(!sidebar)

  return (

    <div className="navbar">
      <Link to="/dashboard" className='menu-bars'>
        <FaIcons.FaBars onClick={showSidebar} />
      </Link>
      <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
        <ul className='nav-menu-items'>
          <li className="navbar-toggle">
            <Link to="/dashboard" className='menu-bars' onClick={showSidebar}>
              <IoIcons.IoMdClose />
            </Link>
          </li>
        </ul>

      </nav>
    </div>

  );
}

export default Navbar;