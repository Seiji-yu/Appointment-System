const mongoose = require('mongoose');

const PsychiatristSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, enum: ['Psychiatrist'], required: true }
});

const PsychiatristModel = mongoose.model("Psychiatrist", PsychiatristSchema);
module.exports = PsychiatristModel;
