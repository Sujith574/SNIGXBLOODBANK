const asyncHandler = require('../config/asyncHandler');
const Donor = require('../models/Donor');

// GET /api/donors  (bloodbank only — their registered donors)
const getDonors = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const donors = await Donor.find({ bloodbankId: userId })
    .populate('user')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: donors.map((d) => ({
      id: d._id,
      name: d.name || d.user?.name || 'Anonymous',
      phone: d.phone,
      gender: d.gender,
      weight_kg: d.weightKg,
      blood_group: d.bloodGroup,
      date_of_birth: d.dateOfBirth,
      city: d.city,
      state: d.state,
      eligibility_status: d.eligibilityStatus,
    })),
    statusCode: 200,
  });
});

// POST /api/donors/create  (bloodbank only — register a new donor)
const createDonor = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const {
    name,
    phone,
    gender,
    weightKg,
    bloodGroup,
    dateOfBirth,
    address,
    city,
    state,
    district,
    pincode,
    medicalHistory,
  } = req.body;

  if (!bloodGroup) {
    return res.status(400).json({
      success: false,
      message: 'bloodGroup is required',
      statusCode: 400,
    });
  }

  const donor = await Donor.create({
    bloodbankId: userId,
    name,
    phone,
    gender,
    weightKg: weightKg ? Number(weightKg) : undefined,
    bloodGroup,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    address,
    city,
    state,
    district,
    pincode,
    medicalHistory,
  });

  return res.status(201).json({
    success: true,
    message: 'Donor record registered successfully',
    data: { id: donor._id },
    statusCode: 201,
  });
});

module.exports = { getDonors, createDonor };
