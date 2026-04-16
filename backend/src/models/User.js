const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar:   { type: String, default: 'hacker_default' },

  // Game profile
  level:   { type: Number, default: 1 },
  xp:      { type: Number, default: 0 },
  credits: { type: Number, default: 100 }, // in-game currency

  // Achievement flags
  achievements: [{ type: String }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
