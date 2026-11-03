// server/routes/gmailRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { fetchCandidateEmailsFromGmail, importAttachmentFromGmail } = require('../services/gmailService');
const { getSettings, updateSettings } = require('../services/storageService');

// Protect all Gmail endpoints
router.use(requireAuth);

/**
 * GET list of emails containing candidate resumes
 */
router.get('/emails', async (req, res) => {
  try {
    const { forceSample } = req.query;
    const result = await fetchCandidateEmailsFromGmail(forceSample === 'true');
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve candidate emails: ' + err.message });
  }
});

/**
 * POST import a selected attachment from Gmail
 */
router.post('/import-attachment', async (req, res) => {
  try {
    const { messageId, attachmentId } = req.body;
    if (!messageId || !attachmentId) {
      return res.status(400).json({ error: 'messageId and attachmentId are required.' });
    }

    const importedResume = await importAttachmentFromGmail(messageId, attachmentId);
    res.json({
      success: true,
      message: `Resume "${importedResume.originalFilename}" successfully imported from Gmail.`,
      resume: importedResume
    });
  } catch (err) {
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

/**
 * POST sync status or toggle connection
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await fetchCandidateEmailsFromGmail();
    updateSettings({
      gmailConnected: true,
      lastGmailSync: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Gmail synced successfully. Found ${result.count} candidate email(s).`,
      count: result.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
