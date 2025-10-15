const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Psychiatrist',
        required: true,
    },

    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,

    },

    date: {
        type: Date,
        required: true,

    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'completed', 'cancelled'],
        default: 'pending',
    },

    notes: {
        type: String,
    }, 

}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema)