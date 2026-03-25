const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  student_id:    { type: String, required: true },
  student_name:  { type: String, default: '' },
  alert_message: { type: String, required: true },
  alert_type:    { type: String, enum: ['HIGH_STRESS', 'AUTISM_DETECTED', 'SUSTAINED_STRESS'], default: 'HIGH_STRESS' },
  stress_level:  { type: String, default: 'High' },
  confidence:    { type: Number, default: 0 },
  acknowledged:  { type: Boolean, default: false },
  acknowledged_by: { type: String, default: '' },
  acknowledged_at: { type: Date, default: null },
  timestamp:     { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
