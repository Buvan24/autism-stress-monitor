const express = require('express');
const router = express.Router();
const { getAlerts, acknowledgeAlert, acknowledgeAll, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
router.get('/', protect, getAlerts);
router.put('/acknowledge-all', protect, acknowledgeAll);
router.put('/:id', protect, acknowledgeAlert);
router.delete('/:id', protect, deleteAlert);
module.exports = router;
