const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const { oauth2Client, getAuthUrl, getTokens } = require('../googleAuth');

const getUserInfo = async (accessToken) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
};

router.get('/auth', (req, res, next) => {
  console.log('Redirecting to OAuth2 URL');
  try {
    const url = getAuthUrl();
    console.log('Generated OAuth2 URL:', url);
    res.redirect(url);
  } catch (error) {
    console.error('Error in /auth route:', error);
    next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out, please try again' });
    }
    res.clearCookie('connect.sid'); // clear the session cookie
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.get('/auth/callback', async (req, res) => {
  console.log('OAuth2 Callback received', req.query);
  const { code } = req.query;
  try {
    const tokens = await getTokens(code);
    console.log('Tokens received');
    
    const userInfo = await getUserInfo(tokens.access_token);
    console.log('User info received');

    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      user = new User({ name: userInfo.name, email: userInfo.email });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    req.session.tokens = tokens;

    res.redirect(`http://localhost:3000/handle-auth?token=${token}`);
  } catch (error) {
    console.error('Error during authentication', error);
    res.status(500).send('Error during authentication');
  }
});

module.exports = router;