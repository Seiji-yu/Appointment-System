require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PsychiatristModel = require('./Models/Psychiatrist');
const PatientModel = require('./Models/Patient');
const AppointmentModel = require('./Models/Appointment');
const LicenseRequestModel = require('./Models/License'); // unify model usage
const NotificationModel = require('./Models/Notification');
const AvailabilityModel = require('./Models/Availability');
const crypto = require('crypto');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }

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
          const newReq = await LicenseRequestModel.create({
            doctorEmail: user.email,
            licenseNumber: supplied,
            status: 'pending'
          });
          // Notify connected admin clients
          sseBroadcast('license_request_pending', {
            id: newReq._id,
            doctorEmail: user.email,
            licenseNumber: supplied,
            createdAt: newReq.createdAt
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
  d.setHours(0, 0, 0, 0);
  return d;
}
function nowHHMMLocal() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

// Round up an HH:mm string to the next step minute (default: 5 mins)
function roundUpHHMM(hhmm, step = 5) {
  try {
    const mins = toMinutes(hhmm);
    const rounded = Math.ceil(mins / step) * step;
    // clamp to 23:59 max to keep within the day
    const capped = Math.min(rounded, (24 * 60) - 1);
    return fromMinutes(capped);
  } catch {
    return hhmm;
  }
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
    const { date, slot, as } = req.query;

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

    const availability = await AvailabilityModel.findOne({
      doctor: new mongoose.Types.ObjectId(doctorId),
      date: day
    });

    if (!availability || !Array.isArray(availability.ranges) || availability.ranges.length === 0) {
      // return empty for both modes
      return res.json({ status: 'success', slots: [], ranges: [] });
    }

    // Find already booked starts for that day (pending/approved)
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

    // If the client asks for ranges, return only the unbooked ranges (by start time)
    if (String(as) === 'ranges') {
      const startToday = todayStartLocal();
      const now = nowHHMMLocal();
      const nowRounded = roundUpHHMM(now, 5);

      const ranges = availability.ranges
        .filter(r => isValidRange(r))
        .map(r => {
          // For today, trim partially past ranges so they start at the next rounded minute
          if (day.getTime() === startToday.getTime()) {
            if (r.end <= nowRounded) return null; // fully past
            if (r.start < nowRounded) {
              return { ...r, start: nowRounded };
            }
          }
          return r;
        })
        .filter(Boolean)
        // exclude ranges whose start is already booked
        .filter(r => !bookedSet.has(r.start));

      return res.json({ status: 'success', ranges });
    }

    // Default behavior (legacy): generate split slots
    const slotLen = Math.min(Math.max(parseInt(slot, 10) || 60, 5), 240);
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

    const startToday = todayStartLocal();
    let filtered = candidates;
    if (day.getTime() === startToday.getTime()) {
      const now = nowHHMMLocal();
      filtered = candidates.filter(t => t > now);
    }

    const slots = filtered.filter(t => !bookedSet.has(t));
    return res.json({ status: 'success', slots });
  } catch (err) {
    console.error('available-slots error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// List appointments in PDashboard
app.get('/api/appointments', async (req, res) => {
  try {
    const { patientId, patientEmail, status } = req.query;
    const query = {};

    if (patientId) {
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid patientId' });
      }
      query.patient = new mongoose.Types.ObjectId(patientId);
    } else if (patientEmail) {
      const patient = await PatientModel.findOne({ email: patientEmail });
      if (!patient) return res.status(404).json({ status: 'not_found', message: 'Patient not found' });
      query.patient = patient._id;
    }

    if (status) {
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length) query.status = { $in: statuses };
    } else {
      // default to active bookings
      query.status = { $in: ['pending', 'approved'] };
    }

    const items = await AppointmentModel.find(query)
      // include essential doctor fields so patient details can render immediately without extra fetches
      .populate('doctor', 'firstName lastName email contact fees role profileImage specialty experience')
      .populate('patient', 'firstName lastName name email profileImage')
      .sort({ date: -1, updatedAt: -1 });

    return res.json({ status: 'success', appointments: items });
  } catch (err) {
    console.error('List appointments error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});


// Create an appointment (Patient books an appointment with a doctor)
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      doctorId,
      patientEmail,
      date,       
      notes,
      localYMD,    // 'YYYY-MM-DD'
      timeHHMM     // 'HH:mm'
    } = req.body;

    if (!doctorId || !patientEmail || (!date && !(localYMD && timeHHMM))) {
      return res.status(400).json({
        status: 'bad_request',
        message: 'doctorId, patientEmail and appointment date/time are required'
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

    // Build appointment Date in LOCAL time (no unintended offsets)
    let appointmentDate = null;
    if (localYMD && timeHHMM) {
      const base = parseYMDToLocalDate(localYMD);
      const [h, m] = String(timeHHMM).split(':').map(Number);
      if (!base || Number.isNaN(h) || Number.isNaN(m)) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid local date/time' });
      }
      base.setHours(h, m, 0, 0);
      appointmentDate = base;
    } else {
      // fallback to legacy ISO string if still used by any client
      const iso = new Date(date);
      if (isNaN(iso)) {
        return res.status(400).json({ status: 'bad_request', message: 'Invalid appointment date' });
      }
      appointmentDate = iso;
    }

    const now = new Date();
    if (appointmentDate < now) {
      return res.status(400).json({
        status: 'past_date',
        message: 'You cannot book a past date/time.'
      });
    }

    // Limit active bookings with this doctor
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

    // Prevent booking an already taken 30-min start slot
    const slotTaken = await AppointmentModel.exists({
      doctor: doctor._id,
      date: appointmentDate,
      status: { $in: ['pending', 'approved'] }
    });
    if (slotTaken) {
      return res.status(409).json({ status: 'conflict', message: 'This time slot is not available.' });
    }

    const appt = await AppointmentModel.create({
      doctor: doctor._id,
      patient: patient._id,
      date: appointmentDate,
      status: 'pending',
      notes: notes || ''
    });

    const populated = await AppointmentModel.findById(appt._id)
      .populate('patient', 'firstName lastName name email age gender contact')
      // include contact/fees/specialty/experience so PatientAppDetails has full info on redirect
      .populate('doctor', 'firstName lastName email contact fees role profileImage specialty experience');

    // Save and broadcast SSE notification for doctors
    try {
      const patientName = populated?.patient?.name || `${populated?.patient?.firstName || ''} ${populated?.patient?.lastName || ''}`.trim();
      const text = `New appointment from ${patientName || populated?.patient?.email || 'a patient'}`;
      const notif = await NotificationModel.create({
        userType: 'doctor',
        userId: doctor._id,
        type: 'appointment_booked',
        apptId: appt._id,
        doctorId: doctor._id,
        patientId: patient._id,
        text,
        read: false,
        hidden: false,
        meta: { date: populated?.date }
      });
      sseBroadcast('appointment_booked', {
        notifId: String(notif._id),
        apptId: String(appt._id),
        doctorId: String(doctor._id),
        patient: { name: patientName, email: populated?.patient?.email },
        date: populated?.date,
        status: populated?.status || 'pending'
      });
    } catch {}

    return res.json({ status: 'success', appointment: populated });
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

app.get('/api/appointments/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });
  res.write('retry: 10000\n\n');
  sseClients.add(res);

  const timer = setInterval(() => {
    try { res.write('event: ping\ndata: {}\n\n'); } catch {}
  }, 25000);

  req.on('close', () => {
    clearInterval(timer);
    sseClients.delete(res);
  });
});



// Get appointment by id (populated)
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'bad_request', message: 'Invalid appointment id' });
    }

    const appt = await AppointmentModel.findById(id)
      .populate('patient', 'firstName lastName name email age gender contact hmoNumber hmoCardImage')
      // include about/experience/education so clients can show full profile
  .populate('doctor', 'firstName lastName email contact fees role profileImage specialty experience education about address1 address2');

    if (!appt) return res.status(404).json({ status: 'not_found', message: 'Appointment not found' });

    return res.json({ status: 'success', appointment: appt });
  } catch (err) {
    console.error('Get appointment error:', err);
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
      .populate('patient', 'firstName lastName name email')
      .populate('doctor', 'firstName lastName email');

    if (!updated) return res.status(404).json({ status: 'not_found', message: 'Appointment not found' });

    // Save and broadcast status change to patient
    try {
      const doctorName = `${updated.doctor?.firstName || ''} ${updated.doctor?.lastName || ''}`.trim();
      let text = 'Appointment update';
      if (updated.status === 'approved') text = `Doctor ${doctorName} approved your appointment`;
      else if (updated.status === 'cancelled') text = `Doctor ${doctorName} declined your appointment`;
      else if (updated.status === 'pending') text = `Your appointment is pending`;
      else if (updated.status === 'completed') text = `Your appointment was completed`;

      const notif = await NotificationModel.create({
        userType: 'patient',
        userId: updated.patient?._id,
        email: updated.patient?.email,
        type: 'appointment_status',
        apptId: updated._id,
        doctorId: updated.doctor?._id,
        patientId: updated.patient?._id,
        text,
        read: false,
        hidden: false,
        meta: { status: updated.status }
      });

      sseBroadcast('appointment_status', {
        notifId: String(notif._id),
        apptId: String(updated._id),
        status: updated.status,
        doctorId: String(updated.doctor?._id || ''),
        doctorName,
        patientId: String(updated.patient?._id || ''),
        patientEmail: updated.patient?.email || '',
        at: new Date().toISOString()
      });
    } catch {}

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
    // return contact as stored (may include country code like +64 22xxxxxxx)
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
      specialty,
      education,
      about,
      address1,
      contact,
      profileImage
    } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email required to update profile' });
    }

    // Normalize contact to keep "+", digits and spaces only, and collapse multiple spaces
    const normalizedContact = String(contact ?? '')
      .replace(/[^\d+ ]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const updatedDoctor = await PsychiatristModel.findOneAndUpdate(
      { email },
      {
        firstName,
        lastName,
        fees,
        experience,
        specialty,
        education,
        about,
        address1,
        // Persist in international format, e.g., "+64 221234567"
        contact: normalizedContact,
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

// doctors list with average rating and count (computed from Appointment documents)
app.get('/api/doctors/with-ratings', async (req, res) => {
  try {
    const agg = await AppointmentModel.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: '$doctor', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
    ]);

    const ratingMap = {};
    for (const a of agg) {
      ratingMap[String(a._id)] = { avgRating: Number(a.avgRating.toFixed(2)), ratingCount: a.ratingCount };
    }

    const doctors = await PsychiatristModel.find({}, { password: 0 }).lean();
    const result = doctors.map(d => {
      const meta = ratingMap[String(d._id)] || { avgRating: null, ratingCount: 0 };
      return Object.assign({}, d, { avgRating: meta.avgRating, ratingCount: meta.ratingCount });
    });

    return res.json({ status: 'success', doctors: result });
  } catch (err) {
    console.error('Error fetching doctors with ratings:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
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
      {
        $match: {
          doctor: new mongoose.Types.ObjectId(doctorId),
          status: { $in: ['completed', 'Completed'] }
        }
      },
      { $sort: { date: -1, updatedAt: -1 } },
      {
        $group: {
          _id: '$patient',
          lastAppointmentDate: { $first: '$date' }
        }
      },
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

    // Load the request we are updating first to know the doctor context
    const reqDoc = await LicenseRequestModel.findById(id);
    if (!reqDoc) {
      return res.status(404).json({ status: 'not_found', message: 'License request not found' });
    }

    let autoRevoked = 0;
    if (status === 'approved') {
      // Ensure only ONE approved license per doctorEmail at any time
      const revokeNote = `Auto-revoked on ${new Date().toISOString()} in favor of ${reqDoc.licenseNumber}`;
      const revokeRes = await LicenseRequestModel.updateMany(
        {
          doctorEmail: reqDoc.doctorEmail,
          status: 'approved',
          _id: { $ne: reqDoc._id }
        },
        { $set: { status: 'rejected', note: revokeNote } }
      );
      autoRevoked = revokeRes?.modifiedCount || 0;
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
      request: updated,
      autoRevoked
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

// -------- Password reset (forgot password) --------
function buildAppBaseUrl(req) {
  const origin = req.headers.origin || '';
  if (origin) return origin; // e.g., http://localhost:5173
  // fallback to localhost client default
  return 'http://localhost:5173';
}

function buildAppBaseUrl(req) {
  return process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
}

async function getMailerTransport() {
  if (!nodemailer) throw new Error('nodemailer not installed');
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT) || 587;
    const secure = port === 465;
    const user = String(SMTP_USER).trim();
    const pass = String(SMTP_PASS).replace(/\s+/g, '').trim();
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: {
        user,
        // strip any spaces pasted from Google’s UI and trim
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    try {
      await transport.verify();
      const masked = user.replace(/(.{2}).+(@.*)/, '$1***$2');
      console.log('[mailer] Using SMTP transport:', SMTP_HOST, 'port', port, 'secure', secure, 'user', masked);
    } catch (e) {
      console.error('[mailer] SMTP verify failed:', e.response || e.message);
    }
    return transport;
  }
  // Dev fallback: Ethereal
  const test = await nodemailer.createTestAccount();
  console.log('[mailer] Using Ethereal dev inbox');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass }
  });
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Request password reset (always respond success to avoid account enumeration)
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const emailRaw = (req.body?.email || '').trim();
    if (!emailRaw) return res.json({ status: 'success' });

    // Find user in either collection
    const ci = new RegExp(`^${escapeRegex(emailRaw)}$`, 'i');
    let user = await PsychiatristModel.findOne({ email: ci });
    let userType = 'psych';
    if (!user) { user = await PatientModel.findOne({ email: ci }); userType = 'patient'; }
    if (!user) return res.json({ status: 'success' });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    user.resetTokenHash = hash;
    user.resetTokenExpires = expires;
    await user.save();

    // Send email
    try {
      const transport = await getMailerTransport();
      const base = buildAppBaseUrl(req);
      const link = `${base}/reset-password?token=${token}`;
      const info = await transport.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@telepsychiatrist.local',
        to: emailRaw,
        subject: 'Password reset instructions',
        text: `You requested a password reset. Use the link below within 15 minutes.\n\n${link}\n\nIf you did not request this, ignore this message.`,
        html: `<p>You requested a password reset.</p><p><a href="${link}">Reset your password</a> (valid for 15 minutes)</p><p>If you didn't request this, you can ignore this email.</p>`
      });
      const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
      return res.json({ status: 'success', preview });
    } catch (e) {
      console.error('Mailer error:', e.message);
      // Still return success to client to avoid enumeration
      return res.json({ status: 'success' });
    }
  } catch (err) {
    console.error('forgot-password error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Reset password using token
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ status: 'bad_request', message: 'Missing token or password' });
    }
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    // look in both collections
    let user = await PsychiatristModel.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: now } });
    let userModel = 'psych';
    if (!user) { user = await PatientModel.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: now } }); userModel = 'patient'; }
    if (!user) return res.status(400).json({ status: 'invalid_token', message: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(String(password), 10);
    user.password = hashed;
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    return res.json({ status: 'success' });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Change password with current password verification
app.post('/change-password', async (req, res) => {
  try {
    const { email, userId, currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.json({ status: 'bad_request', message: 'Missing current or new password' });
    }

    // Find user by email (case-insensitive) or by id across both collections
    let user = null;
    if (email) {
      const ci = new RegExp(`^${escapeRegex(String(email).trim())}$`, 'i');
      user = await PsychiatristModel.findOne({ email: ci }) || await PatientModel.findOne({ email: ci });
    } else if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await PsychiatristModel.findById(userId) || await PatientModel.findById(userId);
      }
    }

    if (!user) {
      return res.json({ status: 'not_found', message: 'User not found' });
    }

    // Verify current password
    const ok = await bcrypt.compare(String(currentPassword), String(user.password || ''));
    if (!ok) {
      return res.json({ status: 'wrong_password', message: 'Current password is incorrect' });
    }

    // Update to new hash
    const hashed = await bcrypt.hash(String(newPassword), 10);
    user.password = hashed;
    await user.save();

    return res.json({ status: 'success' });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

const sseClients = new Set();

function sseBroadcast(event, payload) {
  const line = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try { res.write(line); } catch { }
  }
}

app.get('/api/license-requests/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });
  res.write('retry: 10000\n\n'); // client auto-reconnect
  sseClients.add(res);

  // heartbeat to keep connection alive
  const timer = setInterval(() => {
    try { res.write('event: ping\ndata: {}\n\n'); } catch { }
  }, 25000);

  req.on('close', () => {
    clearInterval(timer);
    sseClients.delete(res);
  });
});

// Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const { userType, userId, email, limit = '50', view = 'visible' } = req.query;
    if (!userType || !['doctor','patient'].includes(String(userType))) {
      return res.status(400).json({ status: 'bad_request', message: 'userType required (doctor|patient)' });
    }
    let uid = userId;
    if (!uid && userType === 'patient' && email) {
      const pat = await PatientModel.findOne({ email: String(email) }).select('_id');
      if (pat) uid = String(pat._id);
    }
    if (!uid) return res.json({ status: 'success', notifications: [] });

    const lim = Math.min(Math.max(parseInt(limit,10)||50, 1), 200);
    const findQuery = { userType, userId: uid };
    if (String(view) === 'hidden') findQuery.hidden = true;
    else if (String(view) === 'visible') findQuery.hidden = false; // default
    // view === 'all' -> no hidden filter

    const items = await NotificationModel.find(findQuery)
      .sort({ createdAt: -1 })
      .limit(lim)
      .lean();
    return res.json({ status: 'success', notifications: items });
  } catch (err) {
    console.error('List notifications error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

app.patch('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'bad_request', message: 'Invalid notification id' });
    const { read, hidden } = req.body || {};
    const update = {};
    if (typeof read === 'boolean') update.read = read;
    if (typeof hidden === 'boolean') update.hidden = hidden;
    if (!Object.keys(update).length) return res.status(400).json({ status: 'bad_request', message: 'Nothing to update' });
    const updated = await NotificationModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!updated) return res.status(404).json({ status: 'not_found' });
    return res.json({ status: 'success', notification: updated });
  } catch (err) {
    console.error('Update notification error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'bad_request', message: 'Invalid notification id' });
    const del = await NotificationModel.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ status: 'not_found' });
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { userType, userId, email } = req.body || {};
    if (!userType || !['doctor','patient'].includes(String(userType))) {
      return res.status(400).json({ status: 'bad_request', message: 'userType required (doctor|patient)' });
    }
    let uid = userId;
    if (!uid && userType === 'patient' && email) {
      const pat = await PatientModel.findOne({ email: String(email) }).select('_id');
      if (pat) uid = String(pat._id);
    }
    if (!uid) return res.json({ status: 'success', updated: 0 });
    const r = await NotificationModel.updateMany({ userType, userId: uid, hidden: false, read: false }, { $set: { read: true } });
    return res.json({ status: 'success', updated: r.modifiedCount || 0 });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});
