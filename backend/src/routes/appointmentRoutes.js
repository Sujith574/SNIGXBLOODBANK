const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { bookAppointment } = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', authenticate, requireRole('donor'), bookAppointment);

module.exports = router;
