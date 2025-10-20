import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../SideBar/Navbar.jsx';
import '../../Styles/Ddashboard.css';
import '../../Styles/DoctorProfile.css';

function DoctorProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    experience: '',
    fees: '',
    specialty: 'Mental Health',
    education: [''],
    address1: '',
    address2: '',
    about: ''
  });
  const [message, setMessage] = useState('');

  // Fetch doctor info on page load
  useEffect(() => {
    const email = localStorage.getItem('doctorEmail') ||
      localStorage.getItem('email') ||
      form.email;

    if (!email) {
      setMessage('Doctor email missing. Please login again.');
      return;
    }

    axios.post('http://localhost:3001/doctor/get-profile', { email })
      .then(res => {
        const doctor = res.data.doctor;
        if (doctor) {

          setProfilePreview(doctor.profileImage || null);
          
          setForm({
            profile: null,
            profilePreview: doctor.profileImage || null,
            firstName: doctor.firstName || '',
            lastName: doctor.lastName || '',
            email: doctor.email || '',
            password: doctor.password || '', 
            experience: doctor.experience || '',
            fees: doctor.fees || '',
            specialty: 'Mental Health',
            education: doctor.education || [''],
            address1: doctor.address1 || '',
            address2: doctor.address2 || '',
            about: doctor.about || ''
          });
        } else {
          setMessage('No profile data found. Please complete your profile.');
        }
      })
      .catch(err => {
        console.error('Error fetching doctor profile:', err);
        setMessage('Error loading profile data.');
      });
  }, []);

  console.log('Current form state:', form);
  console.log('LocalStorage doctorEmail:', localStorage.getItem('doctorEmail'));
  console.log('LocalStorage email:', localStorage.getItem('email'));


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEducationChange = (index, value) => {
    const newEdu = [...form.education];
    newEdu[index] = value;
    setForm({ ...form, education: newEdu });
  };

  const addEducation = () => {
    setForm({ ...form, education: [...form.education, ''] });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const doctorEmail = form.email || localStorage.getItem('doctorEmail');
    if (!doctorEmail) {
      setMessage('Cannot update profile: email missing.');
      return;
    }

    const dataToSend = {
      email: doctorEmail,
      firstName: form.firstName,
      lastName: form.lastName,
      password: form.password,
      fees: form.fees,
      experience: form.experience,
      education: form.education,
      about: form.about,
      address1: form.address1,
      address2: form.address2,
      profileImage: profilePreview  
    };

    const res = await axios.post('http://localhost:3001/doctor/profile', dataToSend);

    if (res.data.status === 'success') {
      setMessage('Profile saved successfully!');
    } else {
      setMessage('Error saving profile.');
    }
  } catch (err) {
    console.error('Error saving profile:', err);
    setMessage('Error saving profile.');
  }
};


  return (
    <div className={`doctor-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Navbar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className="doctor-main">
        <h2>Doctor Profile</h2>

        {/* Profile Picture Section */}
        <div className="text-center mb-4">
          <div className="profile-picture-container">
            <div className="profile-picture-wrapper">
              <img
                src={profilePreview || '/default-avatar.png'}
                alt="Profile"
                className="profile-picture"
              />
              <label htmlFor="profile-upload" className="profile-upload-overlay">
                <i className="fas fa-camera"></i>
                <span>Edit Photo</span>
              </label>
            </div>
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {profilePreview && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm mt-2"
                onClick={removeProfileImage}
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
          <div className="row">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h3 className="card-title mb-4">Basic Information</h3>
                  <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" value={form.firstName} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" value={form.lastName} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fees (₱)</label>
                    <input type="number" className="form-control" name="fees" value={form.fees} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Experience</label>
                    <input type="text" className="form-control" name="experience" value={form.experience} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h3 className="card-title mb-4">Professional Information</h3>
                  <div className="mb-3">
                    <label className="form-label">Education</label>
                    {form.education.map((edu, index) => (
                      <input
                        key={index}
                        type="text"
                        className="form-control mb-2"
                        value={edu}
                        onChange={(e) => handleEducationChange(index, e.target.value)}
                      />
                    ))}
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addEducation}>
                      + Add Education
                    </button>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Primary Address</label>
                    <input type="text" className="form-control" name="address1" value={form.address1} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Secondary Address</label>
                    <input type="text" className="form-control" name="address2" value={form.address2} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">About</label>
                    <textarea className="form-control" name="about" value={form.about} onChange={handleChange} rows="4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary btn-lg">Save Profile</button>
          </div>
        </form>

        {message && <div className="alert alert-info mt-3 text-center">{message}</div>}
      </main>
    </div>
  );
}

export default DoctorProfile;
