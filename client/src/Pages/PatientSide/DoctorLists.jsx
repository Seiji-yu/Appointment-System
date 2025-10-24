import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'  
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/Ddashboard.css'
import '../../Styles/DoctorList.css'

function DoctorLists() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [favorites, setFavorites] = useState([])
  const [pendingFavs, setPendingFavs] = useState([])
  const navigate = useNavigate()               

  useEffect(() => {
    fetch('http://localhost:3001/api/doctors')
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error('Error fetching doctors:', err))
  }, [])

  // load patient favorites from backend (if logged in). fall back to localStorage when missing
  useEffect(() => {
    const email = localStorage.getItem('email')
    if (!email) {
      // fallback to localStorage favorites for unauthenticated users
      try {
        const raw = localStorage.getItem('favDocs')
        if (raw) setFavorites(JSON.parse(raw).map((id) => String(id)))
      } catch (e) {
        /* ignore */
      }
      return
    }

    fetch('http://localhost:3001/patient/get-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
      .then((res) => res.json())
      .then((data) => {
        const favs = (data.patient && data.patient.favorites) || []
        // normalize to string ids
        setFavorites(favs.map((id) => id.toString()))
      })
      .catch((err) => {
        console.error('Error fetching patient profile for favorites:', err)
        // fallback to localStorage if server request fails
        try {
          const raw = localStorage.getItem('favDocs')
          if (raw) setFavorites(JSON.parse(raw).map((id) => String(id)))
        } catch (e) {
          /* ignore */
        }
      })
  }, [])

  const toggleFavorite = async (docId) => {
    const email = localStorage.getItem('email')
    if (!email) {
      alert('Please login to save favorites')
      return
    }

    const idStr = String(docId)
    const wasFav = favorites.includes(idStr)
    const action = wasFav ? 'remove' : 'add'

    // pessimistic update: mark pending and wait for server response before changing UI
    setPendingFavs((p) => (p.includes(idStr) ? p : [...p, idStr]))

    try {
      const res = await fetch('http://localhost:3001/patient/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, doctorId: idStr, action })
      })
      const data = await res.json()
      console.debug('[toggleFavorite] server response', data)

      if (data.status === 'success') {
        const serverFavs = (data.favorites || []).map((id) => id.toString())
        setFavorites(serverFavs)
        try { localStorage.setItem('favDocs', JSON.stringify(serverFavs)) } catch (e) { /* ignore */ }
      } else {
        console.error('Failed updating favorites:', data)
        alert('Unable to update favorites. Please try again.')
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Network error while updating favorites. Please try again.')
    } finally {
      setPendingFavs((p) => p.filter((id) => id !== idStr))
    }
  }

  return (
    <div className="dashboard">
      <PNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="dashboard-main doctor-page">
        <h2 className="doctor-title">List of Doctors</h2>

        {doctors.length > 0 ? (
          <>
            {/* Favorites section */}
            <h3 className="doctor-subtitle">Favorites</h3>
            <div className="doctor-grid">
              {doctors
                .filter((d) => favorites.includes(String(d._id)))
                .map((doc) => (
                  <div key={`fav-${doc._id}`} className="doctor-card">
                    <div className="card-grid">
                      <div className="card-image">
                        <img
                          src={doc.profileImage || 'https://via.placeholder.com/120'}
                          alt={`${(doc.firstName || '') + ' ' + (doc.lastName || '')}`}
                        />
                      </div>

                      <div className="card-info">
                        <h3 className="doctor-name">{(doc.firstName || '') + ' ' + (doc.lastName || '')}</h3>
                        <p className="doctor-role">{doc.role || 'Psychiatrist'}</p>
                        <p className="doctor-price">₱ {doc.fees ?? '—'} / session</p>
                      </div>

                      <div className="card-action card-action-left">
                        <button
                          className="book-btn"
                          onClick={() => navigate(`/BookApp/${encodeURIComponent(doc.email)}`, { state: { email: doc.email } })}
                        >
                          Book Now
                        </button>
                      </div>

                      {/* show Unfavorite in the Favorites section */}
                      <div className="card-action card-action-right">
                        {(() => {
                          const id = String(doc._id)
                          const isPending = pendingFavs.includes(id)
                          return (
                            <button
                              className="fav-btn"
                              onClick={() => toggleFavorite(doc._id)}
                              disabled={isPending}
                            >
                              {isPending ? '...' : 'Unfavorite'}
                            </button>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Other doctors section */}
            <h3 className="doctor-subtitle">Other Doctors</h3>
            <div className="doctor-grid">
              {doctors.map((doc) => (
                <div key={doc._id} className="doctor-card">
                  <div className="card-grid">
                    <div className="card-image">
                      <img
                        src={doc.profileImage || 'https://via.placeholder.com/120'}
                        alt={`${(doc.firstName || '') + ' ' + (doc.lastName || '')}`}
                      />
                    </div>

                    <div className="card-info">
                      <h3 className="doctor-name">{(doc.firstName || '') + ' ' + (doc.lastName || '')}</h3>
                      <p className="doctor-role">{doc.role || 'Psychiatrist'}</p>
                      <p className="doctor-price">₱ {doc.fees ?? '—'} / session</p>
                    </div>

                    <div className="card-action card-action-left">
                      <button
                        className="book-btn"
                        onClick={() => navigate(`/BookApp/${encodeURIComponent(doc.email)}`, { state: { email: doc.email } })}
                      >
                        Book Now
                      </button>
                    </div>

                    <div className="card-action card-action-right">
                      {(() => {
                        const id = String(doc._id)
                        const isPending = pendingFavs.includes(id)
                        return (
                          <button
                            className="fav-btn"
                            onClick={() => toggleFavorite(doc._id)}
                            disabled={isPending}
                          >
                            {isPending ? '...' : (favorites.includes(id) ? 'Unfavorite' : 'Favorite')}
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>No available doctors as of the moment...</p>
        )}
      </div>
    </div>
  )
}

export default DoctorLists
