const express = require('express');
const router = express.Router();
const { getStressLogs, getStudentLogs } = require('../controllers/stressLogController');
const { protect } = require('../middleware/authMiddleware');
router.get('/', protect, getStressLogs);
router.get('/student/:id', protect, getStudentLogs);
module.exports = router;
