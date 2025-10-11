const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PsychiatristModel = require('./Models/Psychiatrist');
const PatientModel = require('./Models/Patient');


const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(
  'mongodb+srv://Patient:pf_BSIT2-3@telepsychiatrist.eilqljn.mongodb.net/Psychiatrist?retryWrites=true&w=majority'
)
.then(() => console.log('Connected to Atlas'))
.catch(err => console.error('Error connecting to Atlas:', err));

app.post('/login', (req, res) => {

    const {email, password} = req.body;
    PsychiatristModel.findOne({email:email})
    .then(user => {
        if(user){
            if(user.password === password){
                res.json("Success")
            } else {
                res.json("Password didn't match")
            }
        } else {
            res.json("User not registered")
        }
    })
})



app.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user;
    if (role === 'Psychiatrist') {
      user = await PsychiatristModel.create({ name, email, password, role });
    } else if (role === 'Patient') {
      user = await PatientModel.create({ name, email, password, role });
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    res.json(user);
  } catch (err) {
    console.error('Register error:', err);
    // Return error details for debugging (remove details in production)
    res.status(500).json({ error: 'Error saving to database', details: err.message });
  }
});

app.listen(3001, () => {
  console.log('Server is running');
});
