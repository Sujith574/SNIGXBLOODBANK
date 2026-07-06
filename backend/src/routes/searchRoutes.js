const express = require('express');
const authenticate = require('../middlewares/authenticate');
const { searchBloodAvailability } = require('../controllers/searchController');

const router = express.Router();

router.get('/availability', authenticate, searchBloodAvailability);

module.exports = router;
