import { gql } from '@apollo/client';

// Auth
export const REGISTER = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user { id username level xp credits achievements }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id username level xp credits achievements }
    }
  }
`;

export const ME = gql`
  query Me {
    me { id username email avatar level xp credits achievements createdAt }
  }
`;

// Game Sessions
export const START_SESSION = gql`
  mutation StartGameSession($missionId: String!, $missionName: String!) {
    startGameSession(missionId: $missionId, missionName: $missionName) {
      id missionId missionName status score detectionLevel
    }
  }
`;

export const UPDATE_SESSION = gql`
  mutation UpdateGameSession(
    $sessionId: ID!
    $score: Int
    $detectionLevel: Int
    $puzzleSolved: String
    $itemStolen: String
  ) {
    updateGameSession(
      sessionId: $sessionId
      score: $score
      detectionLevel: $detectionLevel
      puzzleSolved: $puzzleSolved
      itemStolen: $itemStolen
    ) {
      id score detectionLevel puzzlesSolved itemsStolen
    }
  }
`;

export const COMPLETE_SESSION = gql`
  mutation CompleteGameSession($sessionId: ID!, $finalScore: Int!, $timeSpent: Int!) {
    completeGameSession(sessionId: $sessionId, finalScore: $finalScore, timeSpent: $timeSpent) {
      newLevel xp unlockedItems
    }
  }
`;

export const MY_SESSIONS = gql`
  query MyGameSessions {
    myGameSessions {
      id missionId missionName status score xpEarned timeSpent completedAt
    }
  }
`;

// Leaderboard
export const LEADERBOARD = gql`
  query Leaderboard($missionId: String, $limit: Int) {
    leaderboard(missionId: $missionId, limit: $limit) {
      id username missionName score timeSpent xpEarned createdAt
    }
  }
`;

export const MY_SCORES = gql`
  query MyScores {
    myScores {
      id missionName score timeSpent xpEarned createdAt
    }
  }
`;

// Challenges
export const ACTIVE_CHALLENGES = gql`
  query ActiveChallenges {
    activeChallenges {
      id title description type difficulty xpReward badgeReward
      expiresAt completedByCount completedByMe
    }
  }
`;

export const COMPLETE_CHALLENGE = gql`
  mutation CompleteChallenge($challengeId: ID!) {
    completeChallenge(challengeId: $challengeId) {
      id title completedByMe completedByCount
    }
  }
`;

export const UPDATE_AVATAR = gql`
  mutation UpdateAvatar($avatar: String!) {
    updateAvatar(avatar: $avatar) {
      id avatar
    }
  }
`;
