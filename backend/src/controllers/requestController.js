const asyncHandler = require('../config/asyncHandler');
const BloodRequest = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');

// GET /api/blood-requests  (all active requests)
const getAllRequests = asyncHandler(async (req, res) => {
  const requests = await BloodRequest.find({}).sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    data: requests.map((r) => ({
      id: r._id,
      patient_name: r.patientName,
      blood_group: r.bloodGroup,
      units_required: r.unitsRequired,
      emergency_level: r.emergencyLevel,
      reason: r.reason,
      required_date: r.requiredDate,
      doctor_name: r.doctorName,
      status: r.status,
      hospital_id: r.hospitalId,
    })),
    statusCode: 200,
  });
});

// POST /api/blood-requests  (hospital only — create new request)
const createRequest = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const {
    patientName,
    age,
    gender,
    bloodGroup,
    unitsRequired,
    doctorName,
    emergencyLevel,
    reason,
    requiredDate,
  } = req.body;

  if (!patientName || !bloodGroup || !unitsRequired) {
    return res.status(400).json({
      success: false,
      message: 'patientName, bloodGroup, and unitsRequired are required',
      statusCode: 400,
    });
  }

  const request = await BloodRequest.create({
    patientName,
    age: age ? Number(age) : undefined,
    gender,
    bloodGroup,
    unitsRequired: Number(unitsRequired),
    hospitalId: userId,
    doctorName,
    emergencyLevel: emergencyLevel || 'low',
    reason,
    requiredDate: requiredDate ? new Date(requiredDate) : undefined,
    status: 'pending',
  });

  return res.status(201).json({
    success: true,
    message: 'Blood request published successfully',
    data: { id: request._id },
    statusCode: 201,
  });
});

// GET /api/blood-requests/my  (hospital only — their own requests)
const getMyRequests = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const requests = await BloodRequest.find({ hospitalId: userId })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: requests.map((r) => ({
      id: r._id,
      patient_name: r.patientName,
      blood_group: r.bloodGroup,
      units_required: r.unitsRequired,
      emergency_level: r.emergencyLevel,
      reason: r.reason,
      required_date: r.requiredDate,
      doctor_name: r.doctorName,
      status: r.status,
    })),
    statusCode: 200,
  });
});

// POST /api/blood-requests/fulfill  (bloodbank only)
const fulfillRequest = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { requestId, unitsProvided, bloodGroup } = req.body;

  if (!requestId || !unitsProvided || !bloodGroup) {
    return res.status(400).json({
      success: false,
      message: 'requestId, unitsProvided, and bloodGroup are required',
      statusCode: 400,
    });
  }

  // Fetch the request
  const bloodRequest = await BloodRequest.findById(requestId);
  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found',
      statusCode: 404,
    });
  }

  // Deduct from blood bank inventory
  const stock = await BloodInventory.findOne({
    bloodbankId: userId,
    bloodGroup,
  });

  if (stock) {
    stock.unitsAvailable = Math.max(0, stock.unitsAvailable - Number(unitsProvided));
    await stock.save();
  }

  // Update the request (decrease units remaining and mark completed if fully fulfilled)
  const remaining = Math.max(0, bloodRequest.unitsRequired - Number(unitsProvided));
  bloodRequest.unitsRequired = remaining;
  bloodRequest.status = remaining === 0 ? 'completed' : 'pending';
  await bloodRequest.save();

  return res.status(200).json({
    success: true,
    message: `Successfully provided ${unitsProvided} units of ${bloodGroup}`,
    statusCode: 200,
  });
});

module.exports = { getAllRequests, createRequest, getMyRequests, fulfillRequest };
