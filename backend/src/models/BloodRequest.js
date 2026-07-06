const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
    unitsRequired: { type: Number, required: true },
    // hospitalId references the User._id of the hospital account
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorName: { type: String, trim: true },
    emergencyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    reason: { type: String },
    requiredDate: { type: Date },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
