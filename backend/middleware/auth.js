const jwt = require('jsonwebtoken');

/**
 * Middleware: Require a valid customer JWT
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Allow either authenticated user OR a guest request
 * Guest requests must include: { guest: true, guestInfo: { name, phone } }
 */
function optionalAuth(req, res, next) {
  const token = req.cookies?.accessToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // invalid token treated as guest
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
