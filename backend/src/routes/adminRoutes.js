const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const {
  getAdminStats,
  getBloodbankList,
  getHospitalList,
  approveHospital,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require admin role
router.get('/stats', authenticate, requireRole('admin'), getAdminStats);
router.get('/bloodbanks', authenticate, requireRole('admin'), getBloodbankList);
router.get('/hospitals', authenticate, requireRole('admin'), getHospitalList);
router.post('/approve-hospital', authenticate, requireRole('admin'), approveHospital);

module.exports = router;
