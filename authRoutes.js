// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { AUTHORIZED_EMAIL, generateToken, requireAuth } = require('../middleware/auth');

/**
 * Google Sign-In verification endpoint
 * Accepts: { email, name, picture, credential }
 */
router.post('/google', async (req, res) => {
  try {
    const { email, name, picture, credential } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign-In.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // STRICT ACCESS RESTRICTION: Only hr.cbe@datapage.org is permitted
    if (normalizedEmail !== AUTHORIZED_EMAIL) {
      return res.status(403).json({
        authorized: false,
        error: 'Access Denied – You are not an authorized user.',
        message: `Account "${email}" is not authorized. Only ${AUTHORIZED_EMAIL} has access to DP Hire.`
      });
    }

    // Generate authenticated session token
    const userPayload = {
      id: 'datapage-hr-admin',
      email: AUTHORIZED_EMAIL,
      name: name || 'DataPage HR Team',
      picture: picture || null,
      organization: 'DataPage',
      location: 'Coimbatore, India'
    };

    const token = generateToken(userPayload);

    return res.json({
      success: true,
      authorized: true,
      token,
      user: userPayload,
      message: 'Successfully authenticated as DataPage HR.'
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed: ' + err.message });
  }
});

/**
 * Direct HR login helper (Signs in directly as the authorized hr.cbe@datapage.org)
 */
router.post('/hr-login', (req, res) => {
  const userPayload = {
    id: 'datapage-hr-admin',
    email: AUTHORIZED_EMAIL,
    name: 'DataPage HR Operations',
    picture: null,
    organization: 'DataPage',
    location: 'Coimbatore, India'
  };

  const token = generateToken(userPayload);

  return res.json({
    success: true,
    authorized: true,
    token,
    user: userPayload,
    message: `Signed in as authorized HR (${AUTHORIZED_EMAIL})`
  });
});

/**
 * Test unauthorized login endpoint (to demonstrate "Access Denied" behavior)
 */
router.post('/test-unauthorized', (req, res) => {
  const testEmail = req.body.email || 'candidate.test@gmail.com';
  return res.status(403).json({
    authorized: false,
    error: 'Access Denied – You are not an authorized user.',
    message: `Account "${testEmail}" is not authorized. Only ${AUTHORIZED_EMAIL} has access to DP Hire.`
  });
});

/**
 * Check current authentication state
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    authorized: true,
    user: req.user
  });
});

module.exports = router;
