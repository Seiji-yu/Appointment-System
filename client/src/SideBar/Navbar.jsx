// Navbar Doctor

import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import '../Styles/Navbar.css';
import { SidebarData } from './Sidebar.jsx';

function Navbar({ sidebarOpen, setSidebarOpen }) {
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <div className="top-navbar">
        <FaIcons.FaBars className="menu-icon" onClick={toggleSidebar} />
        <h2>Dashboard</h2>
        <div className="nav-icons">
          <IoIcons.IoMdNotificationsOutline size={24} />
        </div>
      </div>

      <nav className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <IoIcons.IoMdClose onClick={toggleSidebar} />
        </div>
        <ul className="sidebar-list">
          {SidebarData.slice(0, SidebarData.length - 2).map((item, index) => (
            <li key={index} className="sidebar-item">
              <Link to={item.path}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="sidebar-list sidebar-bottom">
          {SidebarData.slice(-2).map((item, index) => (
            <li key={index} className="sidebar-item">
              <Link to={item.path}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
