const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    hospitalName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    doctorName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    profilePhotoUrl: { type: String },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectedReason: { type: String },
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', HospitalSchema);

