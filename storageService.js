// server/services/storageService.js
const fs = require('fs');
const path = require('path');
const { defaultJobRoles } = require('../config/defaultRoles');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial default state
const initialData = {
  jobRoles: defaultJobRoles,
  candidates: [],
  resumes: [], // uploaded or imported files metadata
  settings: {
    authorizedEmail: 'hr.cbe@datapage.org',
    companyName: 'DataPage',
    thresholds: {
      strongMatch: 80,
      potentialMatch: 60,
    },
    geminiModel: 'gemini-2.5-flash',
    gmailConnected: false,
    gmailAccount: 'hr.cbe@datapage.org',
    lastGmailSync: null
  },
  analysisHistory: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialData);
      return JSON.parse(JSON.stringify(initialData));
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    // Ensure all critical root keys exist
    if (!data.jobRoles || !data.jobRoles.length) {
      data.jobRoles = defaultJobRoles;
    }
    if (!data.candidates) data.candidates = [];
    if (!data.resumes) data.resumes = [];
    if (!data.settings) data.settings = initialData.settings;
    if (!data.analysisHistory) data.analysisHistory = [];
    return data;
  } catch (err) {
    console.error('Error reading db.json, returning defaults:', err);
    return JSON.parse(JSON.stringify(initialData));
  }
}

function writeDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Job Roles API
function getJobRoles() {
  const db = readDb();
  return db.jobRoles;
}

function getJobRoleById(id) {
  const db = readDb();
  return db.jobRoles.find(r => r.id === id);
}

function createJobRole(roleData) {
  const db = readDb();
  // Validate weightage adds up to 100%
  const totalWeight = (roleData.criteria || []).reduce((acc, c) => acc + Number(c.weight || 0), 0);
  if (totalWeight !== 100) {
    throw new Error(`Total criteria weightage must equal 100%. Current sum is ${totalWeight}%.`);
  }

  const newRole = {
    id: roleData.id || `role-${Date.now()}`,
    title: roleData.title.trim(),
    department: roleData.department || 'Engineering',
    location: roleData.location || 'Coimbatore, India',
    experienceLevel: roleData.experienceLevel || 'Mid-Level',
    minExperienceYears: Number(roleData.minExperienceYears || 0),
    status: roleData.status || 'Active',
    description: roleData.description || '',
    version: 1,
    criteria: (roleData.criteria || []).map((c, idx) => ({
      id: c.id || `c-${Date.now()}-${idx}`,
      name: c.name.trim(),
      category: c.category || 'Required Skill',
      weight: Number(c.weight),
      description: c.description || ''
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.jobRoles.push(newRole);
  writeDb(db);
  return newRole;
}

function updateJobRole(id, roleData) {
  const db = readDb();
  const index = db.jobRoles.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Job role with ID ${id} not found.`);
  }

  // Validate weightage
  const totalWeight = (roleData.criteria || []).reduce((acc, c) => acc + Number(c.weight || 0), 0);
  if (totalWeight !== 100) {
    throw new Error(`Total criteria weightage must equal 100%. Current sum is ${totalWeight}%.`);
  }

  const prevRole = db.jobRoles[index];
  const newVersion = (prevRole.version || 1) + 1;

  const updatedRole = {
    ...prevRole,
    title: roleData.title ? roleData.title.trim() : prevRole.title,
    department: roleData.department || prevRole.department,
    location: roleData.location || prevRole.location,
    experienceLevel: roleData.experienceLevel || prevRole.experienceLevel,
    minExperienceYears: Number(roleData.minExperienceYears ?? prevRole.minExperienceYears),
    status: roleData.status || prevRole.status,
    description: roleData.description !== undefined ? roleData.description : prevRole.description,
    version: newVersion,
    criteria: (roleData.criteria || []).map((c, idx) => ({
      id: c.id || `c-${Date.now()}-${idx}`,
      name: c.name.trim(),
      category: c.category || 'Required Skill',
      weight: Number(c.weight),
      description: c.description || ''
    })),
    updatedAt: new Date().toISOString()
  };

  db.jobRoles[index] = updatedRole;
  writeDb(db);
  return updatedRole;
}

function deleteJobRole(id) {
  const db = readDb();
  const index = db.jobRoles.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Job role with ID ${id} not found.`);
  }
  const deleted = db.jobRoles.splice(index, 1)[0];
  writeDb(db);
  return deleted;
}

// Candidates API
function getCandidates(roleId = null) {
  const db = readDb();
  if (roleId && roleId !== 'all') {
    return db.candidates.filter(c => c.jobRoleId === roleId);
  }
  return db.candidates;
}

function getCandidateById(id) {
  const db = readDb();
  return db.candidates.find(c => c.id === id);
}

function saveCandidate(candidate) {
  const db = readDb();
  const existingIndex = db.candidates.findIndex(c => c.id === candidate.id);
  if (existingIndex !== -1) {
    db.candidates[existingIndex] = { ...db.candidates[existingIndex], ...candidate, updatedAt: new Date().toISOString() };
  } else {
    db.candidates.push({
      ...candidate,
      id: candidate.id || `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: candidate.status || 'New', // 'New' | 'Shortlisted' | 'Rejected'
      createdAt: candidate.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  writeDb(db);
  return candidate;
}

function updateCandidateStatus(id, status) {
  const db = readDb();
  const candidate = db.candidates.find(c => c.id === id);
  if (!candidate) {
    throw new Error('Candidate not found');
  }
  candidate.status = status; // 'Shortlisted', 'Rejected', 'New'
  candidate.statusUpdatedAt = new Date().toISOString();
  writeDb(db);
  return candidate;
}

function deleteCandidate(id) {
  const db = readDb();
  const index = db.candidates.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Candidate not found');
  const removed = db.candidates.splice(index, 1)[0];

  // Permanently delete physical file from disk
  if (removed.resumeFilePath && fs.existsSync(removed.resumeFilePath)) {
    try {
      fs.unlinkSync(removed.resumeFilePath);
    } catch (err) {
      console.error(`Failed to delete resume file: ${removed.resumeFilePath}`, err);
    }
  }

  // Remove corresponding resume record from db.resumes
  if (Array.isArray(db.resumes)) {
    db.resumes = db.resumes.filter(r =>
      r.filePath !== removed.resumeFilePath &&
      r.storedFilename !== path.basename(removed.resumeFilePath || '')
    );
  }

  writeDb(db);
  return removed;
}

// Resumes Metadata
function getResumes() {
  const db = readDb();
  return db.resumes;
}

function saveResume(resumeMeta) {
  const db = readDb();
  const existing = db.resumes.findIndex(r => r.id === resumeMeta.id);
  if (existing !== -1) {
    db.resumes[existing] = { ...db.resumes[existing], ...resumeMeta };
  } else {
    db.resumes.unshift(resumeMeta);
  }
  writeDb(db);
  return resumeMeta;
}

function getSettings() {
  const db = readDb();
  return db.settings;
}

function updateSettings(newSettings) {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...newSettings,
    thresholds: {
      ...db.settings.thresholds,
      ...(newSettings.thresholds || {})
    }
  };
  writeDb(db);
  return db.settings;
}

module.exports = {
  DATA_DIR,
  UPLOADS_DIR,
  readDb,
  writeDb,
  getJobRoles,
  getJobRoleById,
  createJobRole,
  updateJobRole,
  deleteJobRole,
  getCandidates,
  getCandidateById,
  saveCandidate,
  updateCandidateStatus,
  deleteCandidate,
  getResumes,
  saveResume,
  getSettings,
  updateSettings
};
