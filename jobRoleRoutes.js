// server/routes/jobRoleRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getJobRoles,
  getJobRoleById,
  createJobRole,
  updateJobRole,
  deleteJobRole
} = require('../services/storageService');

// All job role routes require authorized HR authentication
router.use(requireAuth);

/**
 * GET all job roles
 */
router.get('/', (req, res) => {
  try {
    const roles = getJobRoles();
    res.json({ success: true, count: roles.length, roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET single job role by ID
 */
router.get('/:id', (req, res) => {
  try {
    const role = getJobRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Job role not found' });
    }
    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST create a new job role
 * Validates that criteria weightages sum up to 100%
 */
router.post('/', (req, res) => {
  try {
    const { title, department, location, experienceLevel, minExperienceYears, description, criteria, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Job title is required.' });
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return res.status(400).json({ error: 'At least one recruitment criterion is required.' });
    }

    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({
        error: `Validation Error: All criteria weightages must add up to exactly 100%. Current total is ${totalWeight}%.`
      });
    }

    const newRole = createJobRole({
      title,
      department,
      location,
      experienceLevel,
      minExperienceYears,
      description,
      criteria,
      status: status || 'Active'
    });

    res.status(201).json({
      success: true,
      message: `Job role "${newRole.title}" created successfully.`,
      role: newRole
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT update an existing job role
 * Validates that criteria weightages sum up to 100%
 * Keeps each job role's criteria strictly independent!
 */
router.put('/:id', (req, res) => {
  try {
    const { title, department, location, experienceLevel, minExperienceYears, description, criteria, status } = req.body;

    if (criteria) {
      const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
      if (totalWeight !== 100) {
        return res.status(400).json({
          error: `Validation Error: All criteria weightages must add up to exactly 100%. Current total is ${totalWeight}%.`
        });
      }
    }

    const updatedRole = updateJobRole(req.params.id, {
      title,
      department,
      location,
      experienceLevel,
      minExperienceYears,
      description,
      criteria,
      status
    });

    res.json({
      success: true,
      message: `Job role "${updatedRole.title}" updated successfully (Version ${updatedRole.version}).`,
      role: updatedRole
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE a job role
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteJobRole(req.params.id);
    res.json({
      success: true,
      message: `Job role "${deleted.title}" deleted.`,
      role: deleted
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
