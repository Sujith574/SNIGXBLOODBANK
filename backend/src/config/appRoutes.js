const express = require('express');
const authRoutes = require('../routes/authRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const inventoryRoutes = require('../routes/inventoryRoutes');
const requestRoutes = require('../routes/requestRoutes');
const donorRoutes = require('../routes/donorRoutes');
const hospitalRoutes = require('../routes/hospitalRoutes');
const adminRoutes = require('../routes/adminRoutes');
const searchRoutes = require('../routes/searchRoutes');

function registerRoutes(app) {
  const router = express.Router();

  // Auth
  router.use('/auth', authRoutes);

  // Dashboard (role-based stats)
  router.use('/dashboard', dashboardRoutes);

  // Blood Inventory management (blood banks)
  router.use('/blood-inventory', inventoryRoutes);

  // Blood Requests (hospitals create; blood banks fulfill)
  router.use('/blood-requests', requestRoutes);

  // Donor Registry (blood banks)
  router.use('/donors', donorRoutes);

  // Hospital profile management
  router.use('/hospital', hospitalRoutes);

  // Admin routes
  router.use('/admin', adminRoutes);

  // Blood availability search
  router.use('/blood', searchRoutes);

  app.use('/api', router);
}

module.exports = registerRoutes;
