import React, { useEffect, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import { PSidebar } from './PSidebar';
import '../Styles/Navbar.css';
import LogoutButton from './LogoutButton.jsx';

export default function PNavbar(props) {
  const [internalOpen, setInternalOpen] = useState(true);
  const open = props?.isOpen ?? internalOpen;

  const toggle = () => {
    if (typeof props?.onToggle === 'function') {
      props.onToggle(!open);
    } else {
      setInternalOpen(!open);
    }
  };

  useEffect(() => {
    document.body.classList.toggle('with-sidebar-open', open);
    document.body.classList.toggle('with-sidebar-collapsed', !open);
    return () => {
      document.body.classList.remove('with-sidebar-open');
      document.body.classList.remove('with-sidebar-collapsed');
    };
  }, [open]);

  return (
    <>
      {/* Top Navbar */}
      <div className="top-navbar">
        <FaIcons.FaBars className="menu-icon" onClick={toggle} />
        <h2>Patient Dashboard</h2>
        <div className="nav-icons">
          <IoIcons.IoMdNotificationsOutline size={24} />
        </div>
      </div>

      {/* Sidebar */}
      <nav className={`sidebar ${open ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h3>Patient Menu</h3>
          {/* Close button */}
          <IoIcons.IoMdClose onClick={toggle} />
        </div>

        <ul className="sidebar-list">
          {PSidebar.slice(0, PSidebar.length - 2).map((item, index) => (
            <li key={index} className="sidebar-item">
              <Link to={item.path}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="sidebar-list sidebar-bottom">
          {PSidebar.slice(-2).map((item, index) => (
            <li key={index} className="sidebar-item">
              <Link to={item.path}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="navbar">
        <div className="navbar-right">
          <LogoutButton className="logout-btn" />
        </div>
      </nav>
    </>
  );
}
