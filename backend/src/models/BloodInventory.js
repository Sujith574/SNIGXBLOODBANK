const mongoose = require('mongoose');

const BloodInventorySchema = new mongoose.Schema(
  {
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true, index: true },
    unitsAvailable: { type: Number, default: 0 },
    collectionDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['available', 'expired', 'reserved'], default: 'available' },
    storageLocation: { type: String, trim: true },
    batchNumber: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodInventory', BloodInventorySchema);

