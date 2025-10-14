const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PsychiatristModel = require('./Models/Psychiatrist');
const PatientModel = require('./Models/Patient');


const app = express();
app.use(express.json());
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
    const { email, password } = req.body;

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

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({ status: 'success', role: user.role, userId: user._id });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error', details: err.message });
  }
});


app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!password || !email || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    let user;
    if (role === 'Psychiatrist') {
      user = await PsychiatristModel.create({ name, email, password: hashedPassword, role });
    } else if (role === 'Patient') {
      user = await PatientModel.create({ name, email, password: hashedPassword, role });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json(safeUser);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error saving to database', details: err.message });
  }
});

app.listen(3001, () => {
  console.log('Server is running');
});
