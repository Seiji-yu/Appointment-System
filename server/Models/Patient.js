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
    password: String,
    role: { type: String, enum: ['Patient'], required: true }
});

const PatientModel = mongoose.model("Patient", PatientSchema);
module.exports = PatientModel;
