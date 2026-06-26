const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['blood_request_approved', 'blood_request_rejected', 'appointment_reminder', 'camp_reminder', 'low_stock_alert', 'donation_reminder'], index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);

