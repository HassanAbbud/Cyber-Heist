const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const GameSession = require('../../models/GameSession');
const Score = require('../../models/Score');
const Challenge = require('../../models/Challenge');
const { requireAuth } = require('../../middleware/auth');

// XP needed to reach each level (simple curve)
const xpForLevel = (level) => level * 100;

// Unlockable items per level
const LEVEL_UNLOCKS = {
  2:  ['tool_port_scanner'],
  3:  ['avatar_ghost'],
  5:  ['tool_exploit_kit'],
  7:  ['avatar_phantom'],
  10: ['tool_zero_day', 'avatar_overlord']
};

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      requireAuth(user);
      return await User.findById(user.id);
    },

    getGameSession: async (_, { sessionId }, { user }) => {
      requireAuth(user);
      const session = await GameSession.findById(sessionId);
      if (!session || session.userId.toString() !== user.id)
        throw new Error('Session not found');
      return session;
    },

    myGameSessions: async (_, __, { user }) => {
      requireAuth(user);
      return await GameSession.find({ userId: user.id }).sort({ startedAt: -1 }).limit(20);
    },

    leaderboard: async (_, { missionId, limit = 10 }) => {
      const query = missionId ? { missionId } : {};
      return await Score.find(query).sort({ score: -1 }).limit(limit);
    },

    myScores: async (_, __, { user }) => {
      requireAuth(user);
      return await Score.find({ userId: user.id }).sort({ createdAt: -1 });
    },

    activeChallenges: async (_, __, { user }) => {
      const challenges = await Challenge.find({ expiresAt: { $gt: new Date() } });
      return challenges.map(c => ({
        ...c.toObject(),
        id: c._id,
        completedByCount: c.completedBy.length,
        completedByMe: user
          ? c.completedBy.some(e => e.userId.toString() === user.id)
          : false
      }));
    }
  },

  Mutation: {
    register: async (_, { username, email, password }) => {
      const existing = await User.findOne({ $or: [{ email }, { username }] });
      if (existing) throw new Error('Username or email already taken');

      const hashed = await bcrypt.hash(password, 12);
      const newUser = await User.create({ username, email, password: hashed });

      const token = jwt.sign(
        { id: newUser._id, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return { token, user: newUser };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('Invalid credentials');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid credentials');

      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return { token, user };
    },

    startGameSession: async (_, { missionId, missionName }, { user }) => {
      requireAuth(user);
      return await GameSession.create({
        userId: user.id,
        missionId,
        missionName,
        status: 'in_progress'
      });
    },

    updateGameSession: async (
      _, { sessionId, score, detectionLevel, puzzleSolved, itemStolen }, { user }
    ) => {
      requireAuth(user);
      const session = await GameSession.findById(sessionId);
      if (!session || session.userId.toString() !== user.id)
        throw new Error('Session not found');

      if (score !== undefined) session.score = score;
      if (detectionLevel !== undefined) session.detectionLevel = detectionLevel;
      if (puzzleSolved) session.puzzlesSolved.push(puzzleSolved);
      if (itemStolen) session.itemsStolen.push(itemStolen);

      return await session.save();
    },

    completeGameSession: async (_, { sessionId, finalScore, timeSpent }, { user }) => {
      requireAuth(user);
      const session = await GameSession.findById(sessionId);
      if (!session || session.userId.toString() !== user.id)
        throw new Error('Session not found');

      const xpEarned = Math.floor(finalScore / 10);
      session.status = 'completed';
      session.score = finalScore;
      session.timeSpent = timeSpent;
      session.xpEarned = xpEarned;
      session.completedAt = new Date();
      await session.save();

      // Save to leaderboard
      await Score.create({
        userId: user.id,
        username: user.username,
        missionId: session.missionId,
        missionName: session.missionName,
        score: finalScore,
        timeSpent,
        xpEarned
      });

      // Level up the player
      const profile = await User.findById(user.id);
      profile.xp += xpEarned;
      let unlockedItems = [];
      while (profile.xp >= xpForLevel(profile.level)) {
        profile.xp -= xpForLevel(profile.level);
        profile.level += 1;
        const items = LEVEL_UNLOCKS[profile.level] || [];
        unlockedItems = [...unlockedItems, ...items];
      }
      await profile.save();

      return { newLevel: profile.level, xp: profile.xp, unlockedItems };
    },

    completeChallenge: async (_, { challengeId }, { user }) => {
      requireAuth(user);
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) throw new Error('Challenge not found');

      const alreadyDone = challenge.completedBy.some(
        e => e.userId.toString() === user.id
      );
      if (alreadyDone) throw new Error('Challenge already completed');

      challenge.completedBy.push({ userId: user.id });
      await challenge.save();

      // Award XP and optional badge
      await User.findByIdAndUpdate(user.id, {
        $inc: { xp: challenge.xpReward },
        ...(challenge.badgeReward
          ? { $addToSet: { achievements: challenge.badgeReward } }
          : {})
      });

      return {
        ...challenge.toObject(),
        id: challenge._id,
        completedByCount: challenge.completedBy.length,
        completedByMe: true
      };
    },

    updateAvatar: async (_, { avatar }, { user }) => {
      requireAuth(user);
      return await User.findByIdAndUpdate(user.id, { avatar }, { new: true });
    }
  }
};

module.exports = resolvers;
