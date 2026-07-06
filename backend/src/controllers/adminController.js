const asyncHandler = require('../config/asyncHandler');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');

// GET /api/admin/stats  (admin only)
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalBloodbanks, totalHospitals, allRequests, totalDonors] = await Promise.all([
    User.countDocuments({ role: 'bloodbank' }),
    User.countDocuments({ role: 'hospital' }),
    BloodRequest.find({}, { status: 1 }).lean(),
    Donor.countDocuments({}),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      total_bloodbanks: totalBloodbanks,
      total_hospitals: totalHospitals,
      total_requests: allRequests.length,
      pending_requests: allRequests.filter((r) => r.status === 'pending').length,
      fulfilled_requests: allRequests.filter((r) => r.status === 'completed').length,
      total_donors: totalDonors,
    },
    statusCode: 200,
  });
});

// GET /api/admin/bloodbanks  (admin only)
const getBloodbankList = asyncHandler(async (req, res) => {
  const bloodbanks = await User.find({ role: 'bloodbank' })
    .sort({ createdAt: -1 })
    .select('name email isEmailVerified isSuspended createdAt')
    .lean();

  return res.status(200).json({
    success: true,
    data: bloodbanks.map((bb) => ({
      id: bb._id,
      name: bb.name,
      email: bb.email,
      is_email_verified: bb.isEmailVerified,
      suspended: bb.isSuspended,
      created_at: bb.createdAt,
    })),
    statusCode: 200,
  });
});

// GET /api/admin/hospitals  (admin only)
const getHospitalList = asyncHandler(async (req, res) => {
  const [hospitalUsers, hospitalProfiles] = await Promise.all([
    User.find({ role: 'hospital' }).sort({ createdAt: -1 }).select('name email createdAt').lean(),
    Hospital.find({}).select('user hospitalName doctorName city state approvalStatus').lean(),
  ]);

  const profileMap = {};
  for (const h of hospitalProfiles) {
    profileMap[String(h.user)] = h;
  }

  const merged = hospitalUsers.map((u) => {
    const profile = profileMap[String(u._id)] || {};
    return {
      id: u._id,
      name: profile.hospitalName || u.name,
      email: u.email,
      doctor_name: profile.doctorName || null,
      city: profile.city || null,
      state: profile.state || null,
      approval_status: profile.approvalStatus || 'no profile',
      created_at: u.createdAt,
    };
  });

  return res.status(200).json({
    success: true,
    data: merged,
    statusCode: 200,
  });
});

// POST /api/admin/approve-hospital  (admin only)
const approveHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.body;

  if (!hospitalId) {
    return res.status(400).json({
      success: false,
      message: 'hospitalId is required',
      statusCode: 400,
    });
  }

  const result = await Hospital.findOneAndUpdate(
    { user: hospitalId },
    { approvalStatus: 'approved' },
    { new: true }
  );

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Hospital profile not found',
      statusCode: 404,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Hospital approved successfully',
    statusCode: 200,
  });
});

module.exports = { getAdminStats, getBloodbankList, getHospitalList, approveHospital };
