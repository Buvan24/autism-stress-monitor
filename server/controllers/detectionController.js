const StressLog = require('../models/StressLog');
const Alert = require('../models/Alert');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

exports.createDetection = async (req, res) => {
  try {
    const { student_id, stress_level, confidence, timestamp, features, image_data, session_id } = req.body;

    if (!student_id || !stress_level || confidence === undefined)
      return res.status(400).json({ message: 'Missing required fields' });

    // Save image if provided
    let image_path = '';
    if (image_data) {
      const dir = path.join(__dirname, '../../captures');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `${student_id}_${Date.now()}.jpg`;
      const base64 = image_data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, 'base64'));
      image_path = `/captures/${filename}`;
    }

    const log = await StressLog.create({
      student_id, stress_level,
      confidence: parseFloat(confidence),
      features: features || {},
      image_path,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      session_id: session_id || ''
    });

    // Auto-create alert if HIGH stress
    let alert = null;
    if (stress_level === 'High') {
      const student = await Student.findOne({ student_id });
      const name = student ? student.name : student_id;
      alert = await Alert.create({
        student_id, student_name: name,
        alert_message: `HIGH STRESS DETECTED — Student: ${name} (${student_id}) | Confidence: ${(confidence*100).toFixed(0)}%`,
        alert_type: 'HIGH_STRESS',
        stress_level, confidence: parseFloat(confidence)
      });
    }

    res.status(201).json({ success: true, data: log, alert: alert ? { created: true } : null });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getLatestDetections = async (req, res) => {
  try {
    const students = await Student.find({ monitoring_active: true });
    const latest = await Promise.all(students.map(async s => {
      const log = await StressLog.findOne({ student_id: s.student_id }).sort({ timestamp: -1 });
      return { student_id: s.student_id, name: s.name, classroom: s.classroom, latest_detection: log };
    }));
    res.json({ success: true, data: latest });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
