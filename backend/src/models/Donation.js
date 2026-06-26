const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
    units: { type: Number, required: true },
    donationDate: { type: Date, default: Date.now },
    collectedBy: { type: String },
    collectionCenter: { type: String },
    healthStatus: { type: String },
    bloodTestResult: { type: String },
    certificateNumber: { type: String, unique: true },
    profileProofUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', DonationSchema);

