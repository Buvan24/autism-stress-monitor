const Student = require('../models/Student');

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ student_id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: student });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Student ID already exists' });
    res.status(500).json({ message: e.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate({ student_id: req.params.id }, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: student });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findOneAndDelete({ student_id: req.params.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
