const mongoose = require('mongoose');

const DonorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    age: { type: Number },
    weightKg: { type: Number },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], index: true },
    dateOfBirth: { type: Date },
    address: { type: String },
    state: { type: String },
    district: { type: String },
    city: { type: String },
    pincode: { type: String },
    medicalHistory: { type: String },
    lastDonationDate: { type: Date },
    eligibilityStatus: { type: String, enum: ['eligible', 'temporarily_deferred', 'not_eligible'], default: 'eligible' },
    donationCount: { type: Number, default: 0 },
    profilePictureUrl: { type: String },
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donor', DonorSchema);

