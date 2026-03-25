const User = require('../models/User');
const Student = require('../models/Student');
const StressLog = require('../models/StressLog');
const Alert = require('../models/Alert');

module.exports = async function seedData() {
  try {
    // Admin user
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@stressmonitor.com',
        password: 'admin123',
        full_name: 'System Administrator',
        role: 'admin'
      });
      console.log('✅ Admin created: admin / admin123');
    }

    // Sample students
    const count = await Student.countDocuments();
    if (count === 0) {
      const students = [
        { student_id: 'S101', name: 'Alex Johnson',   age: 8,  classroom: 'Class A', guardian_name: 'Mary Johnson',  guardian_phone: '555-0101', is_autistic: true  },
        { student_id: 'S102', name: 'Emma Williams',  age: 10, classroom: 'Class A', guardian_name: 'Tom Williams',   guardian_phone: '555-0102', is_autistic: false },
        { student_id: 'S103', name: 'Liam Davis',     age: 9,  classroom: 'Class B', guardian_name: 'Susan Davis',    guardian_phone: '555-0103', is_autistic: true  },
        { student_id: 'S104', name: 'Olivia Brown',   age: 7,  classroom: 'Class B', guardian_name: 'James Brown',    guardian_phone: '555-0104', is_autistic: false },
        { student_id: 'S105', name: 'Noah Martinez',  age: 11, classroom: 'Class C', guardian_name: 'Lisa Martinez',  guardian_phone: '555-0105', is_autistic: true  },
      ];
      await Student.insertMany(students);
      console.log('✅ Sample students created');

      // Sample stress logs
      const levels = ['Low', 'Moderate', 'High'];
      const logs = [];
      for (let i = 0; i < 60; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)];
        const student = students[Math.floor(Math.random() * students.length)];
        logs.push({
          student_id: student.student_id,
          stress_level: level,
          confidence: 0.60 + Math.random() * 0.38,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 168) * 3600000),
          features: {
            blink_rate:    8  + Math.random() * 25,
            eye_openness:  0.2 + Math.random() * 0.5,
            mouth_openness:Math.random() * 0.8,
            head_tilt:     Math.random() * 30,
            eyebrow_raise: Math.random() * 0.7
          }
        });
      }
      await StressLog.insertMany(logs);
      console.log('✅ Sample stress logs created');

      // Sample alerts
      const highLogs = logs.filter(l => l.stress_level === 'High').slice(0, 5);
      const alerts = highLogs.map(log => {
        const student = students.find(s => s.student_id === log.student_id);
        return {
          student_id: log.student_id,
          student_name: student.name,
          alert_message: `⚠️ HIGH STRESS DETECTED - ${student.name} (${log.student_id}) | Confidence: ${(log.confidence*100).toFixed(0)}%`,
          alert_type: 'HIGH_STRESS',
          stress_level: 'High',
          confidence: log.confidence,
          timestamp: log.timestamp,
          acknowledged: false
        };
      });
      await Alert.insertMany(alerts);
      console.log('✅ Sample alerts created');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};
