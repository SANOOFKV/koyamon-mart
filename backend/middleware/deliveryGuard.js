const jwt = require('jsonwebtoken');

/**
 * Middleware: Require delivery role in JWT
 */
function requireDelivery(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'delivery' && !decoded.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Delivery access only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { requireDelivery };
