import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'  
import PNavbar from '../../SideBar/PNavbar'
import '../../Styles/DoctorList.css'

function DoctorLists() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [favorites, setFavorites] = useState([])
  const [pendingFavs, setPendingFavs] = useState([])
  const navigate = useNavigate()               

  useEffect(() => {
    fetch('http://localhost:3001/api/doctors/with-ratings')
      .then((res) => res.json())
      .then((data) => {
        if (!data) return setDoctors([])
        if (Array.isArray(data)) return setDoctors(data)
        if (data.doctors) return setDoctors(data.doctors)
        return setDoctors([])
      })
      .catch((err) => {
        console.error('Error fetching doctors (with-ratings), falling back to /api/doctors:', err)
        // fallback to plain doctors endpoint
        fetch('http://localhost:3001/api/doctors')
          .then((r) => r.json())
          .then((d) => setDoctors(d))
          .catch((e) => console.error('Fallback fetch failed:', e))
      })
  }, [])

  useEffect(() => {
    const email = localStorage.getItem('email')
    if (!email) {
      try {
        const raw = localStorage.getItem('favDocs')
        if (raw) setFavorites(JSON.parse(raw).map((id) => String(id)))
      } catch (e) {
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
        setFavorites(favs.map((id) => id.toString()))
      })
      .catch((err) => {
        console.error('Error fetching patient profile for favorites:', err)
        try {
          const raw = localStorage.getItem('favDocs')
          if (raw) setFavorites(JSON.parse(raw).map((id) => String(id)))
        } catch (e) {

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

    // wait for server response before changing the frontend
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
            {/* my favorites section */}
            <h3 className="doctor-subtitle">My Favorites</h3>
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
                        <p className="doctor-role">{doc.specialty ?? '—'}</p>
                        <p className="doctor-price">₱ {doc.fees ?? '—'} / session</p>
                        <p className="doctor-rating">{doc.avgRating ? `${doc.avgRating} ★ (${doc.ratingCount})` : 'No reviews yet'}</p>
                      </div>

                      <div className="card-action card-action-left">
                        <button
                          className="book-btn"
                          onClick={() => navigate(`/BookApp/${encodeURIComponent(doc.email)}`, { state: { email: doc.email } })}
                        >
                          Book Now
                        </button>
                      </div>

                      {/* show star in the My Favorites section */}
                      <div className="card-action card-action-right">
                        {(() => {
                          const id = String(doc._id)
                          const isPending = pendingFavs.includes(id)
                          return (
                              <button
                                className={`fav-btn ${favorites.includes(id) ? 'filled' : 'hollow'}`}
                                onClick={() => toggleFavorite(doc._id)}
                                disabled={isPending}
                                aria-pressed={favorites.includes(id)}
                                title={favorites.includes(id) ? 'Remove favorite' : 'Add favorite'}
                              >
                                {isPending ? '...' : (favorites.includes(id) ? '★' : '☆')}
                              </button>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* other doctors section */}
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
                      <p className="doctor-role">{doc.specialty ?? '—'}</p>
                      <p className="doctor-price">₱ {doc.fees ?? '—'} / session</p>
                      <p className="doctor-rating">{doc.avgRating ? `${doc.avgRating} ★ (${doc.ratingCount})` : 'No reviews yet'}</p>
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
                                className={`fav-btn ${favorites.includes(id) ? 'filled' : 'hollow'}`}
                                onClick={() => toggleFavorite(doc._id)}
                                disabled={isPending}
                                aria-pressed={favorites.includes(id)}
                                title={favorites.includes(id) ? 'Remove favorite' : 'Add favorite'}
                              >
                                {isPending ? '...' : (favorites.includes(id) ? '★' : '☆')}
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
