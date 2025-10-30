const mongoose = require('mongoose');

const PsychiatristSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Psychiatrist'], required: true },

  // profile fields
  fees: { type: Number, default: 0 },
  experience: { type: String, default: '' },
  // specialty/discipline (free text or from a preset list)
  specialty: { type: String, default: 'Mental Health' },
  education: { type: [String], default: [] },
  about: { type: String, default: '' },
  address1: { type: String, default: '' },
  // New: explicit contact number field
  contact: { type: String, default: '' },
  profileImage: { type: String, default: '' }
  ,
  // password reset fields
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null }
});

module.exports = mongoose.model("Psychiatrist", PsychiatristSchema);
