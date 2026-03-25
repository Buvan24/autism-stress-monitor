const mongoose = require('mongoose');

const stressLogSchema = new mongoose.Schema({
  student_id:   { type: String, required: true },
  stress_level: { type: String, required: true, enum: ['Low', 'Moderate', 'High'] },
  confidence:   { type: Number, required: true },
  features: {
    blink_rate:    { type: Number, default: 0 },
    eye_openness:  { type: Number, default: 0 },
    mouth_openness:{ type: Number, default: 0 },
    head_tilt:     { type: Number, default: 0 },
    eyebrow_raise: { type: Number, default: 0 }
  },
  image_path: { type: String, default: '' },
  timestamp:  { type: Date, default: Date.now },
  session_id: { type: String, default: '' }
}, { timestamps: true });

stressLogSchema.index({ student_id: 1, timestamp: -1 });
stressLogSchema.index({ stress_level: 1 });

module.exports = mongoose.model('StressLog', stressLogSchema);
