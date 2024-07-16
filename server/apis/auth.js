const express = require('express');
const router = express.Router();
const { oauth2Client, getAuthUrl, getTokens } = require('../googleAuth');

// Route to start OAuth flow - http://localhost:4000/auth/auth
router.get('/auth', (req, res) => {
  console.log('Redirecting to OAuth2 URL');
  const url = getAuthUrl();
  res.redirect(url);
});

// OAuth callback route
router.get('/auth/callback', async (req, res) => {
  console.log('OAuth2 Callback received', req.query);
  const { code } = req.query;
  try {
    const tokens = await getTokens(code);
    console.log('Tokens received', tokens);
    req.session.tokens = tokens;
    res.redirect('/emails');
  } catch (error) {
    console.error('Error during authentication', error);
    res.status(500).send('Error during authentication');
  }
})

module.exports = router;
