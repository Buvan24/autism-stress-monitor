const StressLog = require('../models/StressLog');

exports.getStressLogs = async (req, res) => {
  try {
    const { student_id, stress_level, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (stress_level) filter.stress_level = stress_level;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await StressLog.countDocuments(filter);
    const logs = await StressLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data: logs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getStudentLogs = async (req, res) => {
  try {
    const logs = await StressLog.find({ student_id: req.params.id }).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, data: logs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
