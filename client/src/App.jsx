import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Auth/Signup'
import Login from './Auth/Login'
import Dashboard from './Pages/DoctorSide/Ddashboard'
import DoctorLogs from './Pages/DoctorSide/DoctorLogs'
import ManageApp from './Pages/DoctorSide/ManageApp'
import Settings from './Pages/Others/Settings'
import About from './Pages/Others/About'
import PatientProfileForm from './Pages/PatientSide/PatientProfileForm'
import PDashboard from './Pages/PatientSide/PDashboard'
import PatientProfile from './Pages/PatientSide/PatientProfile'
import BookApp from './Pages/PatientSide/BookApp'
import DoctorLists from './Pages/PatientSide/DoctorLists'
import AppHistory from './Pages/PatientSide/AppHistory'
import DoctorProfile from './Pages/DoctorSide/DoctorProfile'
import Admin from './Pages/Admin/Admin'
import PatientAppDetails from './Pages/PatientSide/PatientAppDetails'

function App() {

  return (
    <BrowserRouter>
      {/* Routes define which page is shown */}
      <Routes>
        <Route path='/' element={<Signup />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/DoctorLogs' element={<DoctorLogs />} />
        <Route path='/Appointments' element={<ManageApp />} />
        <Route path='/Settings' element={<Settings />} />
        <Route path='/About' element={<About />} />
        <Route path='/PatientForm' element={< PatientProfileForm />} />
        <Route path='/PatientDashboard' element={<PDashboard />} />
        <Route path='/DoctorLists' element={<DoctorLists />} />
        <Route path='/PatientProfile' element={<PatientProfile />} />
        <Route path='/BookApp/:email' element={<BookApp />} /> 
        <Route path='/PatientAppDetails' element={<PatientAppDetails />} />
        <Route path='/AppHistory' element={<AppHistory />} />
        <Route path='/DoctorProfile' element={<DoctorProfile />} />
        <Route path='/Admin' element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