// submit a review for an appointment (rating + optional review text)
app.post('/api/appointments/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'bad_request', message: 'Invalid appointment id' });
    // validate rating 
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ status: 'bad_request', message: 'Rating must be a number between 1 and 5' });
    }

    console.log('Review incoming', { appointmentId: id, rating: numericRating, reviewLength: review ? String(review).length : 0, ip: req.ip });

    // atomically update the appointment 
    const update = { rating: numericRating };
    if (review !== undefined) update.review = String(review);

    try {
      const updated = await AppointmentModel.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true }
      )
        .populate('patient', 'firstName lastName name email')
        .populate('doctor', 'firstName lastName email');

      if (!updated) return res.status(404).json({ status: 'not_found', message: 'Appointment not found' });

      console.log('Review saved (findByIdAndUpdate)', { appointmentId: id });
      return res.json({ status: 'success', appointment: updated });
    } catch (updateErr) {
      console.error('Review update error', updateErr);
      if (updateErr && updateErr.name === 'ValidationError') {
        return res.status(400).json({ status: 'bad_request', message: 'Validation error', details: updateErr.errors });
      }

      try {
        const raw = await AppointmentModel.collection.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: update });
        if (raw.matchedCount === 0) return res.status(404).json({ status: 'not_found', message: 'Appointment not found' });
        console.log('Review saved (raw collection update)', { appointmentId: id, result: raw.result || raw });
        const reloaded = await AppointmentModel.findById(id)
          .populate('patient', 'firstName lastName name email')
          .populate('doctor', 'firstName lastName email');
        return res.json({ status: 'success', appointment: reloaded });
      } catch (rawErr) {
        console.error('Raw update failed', rawErr);
        return res.status(500).json({ status: 'error', message: 'Server error', details: rawErr.message || rawErr });
      }
    }
  } catch (err) {
    console.error('Submit review error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});

// Prints in terminal that server is Running
app.listen(3001, () => {
  console.log('Server is running');
});