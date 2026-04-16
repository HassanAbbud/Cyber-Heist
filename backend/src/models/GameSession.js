const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Current mission / level state
  missionId:    { type: String, required: true },
  missionName:  { type: String, required: true },
  status:       { type: String, enum: ['in_progress', 'completed', 'failed'], default: 'in_progress' },

  // Scoring
  score:     { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // seconds
  xpEarned:  { type: Number, default: 0 },

  // Puzzle/heist progress
  puzzlesSolved: [{ type: String }],
  itemsStolen:   [{ type: String }],
  detectionLevel: { type: Number, default: 0, min: 0, max: 100 }, // 0=undetected, 100=caught

  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
