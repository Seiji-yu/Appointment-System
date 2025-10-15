import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as IoIcons from 'react-icons/io';
import { Link } from 'react-router-dom';
import { PSidebar } from './PSidebar';
import '../Styles/Navbar.css';

function PNavbar({ sidebarOpen, setSidebarOpen }) {
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <>
            {/* Top Navbar */}
            <div className="top-navbar">
                <FaIcons.FaBars className="menu-icon" onClick={toggleSidebar} />
                <h2>Patient Dashboard</h2>
                <div className="nav-icons">
                    <IoIcons.IoMdNotificationsOutline size={24} />
                </div>
            </div>

            {/* Sidebar */}
            <nav className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <h3>Patient Menu</h3>
                    {/* Close button */}
                    <IoIcons.IoMdClose onClick={toggleSidebar} />
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
        </>
    );
}

export default PNavbar;
