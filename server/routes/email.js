const express = require('express');
const router = express.Router();
const Email = require('../models/Email'); // Assume you have an Email model

// Mark an email as junk
router.post('/junk/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    email.isJunk = true;
    email.deleteAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    await email.save();
    res.json({ message: 'Email marked as junk' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking email as junk', error });
  }
});

// Mark all emails as junk
router.post('/junk-all', async (req, res) => {
    try {
      const deleteAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      await Email.updateMany({ userId: req.user.id }, { isJunk: true, deleteAt });
      res.json({ message: 'All emails marked as junk' });
    } catch (error) {
      res.status(500).json({ message: 'Error marking all emails as junk', error });
    }
  });
  

// You might also want to set up a scheduled task to delete junk emails after 15 days
// This could be done using a library like node-cron, for example

module.exports = router;