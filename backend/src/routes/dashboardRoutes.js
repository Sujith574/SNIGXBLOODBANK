const express = require('express');
const authenticate = require('../middlewares/authenticate');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

// All dashboard routes require authentication
router.get('/stats', authenticate, getDashboardStats);

module.exports = router;
