const express = require('express');
const authRoutes = require('../routes/authRoutes');

function registerRoutes(app) {
  const router = express.Router();

  router.use('/auth', authRoutes);

  app.use('/api', router);
}

module.exports = registerRoutes;

