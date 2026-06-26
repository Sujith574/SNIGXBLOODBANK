const jwt = require('jsonwebtoken');

function signAccessToken(payload) {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign(payload, accessSecret, { expiresIn });
}

function signRefreshToken(payload) {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  return jwt.sign(payload, refreshSecret, { expiresIn });
}

function verifyAccessToken(token) {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  return jwt.verify(token, accessSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
};

