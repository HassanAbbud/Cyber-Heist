const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    level: Int!
    xp: Int!
    credits: Int!
    achievements: [String]!
    createdAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type GameSession {
    id: ID!
    userId: ID!
    missionId: String!
    missionName: String!
    status: String!
    score: Int!
    timeSpent: Int!
    xpEarned: Int!
    puzzlesSolved: [String]!
    itemsStolen: [String]!
    detectionLevel: Int!
    startedAt: String
    completedAt: String
  }

  type Score {
    id: ID!
    userId: ID!
    username: String!
    missionId: String!
    missionName: String!
    score: Int!
    timeSpent: Int!
    xpEarned: Int!
    createdAt: String
  }

  type Challenge {
    id: ID!
    title: String!
    description: String!
    type: String!
    difficulty: String!
    xpReward: Int!
    badgeReward: String
    expiresAt: String!
    completedByCount: Int!
    completedByMe: Boolean!
  }

  type LevelUpResult {
    newLevel: Int!
    xp: Int!
    unlockedItems: [String]!
  }

  type Query {
    # Auth
    me: User

    # Game
    getGameSession(sessionId: ID!): GameSession
    myGameSessions: [GameSession]!

    # Leaderboard
    leaderboard(missionId: String, limit: Int): [Score]!
    myScores: [Score]!

    # Challenges
    activeChallenges: [Challenge]!
  }

  type Mutation {
    # Auth
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Game
    startGameSession(missionId: String!, missionName: String!): GameSession!
    updateGameSession(
      sessionId: ID!
      score: Int
      detectionLevel: Int
      puzzleSolved: String
      itemStolen: String
    ): GameSession!
    completeGameSession(sessionId: ID!, finalScore: Int!, timeSpent: Int!): LevelUpResult!

    # Challenges
    completeChallenge(challengeId: ID!): Challenge!

    # Profile
    updateAvatar(avatar: String!): User!
  }
`;

module.exports = typeDefs;
