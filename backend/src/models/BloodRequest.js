const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
    unitsRequired: { type: Number, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctor: { type: String },
    emergencyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    reason: { type: String },
    requiredDate: { type: Date },
    status: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected', 'completed'], default: 'pending', index: true },
    workflowHistory: [
      {
        status: { type: String },
        byRole: { type: String },
        byUser: { type: mongoose.Schema.Types.ObjectId },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);

