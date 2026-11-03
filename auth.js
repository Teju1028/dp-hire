// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dp-hire-datapage-secret-2025';
const AUTHORIZED_EMAIL = (process.env.AUTHORIZED_EMAIL || 'hr.cbe@datapage.org').toLowerCase().trim();

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || 'hr-user-cbe',
      email: user.email,
      name: user.name || 'DataPage HR Team',
      picture: user.picture || null,
      role: 'HR_ADMIN'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in with your authorized Google account.',
      authorized: false
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired session. Please sign in again.',
      authorized: false
    });
  }

  const userEmail = (decoded.email || '').toLowerCase().trim();
  if (userEmail !== AUTHORIZED_EMAIL) {
    return res.status(403).json({
      error: 'Access Denied – You are not an authorized user.',
      attemptedEmail: decoded.email,
      authorized: false
    });
  }

  req.user = decoded;
  next();
}

module.exports = {
  JWT_SECRET,
  AUTHORIZED_EMAIL,
  generateToken,
  verifyToken,
  requireAuth
};
