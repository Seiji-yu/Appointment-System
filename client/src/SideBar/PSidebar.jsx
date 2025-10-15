//Sidebar Patient

import React from 'react'
import * as FaIcons from 'react-icons/fa'
import * as AiIcons from 'react-icons/ai'
import { IoInformationOutline } from "react-icons/io5";

export const PSidebar = [
    {
        title: 'Home',
        path: '/PatientDashboard',
        icon: <AiIcons.AiFillHome />,
        cName: 'nav-text'
    },
    {
        title: 'List of Doctors',
        path: '/DoctorLists',
        icon: <FaIcons.FaUser />,
        cName: 'nav-text'
    },
    {
        title: 'Book Appointment',
        path: '/BookApp',
        icon: <FaIcons.FaBookmark />,
        cName: 'nav-text'
    },
    {
        title: 'Appointment History',
        path: '/AppHistory',
        icon: <AiIcons.AiOutlineHistory />,
        cName: 'nav-text'
    },

    {
        title: 'Settings',
        path: '/Settings',
        icon: <AiIcons.AiFillSetting />,
        cName: 'nav-text'
    },

    {
        title: 'About',
        path: '/About',
        icon: <IoInformationOutline />,
        cName: 'nav-text'
    },

]
