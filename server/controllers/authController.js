const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    user.last_login = new Date();
    await user.save();
    res.json({ success: true, token: generateToken(user._id), user: { id: user._id, username: user.username, role: user.role, full_name: user.full_name } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, username: req.user.username, role: req.user.role, full_name: req.user.full_name } });
};
