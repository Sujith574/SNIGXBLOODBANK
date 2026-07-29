const asyncHandler = require('../config/asyncHandler');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');

// GET /api/admin/stats  (admin only)
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalBloodbanks, totalHospitals, allRequests, totalDonors, pendingApprovals] = await Promise.all([
    User.countDocuments({ role: 'bloodbank' }),
    User.countDocuments({ role: 'hospital' }),
    BloodRequest.find({}, { status: 1 }).lean(),
    Donor.countDocuments({}),
    User.countDocuments({ role: { $in: ['bloodbank', 'hospital', 'donor'] }, isApproved: false }),
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
      pending_approvals: pendingApprovals,
    },
    statusCode: 200,
  });
});

// GET /api/admin/pending-users  (admin only)
const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({
    role: { $in: ['bloodbank', 'hospital', 'donor'] },
    isApproved: false,
  })
    .sort({ createdAt: -1 })
    .select('name email role createdAt')
    .lean();

  return res.status(200).json({
    success: true,
    data: pendingUsers.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.createdAt,
    })),
    statusCode: 200,
  });
});

// GET /api/admin/bloodbanks  (admin only)
const getBloodbankList = asyncHandler(async (req, res) => {
  const bloodbanks = await User.find({ role: 'bloodbank' })
    .sort({ createdAt: -1 })
    .select('name email isApproved isSuspended createdAt')
    .lean();

  return res.status(200).json({
    success: true,
    data: bloodbanks.map((bb) => ({
      id: bb._id,
      name: bb.name,
      email: bb.email,
      is_approved: bb.isApproved !== false && !bb.isSuspended,
      suspended: bb.isSuspended,
      created_at: bb.createdAt,
    })),
    statusCode: 200,
  });
});

// GET /api/admin/hospitals  (admin only)
const getHospitalList = asyncHandler(async (req, res) => {
  const [hospitalUsers, hospitalProfiles] = await Promise.all([
    User.find({ role: 'hospital' }).sort({ createdAt: -1 }).select('name email isApproved createdAt').lean(),
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
      is_approved: u.isApproved !== false && profile.approvalStatus !== 'rejected',
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

// POST /api/admin/approve-user  (admin only)
const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId is required',
      statusCode: 400,
    });
  }

  const user = await User.findByIdAndUpdate(userId, { isApproved: true, isSuspended: false }, { new: true });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      statusCode: 404,
    });
  }

  if (user.role === 'hospital') {
    await Hospital.findOneAndUpdate({ user: user._id }, { approvalStatus: 'approved' }, { new: true });
  }

  return res.status(200).json({
    success: true,
    message: 'User approved successfully',
    statusCode: 200,
  });
});

// POST /api/admin/reject-user  (admin only)
const rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId is required',
      statusCode: 400,
    });
  }

  const user = await User.findById(userId).select('_id role');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      statusCode: 404,
    });
  }

  await Promise.all([
    User.deleteOne({ _id: userId }),
    user.role === 'hospital' ? Hospital.deleteOne({ user: userId }) : Promise.resolve(),
    user.role === 'donor' ? Donor.deleteOne({ user: userId }) : Promise.resolve(),
  ]);

  return res.status(200).json({
    success: true,
    message: 'User rejected and removed successfully',
    statusCode: 200,
  });
});

module.exports = {
  getAdminStats,
  getPendingUsers,
  getBloodbankList,
  getHospitalList,
  approveHospital,
  approveUser,
  rejectUser,
};
