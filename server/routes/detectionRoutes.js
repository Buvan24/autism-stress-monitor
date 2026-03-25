const express = require('express');
const router = express.Router();
const { createDetection, getLatestDetections } = require('../controllers/detectionController');
router.post('/', createDetection);
router.get('/latest', getLatestDetections);
module.exports = router;
