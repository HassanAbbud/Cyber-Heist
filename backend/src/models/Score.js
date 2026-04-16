const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:    { type: String, required: true },
  missionId:   { type: String, required: true },
  missionName: { type: String, required: true },
  score:       { type: Number, required: true },
  timeSpent:   { type: Number, required: true },
  xpEarned:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

// Compound index for fast leaderboard queries
scoreSchema.index({ missionId: 1, score: -1 });

module.exports = mongoose.model('Score', scoreSchema);
