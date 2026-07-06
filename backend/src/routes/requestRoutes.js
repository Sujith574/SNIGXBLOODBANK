const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const {
  getAllRequests,
  createRequest,
  getMyRequests,
  fulfillRequest,
} = require('../controllers/requestController');

const router = express.Router();

// Order matters: specific paths before generic
router.get('/my', authenticate, requireRole('hospital'), getMyRequests);
router.post('/fulfill', authenticate, requireRole('bloodbank'), fulfillRequest);
router.get('/', authenticate, getAllRequests);
router.post('/', authenticate, requireRole('hospital'), createRequest);

module.exports = router;
