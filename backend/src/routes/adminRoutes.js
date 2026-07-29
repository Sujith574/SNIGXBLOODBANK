const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const {
  getAdminStats,
  getPendingUsers,
  getBloodbankList,
  getHospitalList,
  approveHospital,
  approveUser,
  rejectUser,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require admin role
router.get('/stats', authenticate, requireRole('admin'), getAdminStats);
router.get('/pending-users', authenticate, requireRole('admin'), getPendingUsers);
router.get('/bloodbanks', authenticate, requireRole('admin'), getBloodbankList);
router.get('/hospitals', authenticate, requireRole('admin'), getHospitalList);
router.post('/approve-hospital', authenticate, requireRole('admin'), approveHospital);
router.post('/approve-user', authenticate, requireRole('admin'), approveUser);
router.post('/reject-user', authenticate, requireRole('admin'), rejectUser);

module.exports = router;
