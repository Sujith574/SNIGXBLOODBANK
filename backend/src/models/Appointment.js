const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    appointmentDateTime: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);

