const asyncHandler = require('../config/asyncHandler');
const BloodInventory = require('../models/BloodInventory');

// GET /api/blood-inventory  (bloodbank: own inventory; others: all)
const getInventory = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;

  const filter = role === 'bloodbank' ? { bloodbankId: userId } : {};
  const inventory = await BloodInventory.find(filter).lean();

  return res.status(200).json({
    success: true,
    data: inventory.map((i) => ({
      id: i._id,
      blood_group: i.bloodGroup,
      units_available: i.unitsAvailable,
      bloodbank_id: i.bloodbankId,
    })),
    statusCode: 200,
  });
});

// POST /api/blood-inventory  (bloodbank only — upsert stock)
const upsertInventory = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { bloodGroup, units } = req.body;

  if (!bloodGroup || units === undefined || units === null) {
    return res.status(400).json({
      success: false,
      message: 'bloodGroup and units are required',
      statusCode: 400,
    });
  }

  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!validGroups.includes(bloodGroup)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid blood group',
      statusCode: 400,
    });
  }

  await BloodInventory.findOneAndUpdate(
    { bloodbankId: userId, bloodGroup },
    { unitsAvailable: Number(units), updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    success: true,
    message: 'Inventory updated successfully',
    statusCode: 200,
  });
});

module.exports = { getInventory, upsertInventory };
