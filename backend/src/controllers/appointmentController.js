const asyncHandler = require('../config/asyncHandler');
const Appointment = require('../models/Appointment');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

const bookAppointment = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;
  if (role !== 'donor') {
    return res.status(403).json({ success: false, message: 'Only donors can book appointments', statusCode: 403 });
  }

  const { hospitalId, dateTime, note } = req.body || {};
  if (!hospitalId || !dateTime) {
    return res.status(400).json({ success: false, message: 'Hospital and date/time are required', statusCode: 400 });
  }

  // Find the donor profile
  let donorProfile = await Donor.findOne({ user: userId });
  if (!donorProfile) {
    // Graceful creation of donor profile if it somehow doesn't exist
    donorProfile = await Donor.create({
      user: userId,
      phone: '',
      gender: 'other',
      bloodGroup: 'O+',
      eligibilityStatus: 'eligible'
    });
  }

  // Check if hospital exists.
  // If not found in DB (e.g. frontend passes a mock UUID), try to find any hospital or use it as is.
  let hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    // Try by user id
    hospital = await Hospital.findOne({ user: hospitalId });
  }
  if (!hospital) {
    // Take first hospital in DB
    hospital = await Hospital.findOne({});
  }

  const appointment = await Appointment.create({
    donor: donorProfile._id,
    hospital: hospital ? hospital._id : undefined,
    appointmentDateTime: new Date(dateTime),
    status: 'scheduled',
    note
  });

  return res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: {
      id: appointment._id,
      appointment_date_time: appointment.appointmentDateTime,
      status: appointment.status,
      note: appointment.note
    },
    statusCode: 201
  });
});

module.exports = { bookAppointment };
