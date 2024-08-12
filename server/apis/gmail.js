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

// Helper function to get email subject
function getEmailSubject(headers) {
  const subjectHeader = headers.find(header => header.name.toLowerCase() === 'subject');
  return subjectHeader ? subjectHeader.value : '';
}

// Route to list emails
router.get('/gmails', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.status(401).send('Unauthorized: No valid session');

  try {
    const gmail = getGmailService(tokens);
    const category = req.query.category;
    const archived = req.query.archived === 'true';

    const query = archived ? '-in:inbox' : 'in:inbox';
    const response = await gmail.users.messages.list({ 
      userId: 'me', 
      maxResults: 50,
      q: query
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return res.json([]);
    }

    const fullMessages = await Promise.all(
      response.data.messages.map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        const body = decodeMessage(fullMessage.data);
        const subject = getEmailSubject(fullMessage.data.payload.headers);
        const analysis = await emailAnalysisModel.analyzeEmail(body, subject);
        
        return {
          id: fullMessage.data.id,
          threadId: fullMessage.data.threadId,
          snippet: fullMessage.data.snippet,
          subject: subject,
          archived: !fullMessage.data.labelIds.includes('INBOX'),
          ...analysis
        };
      })
    );

    let filteredMessages = fullMessages;
    if (category) {
      filteredMessages = filteredMessages.filter(message => 
        message.category.toLowerCase() === category.toLowerCase()
      );
    }

    res.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching or analyzing emails:', error);
    res.status(500).send('Error processing emails: ' + error.message);
  }
});

// Route to archive an email
router.post('/archive/:id', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.status(401).send('Unauthorized: No valid session');

  try {
    const gmail = getGmailService(tokens);
    const messageId = req.params.id;

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });

    res.status(200).send('Email archived successfully');
  } catch (error) {
    console.error('Error archiving email:', error);
    res.status(500).send('Error archiving email: ' + error.message);
  }
});

// Route to unarchive an email
router.post('/unarchive/:id', async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.status(401).send('Unauthorized: No valid session');

  try {
    const gmail = getGmailService(tokens);
    const messageId = req.params.id;

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: ['INBOX']
      }
    });

    res.status(200).send('Email unarchived successfully');
  } catch (error) {
    console.error('Error unarchiving email:', error);
    res.status(500).send('Error unarchiving email: ' + error.message);
  }
});

module.exports = router;