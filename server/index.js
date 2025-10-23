const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PsychiatristModel = require('./Models/Psychiatrist');
const PatientModel = require('./Models/Patient');
const AppointmentModel = require('./Models/Appointment');


const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.json());
app.use(cors());

// Hardcoded psychiatrist license (strict match)
const PSYCHIATRIST_LICENSE = '1234-1234-123';

// Database URI
mongoose.connect(
  'mongodb+srv://Patient:pf_BSIT2-3@telepsychiatrist.eilqljn.mongodb.net/Psychiatrist?retryWrites=true&w=majority'
)
  .then(() => console.log('Connected to Atlas'))
  .catch(err => console.error('Error connecting to Atlas:', err));

const bcrypt = require('bcrypt')

app.post('/login', async (req, res) => {
  try {
    const { email, password, role, licenseNumber } = req.body;

    let user = await PsychiatristModel.findOne({ email });
    if (!user) {
      user = await PatientModel.findOne({ email });
    }

    if (!user) {
      return res.json({ status: 'not_found', message: 'User not registered' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ status: 'wrong_password', message: "Password didn't match" });
    }

    if (role && role !== user.role) {
      return res.status(403).json({
        status: 'role_mismatch',
        message: 'Selected role does not match this account'
      })
    }

    // Require license only for psychiatrists
    if (user.role === 'Psychiatrist') {
      const supplied = (licenseNumber || '').trim();
      if (!supplied) {
        return res.json({
          status: 'license_required',
          message: 'License number is required for Psychiatrist Login'
        });
      }
      const pattern = /^\d{4}-\d{4}-\d{3}$/; // Regex for ####-####-###
      if (!pattern.test(supplied)) {
        return res.json({
          status: 'invalid_license_format',
          message: 'Invalide License Format. Use: 1234-1234-123'
        });
      }
      if (supplied != PSYCHIATRIST_LICENSE) {
        return res.json({
          status: 'invalid_license',
          message: 'License Number not Recognized'
        });
      }
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    // Return the user data along with status and role
    return res.json({
      status: 'success',
      role: user.role,
      userId: user._id,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Sign Up
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    if (role === 'Psychiatrist') {
      user = await PsychiatristModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role
      });
    } else if (role === 'Patient') {

      // For patients,  combine firstName + lastName into `name` field
      user = await PatientModel.create({
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role
      });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ status: 'success', user: safeUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error saving to database', details: err.message });
  }
});

// Patient Count in Doctor Dashboard
app.get('/api/patients/count', async (req, res) => {
  try {
    const count = await PatientModel.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error fetching patient count:', err);
    res.status(500).json({ error: 'Database error' });
  }

});


app.get('/api/appointments/stats', async (req, res) => {
  try {
    const now = new Date();

    const upcoming = await AppointmentModel.countDocuments({ date: { $gte: now } });
    const pending = await AppointmentModel.countDocuments({ status: "Pending" });
    const completed = await AppointmentModel.countDocuments({ status: "Completed" });

    res.json({ upcoming, pending, completed });

  } catch (err) {
    console.error('Error fetching appointment stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save/Update Patient Profile Form
app.post('/patient/profile', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      birthday,
      age,
      gender,
      contact,
      address,
      medicalHistory,
      hmoNumber,
      emergencyName,
      emergencyContact,
      emergencyAddress,
      hmoCardImage,
      profileImage 
    } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    // build update object cleanly
    const update = {
      firstName,
      lastName,
      birthday,
      age,
      gender,
      contact,
      address,
      medicalHistory,
      hmoNumber,
      emergencyName,
      emergencyContact,
      emergencyAddress,
      hmoCardImage,
      profileImage
    };

    // filter out undefined values to avoid overwriting existing data
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

    // ensure name field (for compatibility)
    if (firstName && lastName) update.name = `${firstName} ${lastName}`;

    // find by email and update or create if not found
    const updatedPatient = await PatientModel.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({ status: 'success', patient: updatedPatient });
  } catch (err) {
    console.error('Profile save error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error saving profile',
      details: err.message
    });
  }
});

app.post('/patient/check-profile', async (req, res) => {
  try {
    const { email } = req.body;
    const patient = await PatientModel.findOne({ email });
    if (!patient) {
      return res.json({ complete: false });
    }
    // check if all required details are filled
    const isComplete = patient.name && patient.age && patient.gender && patient.contact && patient.address 
    && patient.emergencyName && patient.emergencyContact && patient.emergencyAddress;
    res.json({ complete: !!isComplete });
  } catch (err) {
    res.status(500).json({ complete: false, error: err.message });
  }
});

// check if patient already filled patient form
app.post('/patient/get-profile', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const patient = await PatientModel.findOne({ email });
    res.json({ patient: patient || null });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/doctor/get-profile', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const doctor = await PsychiatristModel.findOne({ email });
    res.json({ doctor: doctor || null });
  } catch (err) {
    console.error('Get doctor profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update doctor profile
app.post('/doctor/profile', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      fees,
      experience,
      education,
      about,
      address1,
      address2,
      profileImage
    } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email required to update profile' });
    }

    const updatedDoctor = await PsychiatristModel.findOneAndUpdate(
      { email },
      {
        firstName,
        lastName,
        fees,
        experience,
        education,
        about,
        address1,
        address2,
        profileImage
      },
      { new: true, upsert: true }
    );

    res.json({ status: 'success', doctor: updatedDoctor });
  } catch (err) {
    console.error('Update doctor profile error:', err);
    res.status(500).json({ status: 'error', message: 'Error updating profile', details: err.message });
  }
});

// doctors list
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await PsychiatristModel.find({}, { password: 0 }); // exclude passwords
    res.json(doctors);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Error fetching doctors' });
  }
});

// Recent patients for a doctor (from completed appointments)
app.get('/api/patients/recent', async (req, res) => {
  try {
    const { doctorId, limit = '6' } = req.query;
    if (!doctorId) {
      return res.status(400).json({ status: 'bad_request', message: 'doctorId is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }
    const lim = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 24);

    const items = await AppointmentModel.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId), status: 'completed' } },
      { $sort: { date: -1, updatedAt: -1 } },
      { $group: { _id: '$patient', lastAppointmentDate: { $first: '$date' } } },
      { $sort: { lastAppointmentDate: -1 } },
      { $limit: lim },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: '_id',
          as: 'patient'
        }
      },
      { $unwind: '$patient' },
      {
        $project: {
          _id: 0,
          patientId: '$_id',
          firstName: '$patient.firstName',
          lastName: '$patient.lastName',
          email: '$patient.email',
          lastAppointmentDate: 1
        }
      }
    ]);

    return res.json({ status: 'success', patients: items });
  } catch (err) {
    console.error('recent patients error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Prints in terminal that server is Running
app.listen(3001, () => {
  console.log('Server is running');
});