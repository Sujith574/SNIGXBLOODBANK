const mongoose = require('mongoose');

// Blood Inventory tracks per-bloodbank stock per blood group (upsert pattern)
const BloodInventorySchema = new mongoose.Schema(
  {
    bloodbankId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true, index: true },
    unitsAvailable: { type: Number, default: 0 },
    // Legacy fields kept for backward compat
    collectionDate: { type: Date },
    expiryDate: { type: Date },
    status: { type: String, enum: ['available', 'expired', 'reserved'], default: 'available' },
    storageLocation: { type: String, trim: true },
    batchNumber: { type: String },
  },
  { timestamps: true }
);

// Compound unique index: one record per blood group per blood bank
BloodInventorySchema.index({ bloodbankId: 1, bloodGroup: 1 }, { unique: true });

module.exports = mongoose.model('BloodInventory', BloodInventorySchema);
