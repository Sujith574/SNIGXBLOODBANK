const { verifyAccessToken } = require('../services/tokenService');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = req.cookies?.accessToken;
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized', data: null, statusCode: 401 });
    }

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', data: null, statusCode: 401 });
  }
}

module.exports = authenticate;

