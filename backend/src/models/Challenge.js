const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  type:        { type: String, enum: ['daily', 'weekly', 'pvp'], required: true },
  difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  xpReward:    { type: Number, required: true },
  badgeReward: { type: String },
  expiresAt:   { type: Date, required: true },

  // Players who completed it
  completedBy: [{
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Challenge', challengeSchema);
