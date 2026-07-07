const asyncHandler = require('../config/asyncHandler');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

// GET /api/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;

  if (role === 'bloodbank') {
    const [inventory, activeRequests, donors] = await Promise.all([
      BloodInventory.find({ bloodbankId: userId }).lean(),
      BloodRequest.find({ status: { $ne: 'completed' } })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
      Donor.find({ bloodbankId: userId }).limit(10).lean(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        inventory: inventory.map((i) => ({
          blood_group: i.bloodGroup,
          units_available: i.unitsAvailable,
        })),
        requests: activeRequests.map((r) => ({
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
        donors: donors.map((d) => ({
          id: d._id,
          phone: d.phone,
          gender: d.gender,
          weight_kg: d.weightKg,
          blood_group: d.bloodGroup,
          date_of_birth: d.dateOfBirth,
          city: d.city,
        })),
      },
      statusCode: 200,
    });
  }

  if (role === 'hospital') {
    const [requests, hospitalProfile] = await Promise.all([
      BloodRequest.find({ hospitalId: userId }).sort({ createdAt: -1 }).limit(15).lean(),
      Hospital.findOne({ user: userId }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        requests: requests.map((r) => ({
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
        hospitalInfo: hospitalProfile
          ? { is_approved: hospitalProfile.approvalStatus === 'approved' }
          : { is_approved: false },
      },
      statusCode: 200,
    });
  }

  if (role === 'admin') {
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
  }

  if (role === 'donor') {
    let donorProfile = await Donor.findOne({ user: userId }).lean();
    if (!donorProfile) {
      // Create dynamically if not found
      const newDonor = await Donor.create({
        user: userId,
        phone: '',
        gender: 'other',
        bloodGroup: 'O+',
        eligibilityStatus: 'eligible',
      });
      donorProfile = newDonor.toObject();
    }

    const [appointments, activeRequests] = await Promise.all([
      Appointment.find({ donor: donorProfile._id })
        .populate('hospital')
        .sort({ appointmentDateTime: -1 })
        .limit(10)
        .lean(),
      BloodRequest.find({ status: { $ne: 'completed' } })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        eligibility: {
          eligibility_status: donorProfile.eligibilityStatus || 'eligible',
        },
        appointments: appointments.map((a) => ({
          id: a._id,
          appointment_date_time: a.appointmentDateTime,
          status: a.status || 'scheduled',
          note: a.note || '',
          hospital_name: a.hospital?.hospitalName || 'Metro General Hospital',
        })),
        requests: activeRequests.map((r) => ({
          id: r._id,
          patient_name: r.patientName,
          blood_group: r.bloodGroup,
          units_required: r.unitsRequired,
          emergency_level: r.emergencyLevel,
          reason: r.reason,
          required_date: r.requiredDate,
        })),
      },
      statusCode: 200,
    });
  }

  return res.status(400).json({ success: false, message: 'Unknown role', statusCode: 400 });
});

module.exports = { getDashboardStats };
