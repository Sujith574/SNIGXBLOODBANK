const mongoose = require('mongoose');

const BloodCampSchema = new mongoose.Schema(
  {
    campName: { type: String, required: true, trim: true },
    organizer: { type: String, trim: true },
    venue: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    startDateTime: { type: Date },
    capacity: { type: Number },
    description: { type: String },
    bannerImageUrl: { type: String },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodCamp', BloodCampSchema);

