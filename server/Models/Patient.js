const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, enum: ['Patient'], required: true }
});

const PatientModel = mongoose.model("Patient", PatientSchema);
module.exports = PatientModel;
