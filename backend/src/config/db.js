const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let isConnected = false;
let mongoServer = null;
let connectionPromise = null;

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
        name: 'Test Blood Bank',
        email: 'bloodbank@bloodbank.com',
        passwordHash: defaultPasswordHash,
        role: 'bloodbank',
        isEmailVerified: true
      },
      {
        name: 'Test Hospital',
        email: 'hospital@bloodbank.com',
        passwordHash: defaultPasswordHash,
        role: 'hospital',
        isEmailVerified: true
      },
      {
        name: 'Test Donor',
        email: 'donor@bloodbank.com',
        passwordHash: defaultPasswordHash,
        role: 'donor',
        isEmailVerified: true
      }
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const user = await User.create(u);
        console.log(`Seeded default test user: ${u.email}`);
        
        // Also create profiles if needed
        if (u.role === 'donor') {
          const Donor = require('../models/Donor');
          await Donor.create({
            user: user._id,
            name: user.name,
            phone: '1234567890',
            gender: 'male',
            bloodGroup: 'O+',
            eligibilityStatus: 'eligible'
          });
        }
        if (u.role === 'hospital') {
          const Hospital = require('../models/Hospital');
          await Hospital.create({
            user: user._id,
            hospitalName: u.name,
            approvalStatus: 'approved'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error seeding default test users:', err);
  }
}

async function connectDB() {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }

    try {
      console.log(`Attempting to connect to MongoDB: ${uri}`);
      // Connect with a short timeout to fail fast and trigger fallback if it's local and not running
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      isConnected = true;
      console.log('Connected to local/remote MongoDB successfully.');
    } catch (error) {
      console.warn(`Local MongoDB connection failed: ${error.message}`);
      if (process.env.NODE_ENV === 'development' || uri.includes('127.0.0.1') || uri.includes('localhost')) {
        console.log('Starting in-memory MongoDB server as fallback...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          console.log(`In-memory MongoDB started at: ${mongoUri}`);
          await mongoose.connect(mongoUri);
          isConnected = true;
          console.log('Connected to In-memory MongoDB successfully.');
        } catch (memError) {
          console.error('Failed to start/connect in-memory MongoDB:', memError);
          throw error; // throw original
        }
      } else {
        throw error;
      }
    }

    // Seed the test users in background
    seedUsers();
  })();

  return connectionPromise;
}

module.exports = connectDB;
