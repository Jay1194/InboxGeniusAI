const express = require('express');
const router = express.Router();
const { google } = require('googleapis');


// Gmail API setup
const getGmailService = (tokens) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI  
  );
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Route to list emails - http://localhost:4000/api/gmail/emails
router.get('/emails', async (req, res) => {
  const tokens = req.session.tokens; // Retrieve tokens from session
  if (!tokens) return res.status(401).send('Unauthorized');

  try {
    const gmail = getGmailService(tokens);
    const response = await gmail.users.messages.list({ userId: 'me' });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error fetching emails');
  }
});

module.exports = router;
