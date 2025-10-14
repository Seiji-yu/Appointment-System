import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import Signup from './Auth/Signup.jsx'
import Login from './Auth/Login.jsx'
import Dashboard from './Pages/Ddashboard'

function App() {
  
  return (
    <BrowserRouter>
      {/* Routes define which page is shown */}
    <Routes>
      <Route path='/' element={<Signup/>}> </Route>
      <Route path='/register' element={<Signup/>}> </Route>
      <Route path='/login' element={<Login/>}> </Route>
      <Route path='/dashboard' element={<Dashboard/>}> </Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App
