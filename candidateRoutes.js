// server/routes/candidateRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const {
  UPLOADS_DIR,
  getCandidates,
  getCandidateById,
  saveCandidate,
  updateCandidateStatus,
  deleteCandidate,
  getJobRoleById,
  saveResume,
  getResumes,
  getSettings
} = require('../services/storageService');
const { parseResumeFile } = require('../services/resumeParser');
const { analyzeWithGemini } = require('../services/geminiService');

// Multer storage configuration for manual uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX attachments are supported.'));
    }
  }
});

// Protect all candidate endpoints with authorized HR check
router.use(requireAuth);

/**
 * GET all candidates with filtering and sorting
 */
router.get('/', (req, res) => {
  try {
    const { roleId, search, status, tier, sortBy } = req.query;
    let list = getCandidates(roleId);
    const settings = getSettings();
    const strongThresh = settings.thresholds?.strongMatch || 80;
    const potentialThresh = settings.thresholds?.potentialMatch || 60;

    // Filter by search keyword
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => 
        (c.candidateName && c.candidateName.toLowerCase().includes(q)) ||
        (c.candidateEmail && c.candidateEmail.toLowerCase().includes(q)) ||
        (c.resumeFilename && c.resumeFilename.toLowerCase().includes(q)) ||
        (c.jobRoleTitle && c.jobRoleTitle.toLowerCase().includes(q)) ||
        ((c.matchedSkills || []).some(s => s.toLowerCase().includes(q)))
      );
    }

    // Filter by status (Shortlisted, Rejected, New)
    if (status && status !== 'all') {
      list = list.filter(c => (c.status || 'New').toLowerCase() === status.toLowerCase());
    }

    // Filter by match tier (Strong Match, Potential Match, Low Match)
    if (tier && tier !== 'all') {
      list = list.filter(c => {
        const score = c.overallMatchPercentage || 0;
        if (tier === 'Strong Match') return score >= strongThresh;
        if (tier === 'Potential Match') return score >= potentialThresh && score < strongThresh;
        if (tier === 'Low Match') return score < potentialThresh;
        return true;
      });
    }

    // Sort
    if (sortBy === 'score_asc') {
      list.sort((a, b) => (a.overallMatchPercentage || 0) - (b.overallMatchPercentage || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.candidateName || '').localeCompare(b.candidateName || ''));
    } else if (sortBy === 'date') {
      list.sort((a, b) => new Date(b.analyzedAt || 0) - new Date(a.analyzedAt || 0));
    } else {
      // Default: score descending (highest match percentage first)
      list.sort((a, b) => (b.overallMatchPercentage || 0) - (a.overallMatchPercentage || 0));
    }

    res.json({
      success: true,
      count: list.length,
      candidates: list,
      thresholds: { strongMatch: strongThresh, potentialMatch: potentialThresh }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET candidate by ID
 */
router.get('/:id', (req, res) => {
  try {
    const candidate = getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST upload resumes manually (supports multiple files)
 */
router.post('/upload', upload.array('resumes', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No resume files were uploaded.' });
    }

    const uploadedList = req.files.map(file => {
      const record = {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        filePath: file.path,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        mimeType: file.mimetype,
        source: 'Manual Upload',
        senderName: file.originalname.replace(/\.[^/.]+$/, ''),
        senderEmail: 'Extracted during analysis',
        receivedDate: new Date().toISOString(),
        uploadedAt: new Date().toISOString()
      };
      saveResume(record);
      return record;
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedList.length} resume(s).`,
      resumes: uploadedList
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST analyze a single resume or uploaded file against a selected job role
 */
router.post('/analyze', async (req, res) => {
  try {
    const { resumeId, jobRoleId, filePath, originalFilename } = req.body;

    if (!jobRoleId) {
      return res.status(400).json({ error: 'Please select a job role for recruitment analysis.' });
    }

    const jobRole = getJobRoleById(jobRoleId);
    if (!jobRole) {
      return res.status(404).json({ error: `Job role with ID "${jobRoleId}" not found.` });
    }

    let targetFilePath = filePath;
    let filename = originalFilename;
    let resumeRecord = null;

    if (resumeId) {
      const allResumes = getResumes();
      resumeRecord = allResumes.find(r => r.id === resumeId);
      if (resumeRecord) {
        targetFilePath = resumeRecord.filePath;
        filename = resumeRecord.originalFilename;
      }
    }

    if (!targetFilePath || !fs.existsSync(targetFilePath)) {
      return res.status(400).json({ error: 'Resume file could not be located on the server.' });
    }

    // 1. Parse text from document
    const parsedDoc = await parseResumeFile(targetFilePath, '', filename);
    if (!parsedDoc.rawText || parsedDoc.rawText.length < 20) {
      return res.status(400).json({
        error: 'Unable to extract legible text from this resume. Ensure the file is not empty or password protected.'
      });
    }

    // 2. Perform AI Analysis with Gemini
    const aiAnalysis = await analyzeWithGemini(parsedDoc.rawText, jobRole, filename);

    // 3. Assemble candidate profile record
    const candidateId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const candidateData = {
      id: candidateId,
      jobRoleId: jobRole.id,
      jobRoleTitle: jobRole.title,
      jobRoleVersion: jobRole.version || 1,
      criteriaSnapshot: JSON.parse(JSON.stringify(jobRole.criteria)),
      candidateName: aiAnalysis.candidateName || resumeRecord?.senderName || 'Candidate',
      candidateEmail: aiAnalysis.candidateEmail || resumeRecord?.senderEmail || 'Not specified',
      candidatePhone: aiAnalysis.candidatePhone || 'Not specified',
      candidateLocation: aiAnalysis.candidateLocation || 'Not specified',
      totalExperienceYears: aiAnalysis.totalExperienceYears || 0,
      educationDetails: aiAnalysis.educationDetails || [],
      experienceDetails: aiAnalysis.experienceDetails || [],
      matchedSkills: aiAnalysis.matchedSkills || [],
      missingSkills: aiAnalysis.missingSkills || [],
      educationMatch: aiAnalysis.educationMatch || 'Evaluated',
      experienceMatch: aiAnalysis.experienceMatch || 'Evaluated',
      criteriaBreakdown: aiAnalysis.criteriaBreakdown || [],
      overallMatchPercentage: aiAnalysis.overallMatchPercentage,
      recommendation: aiAnalysis.recommendation,
      evaluationSummary: aiAnalysis.evaluationSummary,
      resumeFilename: filename,
      resumeFilePath: targetFilePath,
      resumeRawText: parsedDoc.rawText,
      analyzedBy: aiAnalysis.analyzedBy,
      analyzedAt: new Date().toISOString(),
      status: 'New', // Default status: New | Shortlisted | Rejected
      statusUpdatedAt: new Date().toISOString()
    };

    saveCandidate(candidateData);

    res.json({
      success: true,
      message: `Analysis completed for ${candidateData.candidateName} (${candidateData.overallMatchPercentage}% match).`,
      candidate: candidateData
    });
  } catch (err) {
    console.error('Candidate analysis error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

/**
 * POST batch analyze resumes against a job role
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    const { resumeIds, jobRoleId } = req.body;

    if (!jobRoleId) {
      return res.status(400).json({ error: 'Job role ID is required.' });
    }
    if (!Array.isArray(resumeIds) || resumeIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one resume to analyse.' });
    }

    const jobRole = getJobRoleById(jobRoleId);
    if (!jobRole) {
      return res.status(404).json({ error: 'Job role not found.' });
    }

    const allResumes = getResumes();
    const results = [];
    const errors = [];

    for (const resId of resumeIds) {
      const resumeMeta = allResumes.find(r => r.id === resId);
      if (!resumeMeta || !fs.existsSync(resumeMeta.filePath)) {
        errors.push({ resumeId: resId, error: 'Resume file missing' });
        continue;
      }

      try {
        const parsed = await parseResumeFile(resumeMeta.filePath, resumeMeta.mimeType, resumeMeta.originalFilename);
        const aiAnalysis = await analyzeWithGemini(parsed.rawText, jobRole, resumeMeta.originalFilename);

        const candidateId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const candidateData = {
          id: candidateId,
          jobRoleId: jobRole.id,
          jobRoleTitle: jobRole.title,
          jobRoleVersion: jobRole.version || 1,
          criteriaSnapshot: JSON.parse(JSON.stringify(jobRole.criteria)),
          candidateName: aiAnalysis.candidateName || resumeMeta.senderName || 'Candidate',
          candidateEmail: aiAnalysis.candidateEmail || resumeMeta.senderEmail || 'Not specified',
          candidatePhone: aiAnalysis.candidatePhone || 'Not specified',
          candidateLocation: aiAnalysis.candidateLocation || 'Not specified',
          totalExperienceYears: aiAnalysis.totalExperienceYears || 0,
          educationDetails: aiAnalysis.educationDetails || [],
          experienceDetails: aiAnalysis.experienceDetails || [],
          matchedSkills: aiAnalysis.matchedSkills || [],
          missingSkills: aiAnalysis.missingSkills || [],
          educationMatch: aiAnalysis.educationMatch || 'Evaluated',
          experienceMatch: aiAnalysis.experienceMatch || 'Evaluated',
          criteriaBreakdown: aiAnalysis.criteriaBreakdown || [],
          overallMatchPercentage: aiAnalysis.overallMatchPercentage,
          recommendation: aiAnalysis.recommendation,
          evaluationSummary: aiAnalysis.evaluationSummary,
          resumeFilename: resumeMeta.originalFilename,
          resumeFilePath: resumeMeta.filePath,
          resumeRawText: parsed.rawText,
          analyzedBy: aiAnalysis.analyzedBy,
          analyzedAt: new Date().toISOString(),
          status: 'New',
          statusUpdatedAt: new Date().toISOString()
        };

        saveCandidate(candidateData);
        results.push(candidateData);
      } catch (subErr) {
        errors.push({ resumeId: resId, filename: resumeMeta.originalFilename, error: subErr.message });
      }
    }

    res.json({
      success: true,
      analyzedCount: results.length,
      errorsCount: errors.length,
      results,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST re-analyze a candidate when job criteria change
 * Preserves criteria versioning history
 */
router.post('/:id/reanalyze', async (req, res) => {
  try {
    const candidate = getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate record not found.' });
    }

    const jobRole = getJobRoleById(candidate.jobRoleId);
    if (!jobRole) {
      return res.status(404).json({ error: 'Associated job role no longer exists.' });
    }

    if (!fs.existsSync(candidate.resumeFilePath)) {
      return res.status(400).json({ error: 'Original resume file not found on server.' });
    }

    const parsed = await parseResumeFile(candidate.resumeFilePath, '', candidate.resumeFilename);
    const aiAnalysis = await analyzeWithGemini(parsed.rawText, jobRole, candidate.resumeFilename);

    // Save previous analysis in candidate history
    const previousRun = {
      analyzedAt: candidate.analyzedAt,
      version: candidate.jobRoleVersion,
      overallMatchPercentage: candidate.overallMatchPercentage,
      criteriaSnapshot: candidate.criteriaSnapshot
    };

    const history = candidate.analysisHistory || [];
    history.push(previousRun);

    const updated = {
      ...candidate,
      jobRoleVersion: jobRole.version,
      criteriaSnapshot: JSON.parse(JSON.stringify(jobRole.criteria)),
      matchedSkills: aiAnalysis.matchedSkills,
      missingSkills: aiAnalysis.missingSkills,
      educationMatch: aiAnalysis.educationMatch,
      experienceMatch: aiAnalysis.experienceMatch,
      criteriaBreakdown: aiAnalysis.criteriaBreakdown,
      overallMatchPercentage: aiAnalysis.overallMatchPercentage,
      recommendation: aiAnalysis.recommendation,
      evaluationSummary: aiAnalysis.evaluationSummary,
      analyzedBy: aiAnalysis.analyzedBy,
      analyzedAt: new Date().toISOString(),
      analysisHistory: history
    };

    saveCandidate(updated);

    res.json({
      success: true,
      message: `Re-analysis completed against Job Role Version ${jobRole.version}. Match: ${updated.overallMatchPercentage}%.`,
      candidate: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH update candidate status (Shortlisted, Rejected, New)
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['Shortlisted', 'Rejected', 'New'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Shortlisted, Rejected, or New.' });
    }

    const updated = updateCandidateStatus(req.params.id, status);
    res.json({
      success: true,
      message: `Candidate marked as ${status}.`,
      candidate: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE candidate
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteCandidate(req.params.id);
    res.json({ success: true, message: 'Candidate removed.', candidate: deleted });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * GET download resume file
 */
router.get('/:id/resume/download', (req, res) => {
  try {
    const candidate = getCandidateById(req.params.id);
    if (!candidate || !fs.existsSync(candidate.resumeFilePath)) {
      return res.status(404).json({ error: 'Resume file not found.' });
    }

    res.download(candidate.resumeFilePath, candidate.resumeFilename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET view resume text & preview
 */
router.get('/:id/resume/view', (req, res) => {
  try {
    const candidate = getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    res.json({
      success: true,
      filename: candidate.resumeFilename,
      candidateName: candidate.candidateName,
      rawText: candidate.resumeRawText || 'Text preview not available'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
