//Sidebar Doctor

import React from 'react'
import * as FaIcons from "react-icons/fa"
import * as IoIcons from "react-icons/io"
import * as AiIcons from "react-icons/ai"
import { IoInformationOutline } from "react-icons/io5";
import { IoLogOutOutline } from "react-icons/io5";


export const SidebarData = [
    {
        title: 'Home',
        path: '/dashboard',
        icon: <AiIcons.AiFillHome />,
        cName: 'nav-text'
    },

    {
        title: 'Booking Logs',
        path: '/DoctorLogs',
        icon: <FaIcons.FaBook />,
        cName: 'nav-text'
    },

    {
        title: 'Manage Appointments',
        path: '/Appointments',
        icon: <FaIcons.FaCalendarPlus />,
        cName: 'nav-text'
    },

    


]

