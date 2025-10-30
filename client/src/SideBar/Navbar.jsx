// Navbar Doctor
import React, { useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import '../Styles/DNavbar.css';
import { RiExpandUpDownFill } from "react-icons/ri";
import { SidebarData } from './Sidebar.jsx';

export default function Navbar(props) {

  const [internalOpen, setInternalOpen] = useState(true);
  const isControlled = ('isOpen' in (props || {})) && typeof props.onToggle === 'function';
  const open = isControlled ? props.isOpen : internalOpen;

  const toggle = () => {
    if (isControlled) {
      props.onToggle(!open);
    } else {
      setInternalOpen(!open);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="top-navbar">
        <FaIcons.FaBars className="menu-icon" onClick={toggle} />
        <h2>Dashboard</h2>
        <div className="nav-icons">
          <IoIcons.IoMdNotificationsOutline size={24} />
        </div>
      </div>

      <nav className={`sidebar ${open ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h3>Doctor Menu</h3>
          <IoIcons.IoMdClose onClick={toggle} />
        </div>
        <ul className="sidebar-list">
          {SidebarData
 
            .filter(i => !['About', 'Logout', 'Settings', 'Account Profile'].includes(i.title))
            .map((item, index) => (
              <li key={index} className="sidebar-item">
                <Link to={item.path} onClick={() => !open && toggle()}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
        </ul>

        {/* Bottom user settings card */}
        <div className="sidebar-bottom">
          <Link
            to="/DSettings"
            className="doctor-user-card"
            title="User settings"
            onClick={() => !open && toggle()}
          >
            <div className="doctor-user-avatar" aria-hidden>
              <FaIcons.FaUser />
            </div>
            <div className="doctor-user-meta">
              <div className="doctor-user-name">
                {localStorage.getItem('name') || 'Your Account'}
              </div>
              <div className="doctor-user-email">
                {localStorage.getItem('doctorEmail') || localStorage.getItem('email') || ''}
              </div>
            </div>
            <div className="doctor-user-cta">
              <RiExpandUpDownFill />
            </div>
          </Link>
        </div>
      </nav>
    </>
  );
}