const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { upsertHospitalProfile } = require('../controllers/hospitalController');

const router = express.Router();

router.post('/profile', authenticate, requireRole('hospital'), upsertHospitalProfile);

module.exports = router;
