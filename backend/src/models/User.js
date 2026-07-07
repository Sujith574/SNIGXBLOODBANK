const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'bloodbank', 'hospital', 'donor'], default: 'bloodbank' },

    isEmailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },

    emailVerificationToken: { type: String },
    emailVerificationExpiresAt: { type: Date },

    passwordResetTokenHash: { type: String },
    passwordResetExpiresAt: { type: Date },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

