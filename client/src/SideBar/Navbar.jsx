// Navbar Doctor
import React, { useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import '../Styles/DNavbar.css';
import { SidebarData } from './Sidebar.jsx';
import LogoutButton from './LogoutButton.jsx';

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
          <h3>Menu</h3>
          <IoIcons.IoMdClose onClick={toggle} />
        </div>
        <ul className="sidebar-list">
          {SidebarData.slice(0, SidebarData.length - 2).map((item, index) => (
            <li key={index} className="sidebar-item">
              <Link to={item.path} onClick={() => !open && toggle()}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="sidebar-list sidebar-bottom">
          {SidebarData.slice(-2).map((item, index) => (
            <li key={index} className="sidebar-item">
              <Link to={item.path} onClick={() => !open && toggle()}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="navbar-right">
        <LogoutButton className="logout-btn" />
      </div>
    </>
  );
}