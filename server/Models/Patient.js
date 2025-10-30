const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    name: String,
    email: String,
    firstName: String,
    lastName: String,
    birthday: Date,
    age: Number,
    gender: String,
    contact: String,
    address: String,
    medicalHistory: String,
    hmoNumber: String,
    emergencyName: String,
    emergencyContact: String,
    emergencyAddress: String,
    password: String,
    role: { type: String, enum: ['Patient'], required: true },
    profileImage: { type: String, default: '' },
    hmoCardImage: { type: String, default: '' },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Psychiatrist' }],
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null }
});

const PatientModel = mongoose.model("Patient", PatientSchema);
module.exports = PatientModel;
