import React, { useEffect, useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import { PSidebar } from './PSidebar';
import '../Styles/PNavbar.css';
import { RiExpandUpDownFill } from "react-icons/ri";

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
<nav className={`patient-sidebar ${open ? '' : 'collapsed'}`}>
        <div className="patient-sidebar-header">
          <h3>Patient Menu</h3>
          <IoIcons.IoMdClose onClick={toggle} />
        </div>

        <ul className="patient-sidebar-list">
          {PSidebar
            .filter((i) => !['About', 'Logout', 'Settings', 'Account Profile'].includes(i.title))
            .map((item, index) => (
            <li key={index} className="patient-sidebar-item">
              <Link to={item.path}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Bottom user card -> routes to Settings */}
        <div className="patient-sidebar-bottom">
          <Link to="/PSettings" className="patient-user-card" title="User settings">
            <div className="patient-user-avatar" aria-hidden>
              <FaIcons.FaUser />
            </div>
            <div className="patient-user-meta">
              <div className="patient-user-name">{localStorage.getItem('name') || 'Your Account'}</div>
              <div className="patient-user-email">{localStorage.getItem('email') || ''}</div>
            </div>
            <div className="patient-user-cta">
  <RiExpandUpDownFill />
</div>
          </Link>
        </div>
      </nav>

      <nav className="navbar">
      </nav>
    </>
  );
}
