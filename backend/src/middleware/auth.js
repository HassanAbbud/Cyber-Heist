const jwt = require('jsonwebtoken');

const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const requireAuth = (user) => {
  if (!user) throw new Error('Authentication required. Please log in.');
  return user;
};

module.exports = { getUserFromToken, requireAuth };
