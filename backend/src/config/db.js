const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let isConnected = false;

async function seedUsers() {
  try {
    const User = require('../models/User');
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const defaultPasswordHash = await bcrypt.hash('Password123!', saltRounds);

    const defaultUsers = [
      {
        name: 'Test Admin',
        email: 'admin@bloodbank.com',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        isEmailVerified: true
      },
      {
        name: 'Test Donor',
        email: 'donor@bloodbank.com',
        passwordHash: defaultPasswordHash,
        role: 'donor',
        isEmailVerified: true
      },
      {
        name: 'Test Hospital',
        email: 'hospital@bloodbank.com',
        passwordHash: defaultPasswordHash,
        role: 'hospital',
        isEmailVerified: true
      }
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Seeded default test user: ${u.email}`);
      }
    }
  } catch (err) {
    console.error('Error seeding default test users:', err);
  }
}

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);
  isConnected = true;
  
  // Seed the test users in background
  seedUsers();
}

module.exports = connectDB;

