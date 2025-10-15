import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
<<<<<<< HEAD
import Signup from './Auth/Signup'
import Login from './Auth/Login'
import Dashboard from './Pages/DoctorSide/Ddashboard'
import DoctorLogs from './Pages/DoctorSide/DoctorLogs'
import ManageApp from './Pages/DoctorSide/ManageApp'
import Settings from './Pages/Others/Settings'
import About from './Pages/Others/About'
import PatientProfileForm from './Pages/PatientSide/PatientProfileForm'
import PDashboard from './Pages/PatientSide/PDashboard'
import BookApp from './Pages/PatientSide/BookApp'
import DoctorLists from './Pages/PatientSide/DoctorLists'
import AppHistory from './Pages/PatientSide/AppHistory'
=======
import Signup from './Auth/Signup.jsx'
import Login from './Auth/Login.jsx'
import Dashboard from './Pages/Ddashboard'
import PatientProfileForm from './Pages/PatientProfileForm'
import PatientDashboard from './Pages/PDashboard'
>>>>>>> 78f26d55f55ef3828c80996bc0bcec69889ffe11

function App() {

  return (
    <BrowserRouter>
      {/* Routes define which page is shown */}
<<<<<<< HEAD
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
        <Route path='/BookApp' element={<BookApp />} />
        <Route path='/AppHistory' element={<AppHistory />} />
      </Routes>
=======
    <Routes>
      <Route path='/' element={<Signup/>}> </Route>
      <Route path='/register' element={<Signup/>}> </Route>
      <Route path='/login' element={<Login/>}> </Route>
      <Route path='/dashboard' element={<Dashboard/>}> </Route>
      <Route path='/patient/profile' element={<PatientProfileForm/>}> </Route>
      <Route path='/patient/dashboard' element={<PatientDashboard/>}> </Route>
    </Routes>
>>>>>>> 78f26d55f55ef3828c80996bc0bcec69889ffe11
    </BrowserRouter>
  )
}

export default App
