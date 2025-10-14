import React from 'react'
import * as FaIcons from "react-icons/fa"
import * as IoIcons from "react-icons/io"
import * as AiIcons from "react-icons/ai"


export const SidebarData = [
    {
        title: 'Home',
        path: '/dashboard',
        icon: <AiIcons.AiFillHome/>,
        cName: 'nav-text'
    },

    {
        title: 'Doctor List',
        path: '/doctors',
        icon: <FaIcons.FaCalendarAlt/>,
        cName: 'nav-text'
    },

    {
        title: 'Appoint Doctor',
        path: '/appointments',
        icon: <FaIcons.FaCalendarPlus/>,
        cName: 'nav-text'
    },

    {
        title: 'Settings',
        path: '/settings',
        icon: <IoIcons.IoMdSettings/>,
        cName: 'nav-text'
    },

    {
        title: 'About',
        path: '/about',
        icon: <IoIcons.IoInformationOutline/>,
        cName: 'nav-text'
    },

]

