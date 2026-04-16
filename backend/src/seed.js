/**
 * Seed script — run once to populate initial challenges.
 * Usage: node src/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');

const challenges = [
  {
    title: 'First Blood',
    description: 'Complete any mission for the first time.',
    type: 'daily',
    difficulty: 'easy',
    xpReward: 100,
    badgeReward: 'badge_first_blood',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Speed Demon',
    description: 'Complete Corporate Breach in under 3 minutes.',
    type: 'daily',
    difficulty: 'medium',
    xpReward: 250,
    badgeReward: 'badge_speed_demon',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: 'Ghost Protocol',
    description: 'Complete any mission with detection level below 20%.',
    type: 'weekly',
    difficulty: 'hard',
    xpReward: 500,
    badgeReward: 'badge_ghost_protocol',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Puzzle Master',
    description: 'Solve 5 security puzzles in a single mission.',
    type: 'weekly',
    difficulty: 'medium',
    xpReward: 300,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Challenge.deleteMany({});
  await Challenge.insertMany(challenges);
  console.log(`Seeded ${challenges.length} challenges.`);
  await mongoose.disconnect();
}

seed().catch(console.error);
