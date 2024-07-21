const express = require('express');
const router = express.Router();
const emailAnalysisModel = require('../../ai/model/emailAnalysis');
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

// Helper function test --------------------
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


// Route to list emails - http://localhost:4000/api/gmails
router.get('/gmails', async (req, res) => {
  const tokens = req.session.tokens; // Retrieve tokens from session
  if (!tokens) return res.status(401).send('Unauthorized');

  try {
    const gmail = getGmailService(tokens);
    const response = await gmail.users.messages.list({ userId: 'me' });
    
    // Fetch full message content for each email
    const fullMessages = await Promise.all(
      response.data.messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        const body = decodeMessage(fullMessage.data);
        const analysis = emailAnalysisModel.analyzeEmail(body);
        return {
          id: fullMessage.data.id,
          threadId: fullMessage.data.threadId,
          snippet: fullMessage.data.snippet,
          body: analysis.cleanedBody,  // Use the cleaned body
          category: analysis.category,
          summary: analysis.summary,
          sentiment: analysis.sentiment
        };
      })
    );
     
    res.json(fullMessages);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send('Error fetching emails');
  }
});

module.exports = router;
