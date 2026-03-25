const StressLog = require('../models/StressLog');
const Alert = require('../models/Alert');
const Student = require('../models/Student');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const [totalStudents, totalDetections, todayDetections, highCount, modCount, lowCount, unreadAlerts, activeStudents] = await Promise.all([
      Student.countDocuments(),
      StressLog.countDocuments(),
      StressLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow } }),
      StressLog.countDocuments({ stress_level: 'High' }),
      StressLog.countDocuments({ stress_level: 'Moderate' }),
      StressLog.countDocuments({ stress_level: 'Low' }),
      Alert.countDocuments({ acknowledged: false }),
      Student.countDocuments({ monitoring_active: true })
    ]);
    res.json({ success: true, data: { totalStudents, activeStudents, totalDetections, todayDetections, stressDistribution: { High: highCount, Moderate: modCount, Low: lowCount }, unreadAlerts } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDistribution = async (req, res) => {
  try {
    const since = new Date(Date.now() - (req.query.days||7) * 86400000);
    const data = await StressLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$stress_level', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDailyTrend = async (req, res) => {
  try {
    const since = new Date(Date.now() - (req.query.days||7) * 86400000);
    const trend = await StressLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, stress_level: '$stress_level' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);
    const map = {};
    trend.forEach(t => {
      const d = t._id.date;
      if (!map[d]) map[d] = { date: d, Low: 0, Moderate: 0, High: 0 };
      map[d][t._id.stress_level] = t.count;
    });
    res.json({ success: true, data: Object.values(map) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getStudentSummary = async (req, res) => {
  try {
    const data = await StressLog.aggregate([
      { $group: { _id: '$student_id', total: { $sum: 1 }, highCount: { $sum: { $cond: [{ $eq: ['$stress_level','High'] }, 1, 0] } }, avgConfidence: { $avg: '$confidence' }, lastDetection: { $max: '$timestamp' } } },
      { $sort: { highCount: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
