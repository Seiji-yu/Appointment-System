//Sidebar Patient

import React from 'react'
import * as FaIcons from 'react-icons/fa'
import * as AiIcons from 'react-icons/ai'
import { IoInformationOutline } from "react-icons/io5";
import { IoLogOutOutline } from "react-icons/io5";

export const PSidebar = [

    {
        title: 'Home',
        path: '/PatientDashboard',
        icon: <AiIcons.AiFillHome />,
        cName: 'nav-text'
    },
    {
        title: 'Book An Appointment',
        path: '/DoctorLists',
        icon: <FaIcons.FaBookmark />,
        cName: 'nav-text'
    },
    {
        title: 'Appointment History',
        path: '/AppHistory',
        icon: <AiIcons.AiOutlineHistory />,
        cName: 'nav-text'
    },
    
]
