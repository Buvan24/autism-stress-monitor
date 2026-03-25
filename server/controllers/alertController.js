const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { acknowledged, limit = 50 } = req.query;
    const filter = {};
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
    const alerts = await Alert.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit));
    const unread = await Alert.countDocuments({ acknowledged: false });
    res.json({ success: true, count: alerts.length, unread, data: alerts });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id,
      { acknowledged: true, acknowledged_by: req.user?.username || 'admin', acknowledged_at: new Date() },
      { new: true });
    res.json({ success: true, data: alert });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.acknowledgeAll = async (req, res) => {
  try {
    await Alert.updateMany({ acknowledged: false }, { acknowledged: true, acknowledged_by: req.user?.username || 'admin', acknowledged_at: new Date() });
    res.json({ success: true, message: 'All acknowledged' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
