const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const emailAnalysisModel = require('../emailAnalysis.js');

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

// Helper function to decode message
function decodeMessage(message) {
  let messageBody = '';
  if (message.payload.parts) {
    message.payload.parts.forEach(part => {
      if (part.mimeType === 'text/plain') {
        messageBody = Buffer.from(part.body.data, 'base64').toString();
      }
    });
  } else if (message.payload.body.data) {
    messageBody = Buffer.from(message.payload.body.data, 'base64').toString();
  }
  return messageBody;
}

// Route to list emails
router.get('/gmails', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.status(401).send('Unauthorized: No valid session');

  try {
    const gmail = getGmailService(tokens);
    const category = req.query.category;
    const response = await gmail.users.messages.list({ userId: 'me', maxResults: 50 }); // Increased maxResults

    if (!response.data.messages || response.data.messages.length === 0) {
      return res.status(204).send('No emails found');
    }

    const fullMessages = await Promise.all(
      response.data.messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        const body = decodeMessage(fullMessage.data);
        const analysis = await emailAnalysisModel.analyzeEmail(body);
        
        return {
          id: fullMessage.data.id,
          threadId: fullMessage.data.threadId,
          snippet: fullMessage.data.snippet,
          ...analysis
        };
      })
    );

    let filteredMessages = fullMessages;
    if (category) {
      filteredMessages = fullMessages.filter(message => 
        message.category.toLowerCase() === category.toLowerCase()
      );
    }

    res.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching or analyzing emails:', error);
    res.status(500).send('Error processing emails: ' + error.message);
  }
});

module.exports = router;