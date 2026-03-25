const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id:     { type: String, required: true, unique: true, trim: true },
  name:           { type: String, required: true },
  age:            { type: Number, required: true },
  classroom:      { type: String, required: true },
  guardian_name:  { type: String, default: '' },
  guardian_phone: { type: String, default: '' },
  guardian_email: { type: String, default: '' },
  is_autistic:    { type: Boolean, default: false },
  monitoring_active: { type: Boolean, default: true },
  notes:          { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
