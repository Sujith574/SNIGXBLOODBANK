const asyncHandler = require('../config/asyncHandler');
const BloodInventory = require('../models/BloodInventory');
const User = require('../models/User');

// GET /api/blood/availability?blood_group=A+&city=Chennai&state=TN
const searchBloodAvailability = asyncHandler(async (req, res) => {
  const { blood_group, city, state } = req.query;

  // Build filter for inventory
  const inventoryFilter = { unitsAvailable: { $gt: 0 } };
  if (blood_group) inventoryFilter.bloodGroup = blood_group;

  const inventory = await BloodInventory.find(inventoryFilter)
    .populate('bloodbankId', 'name email')
    .lean();

  // Filter by city/state from the bloodbank user's registered details
  // We'll fetch all bloodbank users and do in-memory cross-join
  const bloodbankIds = [...new Set(inventory.map((i) => String(i.bloodbankId?._id || i.bloodbankId)))];
  
  // Get bloodbank users (name, email only needed)
  const bloodbanks = await User.find({ _id: { $in: bloodbankIds }, role: 'bloodbank' })
    .select('name email')
    .lean();
  const bbMap = {};
  for (const bb of bloodbanks) {
    bbMap[String(bb._id)] = bb;
  }

  let results = inventory
    .filter((i) => {
      const bbId = String(i.bloodbankId?._id || i.bloodbankId);
      return bbMap[bbId]; // only include records from valid bloodbanks
    })
    .map((i) => {
      const bbId = String(i.bloodbankId?._id || i.bloodbankId);
      const bb = bbMap[bbId];
      return {
        bloodbank_id: bbId,
        bloodbank_name: bb?.name || 'Unknown',
        blood_group: i.bloodGroup,
        units: i.unitsAvailable,
      };
    });

  // Simple city/state filter (not stored on user currently, but framework ready)
  // Future: join Donor/Bloodbank profile with city/state
  if (city || state) {
    // For now, return all results if city/state is provided since location not on User model
    // A future enhancement can add city/state to the bloodbank profile
  }

  return res.status(200).json({
    success: true,
    data: results,
    statusCode: 200,
  });
});

module.exports = { searchBloodAvailability };
