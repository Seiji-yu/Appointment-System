const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PsychiatristModel = require('./Models/Psychiatrist');
const PatientModel = require('./Models/Patient');
const AppointmentModel = require('./Models/Appointment');
const LicenseRequestModel = require('./Models/License'); // unify model usage
const AvailabilityModel = require('./Models/Availability');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());


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
          message: 'Invalid License Format. Use: 1234-1234-123'
        });
      }
      // Accept either the constant OR an admin-approved license for this doctor
      const existing = await LicenseRequestModel.findOne({
        doctorEmail: user.email,
        licenseNumber: supplied
      });

      if (existing?.status === 'approved') {
        // proceed
      } else if (existing?.status === 'rejected') {
        return res.json({
          status: 'invalid_license',
          message: 'License was rejected. Please enter a different license number.'
        });
      } else if (existing?.status === 'pending') {
        return res.json({
          status: 'invalid_license',
          message: 'Your License Number is Pending'
        });
      } else {
        // No record yet: create a pending request
        try {
          await LicenseRequestModel.create({
            doctorEmail: user.email,
            licenseNumber: supplied,
            status: 'pending'
          });
        } catch (e) {
          if (e.code !== 11000) console.error('Create license request error:', e);
        }
        return res.json({
          status: 'invalid_license',
          message: 'Your License Number is Pending'
        });
      }
    }

    const safeUser = user.toObject();
    delete safeUser.password;

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
    const { doctorId } = req.query;

    const base = {};
    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
      }
      base.doctor = new mongoose.Types.ObjectId(doctorId);
    }

    const [approved, pending, completed] = await Promise.all([
      AppointmentModel.countDocuments({
        ...base,
        status: "approved",
        date: { $gte: now }
      }),
      AppointmentModel.countDocuments({
        ...base,
        status: "pending"
      }),
      AppointmentModel.countDocuments({
        ...base,
        status: "completed"
      }),
    ]);

    res.json({ approved, pending, completed, scopedByDoctor: !!doctorId });
  } catch (err) {
    console.error('Error fetching appointment stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/doctor/:doctorId/stats', async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const base = { doctor: new mongoose.Types.ObjectId(doctorId) };

    const [upcoming, pending, completed] = await Promise.all([
      AppointmentModel.countDocuments({ ...base, status: 'approved', date: { $gte: startOfToday } }),
      AppointmentModel.countDocuments({ ...base, status: 'pending' }),
      AppointmentModel.countDocuments({ ...base, status: 'completed' })
    ]);

    return res.json({ status: 'success', upcoming, pending, completed });
  } catch (err) {
    console.error('doctor stats error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Unique patient count for a doctor (based on any appointment with this doctor)
app.get('/api/doctor/:doctorId/patients/count', async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }

    const ids = await AppointmentModel.distinct('patient', { doctor: new mongoose.Types.ObjectId(doctorId) });
    return res.json({ status: 'success', count: ids.length });
  } catch (err) {
    console.error('doctor patients count error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});


app.get('/api/doctor/:doctorId/appointments/active', async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }

    const items = await AppointmentModel.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      status: { $in: ['pending', 'approved'] }
    })
      .populate('patient', 'firstName lastName name email age gender contact profileImage')
      .sort({ date: -1, updatedAt: -1 });

    return res.json({ status: 'success', appointments: items });
  } catch (err) {
    console.error('List doctor active appointments error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Booking logs (completed + cancelled)
app.get('/api/doctor/:doctorId/appointments/logs', async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }

    const items = await AppointmentModel.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      status: { $in: ['completed', 'cancelled'] }
    })
      .populate('patient', 'firstName lastName name email age gender contact profileImage')
      .sort({ date: -1, updatedAt: -1 });

    return res.json({ status: 'success', appointments: items });
  } catch (err) {
    console.error('List doctor log appointments error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Get appointments for a specific doctor (optionally filter by status)
app.get('/api/doctor/:doctorId/appointments', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.query; // pending | approved | completed | cancelled

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }

    const query = { doctor: new mongoose.Types.ObjectId(doctorId) };
    if (status) {
      const allowed = ['pending', 'approved', 'completed', 'cancelled'];
      if (!allowed.includes(String(status))) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid status filter' });
      }
      query.status = status;
    }

    const items = await AppointmentModel.find(query)
      .populate('patient', 'firstName lastName name email age gender contact profileImage')
      .sort({ date: -1, updatedAt: -1 });

    return res.json({ status: 'success', appointments: items });
  } catch (err) {
    console.error('List doctor appointments error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

function normalizeDateOnly(input) {
  // replaced below
  const d = new Date(input);
  if (isNaN(d)) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(min) {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
function isValidRange(r) {
  return /^\d{2}:\d{2}$/.test(r.start) &&
    /^\d{2}:\d{2}$/.test(r.end) &&
    toMinutes(r.end) > toMinutes(r.start);
}

// Add a safe local parser for 'YYYY-MM-DD'
function parseYMDToLocalDate(ymd) {
  if (typeof ymd !== 'string') return null;
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayStartLocal() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
}
function nowHHMMLocal() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

app.get('/doctor/availability', async (req, res) => {
  try {
    const { email, date } = req.query;
    if (!email || !date) {
      return res.status(400).json({ status: 'bad_request', message: 'email and date are required' });
    }
    const doctor = await PsychiatristModel.findOne({ email });
    if (!doctor) return res.status(404).json({ status: 'not_found', message: 'Doctor not found' });

    const day = parseYMDToLocalDate(String(date));
    if (!day) return res.status(400).json({ status: 'bad_request', message: 'Invalid date' });

    const availability = await AvailabilityModel.findOne({ doctor: doctor._id, date: day });
    return res.json({ status: 'success', availability: availability || null });
  } catch (err) {
    console.error('Get availability error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Save/replace availability for a given date (doctor identifies by email)
app.post('/doctor/availability', async (req, res) => {
  try {
    const { email, date, ranges } = req.body;
    if (!email || !date) {
      return res.status(400).json({ status: 'bad_request', message: 'email and date are required' });
    }
    if (!Array.isArray(ranges)) {
      return res.status(400).json({ status: 'bad_request', message: 'ranges must be an array' });
    }
    for (const r of ranges) {
      if (!isValidRange(r)) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid time range(s). Ensure HH:mm and end > start.' });
      }
    }

    const doctor = await PsychiatristModel.findOne({ email });
    if (!doctor) return res.status(404).json({ status: 'not_found', message: 'Doctor not found' });

    const day = parseYMDToLocalDate(date);
    if (!day) return res.status(400).json({ status: 'bad_request', message: 'Invalid date' });

    const startToday = todayStartLocal();
    if (day < startToday) {
      return res.status(400).json({ status: 'bad_request', message: 'Cannot set availability for past dates.' });
    }

    let finalRanges = ranges;
    if (day.getTime() === startToday.getTime()) {
      const now = nowHHMMLocal();
      // keep ranges that are not fully in the past
      finalRanges = ranges.filter(r => r.end > now);
      if (!finalRanges.length) {
        return res.status(400).json({ status: 'bad_request', message: 'All time ranges are in the past for today.' });
      }
    }

    const doc = await AvailabilityModel.findOneAndUpdate(
      { doctor: doctor._id, date: day },
      { doctor: doctor._id, date: day, ranges: finalRanges },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ status: 'success', availability: doc });
  } catch (err) {
    console.error('Save availability error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Bulk save/replace availability for multiple dates
app.post('/doctor/availability/bulk', async (req, res) => {
  try {
    const { email, dates, ranges } = req.body;
    if (!email || !Array.isArray(dates) || !Array.isArray(ranges)) {
      return res.status(400).json({ status: 'bad_request', message: 'email, dates and ranges are required' });
    }

    const doctor = await PsychiatristModel.findOne({ email });
    if (!doctor) return res.status(404).json({ status: 'not_found', message: 'Doctor not found' });

    const startToday = todayStartLocal();
    const now = nowHHMMLocal();
    let updated = 0;

    for (const ymd of dates) {
      const day = parseYMDToLocalDate(ymd);
      if (!day || day < startToday) continue;

      let dayRanges = ranges;
      if (day.getTime() === startToday.getTime()) {
        dayRanges = ranges.filter(r => r.end > now);
        if (!dayRanges.length) continue;
      }

      await AvailabilityModel.findOneAndUpdate(
        { doctor: doctor._id, date: day },
        { doctor: doctor._id, date: day, ranges: dayRanges },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      updated++;
    }

    return res.json({ status: 'success', updated });
  } catch (err) {
    console.error('Bulk availability error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

app.get('/api/doctor/:doctorId/available-slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, slot } = req.query;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }
    if (!date) {
      return res.status(400).json({ status: 'bad_request', message: 'date is required (YYYY-MM-DD)' });
    }

    const day = parseYMDToLocalDate(String(date));
    if (!day) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid date format' });
    }

    const slotLen = Math.min(Math.max(parseInt(slot, 10) || 60, 5), 240);

    const availability = await AvailabilityModel.findOne({
      doctor: new mongoose.Types.ObjectId(doctorId),
      date: day
    });

    if (!availability || !Array.isArray(availability.ranges) || availability.ranges.length === 0) {
      return res.json({ status: 'success', slots: [] });
    }

    // Build candidate slots from ranges
    const candidates = [];
    for (const r of availability.ranges) {
      if (!isValidRange(r)) continue;
      let startM = toMinutes(r.start);
      const endM = toMinutes(r.end);
      while (startM + slotLen <= endM) {
        candidates.push(fromMinutes(startM));
        startM += slotLen;
      }
    }

    // Filter out past times if querying today
    const startToday = todayStartLocal();
    let filtered = candidates;
    if (day.getTime() === startToday.getTime()) {
      const now = nowHHMMLocal();
      filtered = candidates.filter(t => t > now);
    }

    // Exclude already booked (pending/approved)
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const booked = await AppointmentModel.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      status: { $in: ['pending', 'approved'] },
      date: { $gte: day, $lt: nextDay }
    }).select('date');

    const bookedSet = new Set(
      booked.map(b => {
        const d = new Date(b.date);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      })
    );

    const slots = filtered.filter(t => !bookedSet.has(t));
    return res.json({ status: 'success', slots });
  } catch (err) {
    console.error('available-slots error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});


// Create an appointment (Patient books an appointment with a doctor)
app.post('/api/appointments', async (req, res) => {
  try {
    const { doctorId,
      patientEmail,
      date,
      notes } = req.body;

    if (!doctorId || !patientEmail || !date) {
      return res.status(400).json({
        status: 'bad_request',
        message: 'doctorId, patientEmail and date are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid doctorId' });
    }

    const [doctor, patient] = await Promise.all([
      PsychiatristModel.findById(doctorId),
      PatientModel.findOne({ email: patientEmail })
    ]);

    if (!doctor) return res.status(404).json({ status: 'not_found', message: 'Doctor not found' });
    if (!patient) return res.status(404).json({ status: 'not_found', message: 'Patient not found' });

    // Better date handling
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid appointment date' });
    }

    // Do not allow booking in the past (includes earlier times today)
    const now = new Date();
    if (appointmentDate < now) {
      return res.status(400).json({
        status: 'past_date',
        message: 'You cannot book a past date/time.'
      });
    }

    // Limit to 5 active (pending/approved) bookings PER ACCOUNT (ALL DOCTORS AND DATES)
    const activeWithThisDoctor = await AppointmentModel.countDocuments({
      doctor: doctor._id,
      patient: patient._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (activeWithThisDoctor >= 5) {
      return res.status(409).json({
        status: 'limit_reached',
        message: 'You can have up to 5 active bookings with this doctor.'
      });
    }

    // prevent booking the exact same slot already pending/approved
    const slotTaken = await AppointmentModel.exists({
      doctor: doctor._id,
      date: appointmentDate,
      status: { $in: ['pending', 'approved'] }
    });
    if (slotTaken) {
      return res.status(409).json({
        status: 'conflict',
        message: 'This time slot is not available.'
      });
    }

    // Create appointment
    const appt = await AppointmentModel.create({
      doctor: doctor._id,
      patient: patient._id,
      date: appointmentDate,
      status: 'pending',
      notes: notes || ''
    });

    const populated = await AppointmentModel.findById(appt._id)
      .populate('patient', 'firstName lastName name email age gender contact')
      .populate('doctor', 'firstName lastName email');

    return res.json({ status: 'success', appointment: populated });
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Update appointment status or notes
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid appointment id' });
    }

    const update = {};
    if (status !== undefined) {
      status = String(status).toLowerCase();
      const allowed = ['pending', 'approved', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid status value' });
      }
      update.status = status;
    }
    if (notes !== undefined) update.notes = notes;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ status: 'bad_request', message: 'Nothing to update' });
    }

    const updated = await AppointmentModel.findByIdAndUpdate(id, update, { new: true })
      .populate('patient', 'firstName lastName name email');

    if (!updated) return res.status(404).json({ status: 'not_found', message: 'Appointment not found' });

    return res.json({ status: 'success', appointment: updated });
  } catch (err) {
    console.error('Update appointment error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
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
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId), status: { $in: ['completed', 'Completed'] } } },
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


// List license verification requests (default: pending)
app.get('/api/license-requests', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid status filter' });
    }
    const items = await LicenseRequestModel.find({ status })
      .sort({ createdAt: -1 });
    return res.json({ status: 'success', requests: items });
  } catch (err) {
    console.error('List license requests error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Approve/Reject a request
app.patch('/api/license-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid request id' });
    }
    const allowed = ['approved', 'rejected'];
    if (!allowed.includes(String(status))) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid status value' });
    }

    const updated = await LicenseRequestModel.findByIdAndUpdate(
      id,
      { status, ...(note !== undefined ? { note } : {}) },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: 'not_found',
        message: 'License request not found'
      });
    }

    return res.json({
      status: 'success',
      request: updated
    });
  } catch (err) {
    console.error('Update license request error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Server error',
      details: err.message
    });
  }
});

// Prints in terminal that server is Running
app.listen(3001, () => {
  console.log('Server is running');
});

// add or remove a doctor from patient's favorites
app.post('/patient/favorites', async (req, res) => {
  try {
    const { email, doctorId, action } = req.body;

    if (!email || !doctorId) {
      return res.status(400).json({ status: 'error', message: 'email and doctorId are required' });
    }

    const patient = await PatientModel.findOne({ email });
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient not found' });
    }

    // what to do if favorites is missing
    if (!Array.isArray(patient.favorites)) patient.favorites = [];

    if (action === 'add') {
      if (!patient.favorites.find((id) => id.toString() === doctorId.toString())) {
        patient.favorites.push(doctorId);
      }
    } else if (action === 'remove') {
      patient.favorites = patient.favorites.filter((id) => id.toString() !== doctorId.toString());
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid action. Use "add" or "remove"' });
    }

    await patient.save();

    return res.json({ status: 'success', favorites: patient.favorites });
  } catch (err) {
    console.error('Favorites update error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});