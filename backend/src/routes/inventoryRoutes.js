const express = require('express');
const authenticate = require('../middlewares/authenticate');
const requireRole = require('../middlewares/requireRole');
const { getInventory, upsertInventory } = require('../controllers/inventoryController');

const router = express.Router();

router.get('/', authenticate, getInventory);
router.post('/', authenticate, requireRole('bloodbank'), upsertInventory);

module.exports = router;
