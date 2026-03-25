const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
router.route('/').get(protect, c.getStudents).post(protect, c.createStudent);
router.route('/:id').get(protect, c.getStudent).put(protect, c.updateStudent).delete(protect, c.deleteStudent);
module.exports = router;
