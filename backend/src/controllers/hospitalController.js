const asyncHandler = require('../config/asyncHandler');
const Hospital = require('../models/Hospital');

// POST /api/hospital/profile  (hospital only — submit/update profile for review)
const upsertHospitalProfile = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const {
    hospitalName,
    registrationNumber,
    licenseNumber,
    doctorName,
    phone,
    address,
    city,
    state,
    pincode,
  } = req.body;

  if (!hospitalName) {
    return res.status(400).json({
      success: false,
      message: 'hospitalName is required',
      statusCode: 400,
    });
  }

  await Hospital.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      hospitalName,
      registrationNumber,
      licenseNumber,
      doctorName,
      phone,
      address,
      city,
      state,
      pincode,
      approvalStatus: 'pending', // reset to pending on re-submission
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    success: true,
    message: 'Hospital profile submitted for review',
    statusCode: 200,
  });
});

module.exports = { upsertHospitalProfile };
