const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { getDonors, createDonor } = require('../controllers/donorController');

const router = express.Router();

router.get('/', authenticate, requireRole('bloodbank'), getDonors);
router.post('/create', authenticate, requireRole('bloodbank'), createDonor);

module.exports = router;
