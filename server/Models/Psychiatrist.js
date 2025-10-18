const mongoose = require('mongoose');

const PsychiatristSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Psychiatrist'], required: true },

  // Added profile fields
  fees: { type: Number, default: 0 },
  experience: { type: String, default: '' },
  education: { type: [String], default: [] },
  about: { type: String, default: '' },
  address1: { type: String, default: '' },
  address2: { type: String, default: '' },
  profileImage: { type: String, default: '' } // store image as URL/base64
});

module.exports = mongoose.model("Psychiatrist", PsychiatristSchema);
