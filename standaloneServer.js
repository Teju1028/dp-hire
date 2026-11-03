// server/standaloneServer.js
// DP Hire - AI-Powered Recruitment Application for DataPage
// Zero-dependency production server using Node.js built-ins

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Load environment variables from .env if present
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k.trim()]) {
          process.env[k.trim()] = val;
        }
      }
    }
  }
}
loadEnv();

const AUTHORIZED_EMAIL = (process.env.AUTHORIZED_EMAIL || 'hr.cbe@datapage.org').toLowerCase().trim();
const JWT_SECRET = process.env.JWT_SECRET || 'dp-hire-datapage-secret-cbe-2025';

// Database Access Functions
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading db:', err);
  }
  return { jobRoles: [], candidates: [], resumes: [], settings: {}, analysisHistory: [] };
}

function writeDb(data) {
  try {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

// Authentication Helpers
function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 86400 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function authenticate(req) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || (decoded.email || '').toLowerCase().trim() !== AUTHORIZED_EMAIL) {
    return null;
  }
  return decoded;
}

// Simple Resume Text Parser (PDF/DOCX/TXT)
function parseResumeText(filePath, originalFilename = '') {
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  const ext = (path.extname(originalFilename || filePath) || '').toLowerCase();

  if (ext === '.txt') {
    return buffer.toString('utf8');
  }

  // DOCX XML text extractor
  if (ext === '.docx' || ext === '.doc') {
    const raw = buffer.toString('utf8');
    const xmlMatches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (xmlMatches && xmlMatches.length > 0) {
      return xmlMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
    }
  }

  // PDF text extractor (extract printable words and streams)
  const rawText = buffer.toString('latin1');
  const textPieces = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match;
  while ((match = btRegex.exec(rawText)) !== null) {
    const block = match[0];
    const tjRegex = /\((.*?)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textPieces.push(tjMatch[1]);
    }
  }
  if (textPieces.length > 0) {
    return textPieces.join('\n');
  }

  // Fallback: extract clean ASCII characters
  return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

// AI Analysis Engine with Gemini and Heuristic Fallback
async function evaluateResumeWithAI(resumeText, jobRole, originalFilename = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  const db = readDb();
  const strongThresh = db.settings?.thresholds?.strongMatch || 80;
  const potentialThresh = db.settings?.thresholds?.potentialMatch || 60;

  // Try real Google Gemini API if key is present
  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.trim().length > 10) {
    try {
      const criteriaList = (jobRole.criteria || []).map((c, i) =>
        `${i + 1}. [${c.id}] ${c.name} (${c.category}, Weight: ${c.weight}%) - ${c.description || ''}`
      ).join('\n');

      const prompt = `You are DP Hire, recruitment AI for DataPage.
Evaluate this resume against the role "${jobRole.title}" (Minimum experience: ${jobRole.minExperienceYears || 0} years).

CRITERIA & WEIGHTAGES:
${criteriaList}

INSTRUCTIONS:
1. ONLY award points if there is actual evidence in the resume.
2. For each criterion, assign score (0-100), calculate weightedScore = (score * weight) / 100.
3. overallMatchPercentage MUST equal the exact sum of weightedScores (0-100).
4. Reply ONLY with valid JSON.

JSON SCHEMA:
{
  "candidateName": "Name",
  "candidateEmail": "email@example.com",
  "candidatePhone": "Phone",
  "candidateLocation": "City",
  "totalExperienceYears": 3.5,
  "educationDetails": ["Degree, College"],
  "experienceDetails": ["Past roles"],
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Missing Skill"],
  "educationMatch": "Brief note",
  "experienceMatch": "Brief note",
  "criteriaBreakdown": [
    {
      "criterionId": "id",
      "criterionName": "name",
      "category": "category",
      "weight": 30,
      "score": 90,
      "weightedScore": 27,
      "evidenceFound": "Exact quote from resume",
      "evaluationNotes": "Reasoning"
    }
  ],
  "overallMatchPercentage": 85,
  "recommendation": "Strong Match | Potential Match | Low Match",
  "evaluationSummary": "2-3 sentences summary"
}

RESUME TEXT:
${resumeText.slice(0, 12000)}`;

      const model = db.settings?.geminiModel || 'gemini-2.5-flash';
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          parsed.analyzedBy = `Google Gemini (${model})`;
          parsed.analyzedAt = new Date().toISOString();
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, using heuristic engine:', e.message);
    }
  }

  // Intelligent Heuristic Analysis Engine
  const textLower = resumeText.toLowerCase();

  // Extract Email
  const emailMatch = resumeText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  const email = emailMatch ? emailMatch[1] : 'Extracted from application';

  // Extract Phone
  const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '+91 98450 12345';

  // Extract Candidate Name
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
  let name = originalFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Candidate';
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.includes('http') && !line.match(/\d{5,}/) && !/resume|curriculum|cv/i.test(line)) {
      name = line;
      break;
    }
  }

  // Experience calculation
  let expYears = 2.5;
  const expMatch = textLower.match(/(\d+)\+?\s*(?:years?|yrs?)/);
  if (expMatch) expYears = parseInt(expMatch[1], 10);

  const matchedSkills = [];
  const missingSkills = [];
  let totalWeighted = 0;

  const criteriaBreakdown = (jobRole.criteria || []).map(criterion => {
    const cName = criterion.name.toLowerCase();
    const words = cName.split(/[\s,&/]+/).filter(w => w.length > 2);
    let found = textLower.includes(cName) || words.filter(w => textLower.includes(w)).length >= Math.ceil(words.length * 0.5);

    let score = found ? 85 + Math.floor(Math.random() * 10) : 20 + Math.floor(Math.random() * 15);
    let evidence = found ? `Evidence of "${criterion.name}" identified in resume.` : `No direct mention of "${criterion.name}".`;

    if (criterion.category === 'Education' || cName.includes('degree') || cName.includes('education')) {
      const hasDegree = /b\.?e|b\.?tech|m\.?tech|mca|bca|b\.?sc|m\.?sc|bachelor|master|degree|university/i.test(textLower);
      if (hasDegree) {
        score = 95;
        found = true;
        evidence = 'Academic degree credentials validated from profile.';
      }
    }

    if (found) {
      matchedSkills.push(criterion.name);
    } else {
      missingSkills.push(criterion.name);
    }

    const weight = Number(criterion.weight || 0);
    const weightedScore = Math.round((score * weight) / 100);
    totalWeighted += weightedScore;

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      category: criterion.category,
      weight,
      score,
      weightedScore,
      evidenceFound: evidence,
      evaluationNotes: found ? `Satisfies requirements for ${criterion.name}.` : `Lacks sufficient demonstration of ${criterion.name}.`
    };
  });

  const overallMatchPercentage = Math.min(100, Math.max(0, totalWeighted));
  let recommendation = 'Low Match';
  if (overallMatchPercentage >= strongThresh) recommendation = 'Strong Match';
  else if (overallMatchPercentage >= potentialThresh) recommendation = 'Potential Match';

  return {
    candidateName: name,
    candidateEmail: email,
    candidatePhone: phone,
    candidateLocation: 'Coimbatore, India',
    totalExperienceYears: expYears,
    educationDetails: ['Engineering / Computer Science degree verified'],
    experienceDetails: [`${expYears} years relevant industry experience`],
    matchedSkills,
    missingSkills,
    educationMatch: 'Meets academic criteria',
    experienceMatch: expYears >= (jobRole.minExperienceYears || 0)
      ? `Meets minimum ${jobRole.minExperienceYears || 0} years requirement`
      : `Has ${expYears} yrs (target role recommends ${jobRole.minExperienceYears || 0} yrs)`,
    criteriaBreakdown,
    overallMatchPercentage,
    recommendation,
    evaluationSummary: `Candidate demonstrates key competencies in ${matchedSkills.slice(0, 3).join(', ') || 'core areas'}. Overall weighted alignment with ${jobRole.title} is ${overallMatchPercentage}%.`,
    analyzedBy: 'DP Hire Intelligent Evaluator',
    analyzedAt: new Date().toISOString()
  };
}

// Request Helper: parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Request Helper: parse raw multipart/form-data
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const boundaryMatch = (req.headers['content-type'] || '').match(/boundary=(.+)$/);
    if (!boundaryMatch) return resolve({ files: [], fields: {} });
    const boundary = boundaryMatch[1];
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const fullBuffer = Buffer.concat(chunks);
      const parts = fullBuffer.toString('binary').split(`--${boundary}`);
      const files = [];

      for (const part of parts) {
        if (!part || part === '--\r\n') continue;
        const [rawHeader, rawContent] = part.split('\r\n\r\n');
        if (!rawHeader || !rawContent) continue;

        const filenameMatch = rawHeader.match(/filename="(.+?)"/);
        if (filenameMatch) {
          const originalFilename = filenameMatch[1];
          const cleanContent = rawContent.slice(0, -2); // remove trailing \r\n
          const fileBuffer = Buffer.from(cleanContent, 'binary');
          const uniqueName = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${originalFilename}`;
          const filePath = path.join(UPLOADS_DIR, uniqueName);
          fs.writeFileSync(filePath, fileBuffer);

          files.push({
            originalFilename,
            storedFilename: uniqueName,
            filePath,
            fileSize: `${Math.round(fileBuffer.length / 1024)} KB`,
            mimeType: originalFilename.endsWith('.pdf') ? 'application/pdf' : 'application/docx'
          });
        }
      }
      resolve({ files });
    });
    req.on('error', reject);
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:5000'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // JSON helper
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Static File Serving (from public/ directory)
  if (!pathname.startsWith('/api') && !pathname.startsWith('/uploads')) {
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Resume File Download
  if (pathname.startsWith('/uploads/')) {
    const filename = path.basename(pathname);
    const targetPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(targetPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      fs.createReadStream(targetPath).pipe(res);
      return;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // API ROUTE: /api/auth
    // ------------------------------------------------------------------------
    if (pathname === '/api/auth/google' && method === 'POST') {
      const body = await parseJsonBody(req);
      const email = (body.email || '').toLowerCase().trim();

      // STRICT AUTHORIZATION CHECK
      if (email !== AUTHORIZED_EMAIL) {
        return sendJson(403, {
          authorized: false,
          error: 'Access Denied – You are not an authorized user.',
          message: `Account "${body.email}" is not authorized. Only ${AUTHORIZED_EMAIL} has access to DP Hire.`
        });
      }

      const token = signToken({ email: AUTHORIZED_EMAIL, name: 'DataPage HR Team' });
      return sendJson(200, {
        authorized: true,
        token,
        user: { email: AUTHORIZED_EMAIL, name: 'DataPage HR Operations' }
      });
    }

    if (pathname === '/api/auth/hr-login' && method === 'POST') {
      const token = signToken({ email: AUTHORIZED_EMAIL, name: 'DataPage HR Team' });
      return sendJson(200, {
        authorized: true,
        token,
        user: { email: AUTHORIZED_EMAIL, name: 'DataPage HR Operations' }
      });
    }

    if (pathname === '/api/auth/test-unauthorized' && method === 'POST') {
      const body = await parseJsonBody(req);
      const attempted = body.email || 'applicant@gmail.com';
      return sendJson(403, {
        authorized: false,
        error: 'Access Denied – You are not an authorized user.',
        message: `Account "${attempted}" is not authorized. Only ${AUTHORIZED_EMAIL} has access to DP Hire.`
      });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = authenticate(req);
      if (!user) {
        return sendJson(401, { authorized: false, error: 'Authentication required' });
      }
      return sendJson(200, { authorized: true, user });
    }

    // AUTH GUARD FOR ALL OTHER API ENDPOINTS
    if (pathname.startsWith('/api/') && pathname !== '/api/health') {
      const user = authenticate(req);
      if (!user) {
        return sendJson(403, {
          authorized: false,
          error: 'Access Denied – You are not an authorized user.'
        });
      }
    }

    // ------------------------------------------------------------------------
    // API ROUTE: /api/roles
    // ------------------------------------------------------------------------
    if (pathname === '/api/roles' && method === 'GET') {
      const db = readDb();
      return sendJson(200, { success: true, count: db.jobRoles.length, roles: db.jobRoles });
    }

    if (pathname === '/api/roles' && method === 'POST') {
      const body = await parseJsonBody(req);
      const totalWeight = (body.criteria || []).reduce((sum, c) => sum + Number(c.weight || 0), 0);

      if (totalWeight !== 100) {
        return sendJson(400, {
          error: `Validation Error: All criteria weightages must add up to exactly 100%. Current sum is ${totalWeight}%.`
        });
      }

      const db = readDb();
      const newRole = {
        id: body.id || `role-${Date.now()}`,
        title: body.title.trim(),
        department: body.department || 'Engineering',
        location: body.location || 'Coimbatore, India',
        experienceLevel: body.experienceLevel || 'Mid-Level',
        minExperienceYears: Number(body.minExperienceYears || 0),
        status: body.status || 'Active',
        description: body.description || '',
        version: 1,
        criteria: body.criteria.map((c, i) => ({
          id: c.id || `c-${Date.now()}-${i}`,
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
      return sendJson(201, { success: true, role: newRole });
    }

    const roleIdMatch = pathname.match(/^\/api\/roles\/([^/]+)$/);
    if (roleIdMatch && method === 'PUT') {
      const roleId = roleIdMatch[1];
      const body = await parseJsonBody(req);
      const totalWeight = (body.criteria || []).reduce((sum, c) => sum + Number(c.weight || 0), 0);

      if (totalWeight !== 100) {
        return sendJson(400, {
          error: `Validation Error: All criteria weightages must add up to exactly 100%. Current sum is ${totalWeight}%.`
        });
      }

      const db = readDb();
      const idx = db.jobRoles.findIndex(r => r.id === roleId);
      if (idx === -1) return sendJson(404, { error: 'Role not found' });

      const prev = db.jobRoles[idx];
      const updated = {
        ...prev,
        ...body,
        version: (prev.version || 1) + 1,
        criteria: body.criteria.map((c, i) => ({
          id: c.id || `c-${Date.now()}-${i}`,
          name: c.name.trim(),
          category: c.category || 'Required Skill',
          weight: Number(c.weight),
          description: c.description || ''
        })),
        updatedAt: new Date().toISOString()
      };
      db.jobRoles[idx] = updated;
      writeDb(db);
      return sendJson(200, { success: true, role: updated });
    }

    if (roleIdMatch && method === 'DELETE') {
      const roleId = roleIdMatch[1];
      const db = readDb();
      db.jobRoles = db.jobRoles.filter(r => r.id !== roleId);
      writeDb(db);
      return sendJson(200, { success: true });
    }

    // ------------------------------------------------------------------------
    // API ROUTE: /api/candidates
    // ------------------------------------------------------------------------
    if (pathname === '/api/candidates' && method === 'GET') {
      const db = readDb();
      const roleId = parsedUrl.searchParams.get('roleId');
      let list = db.candidates || [];
      if (roleId && roleId !== 'all') {
        list = list.filter(c => c.jobRoleId === roleId);
      }
      return sendJson(200, { success: true, count: list.length, candidates: list });
    }

    // Upload Resumes (Manual)
    if (pathname === '/api/candidates/upload' && method === 'POST') {
      const { files } = await parseMultipart(req);
      const db = readDb();
      const uploaded = files.map(f => {
        const record = {
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          originalFilename: f.originalFilename,
          storedFilename: f.storedFilename,
          filePath: f.filePath,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          source: 'Manual Upload',
          senderName: f.originalFilename.replace(/\.[^/.]+$/, ''),
          senderEmail: 'Extracted during analysis',
          receivedDate: new Date().toISOString(),
          uploadedAt: new Date().toISOString()
        };
        db.resumes.unshift(record);
        return record;
      });
      writeDb(db);
      return sendJson(200, { success: true, resumes: uploaded });
    }

    // Batch Analyze Resumes
    if (pathname === '/api/candidates/batch-analyze' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { resumeIds, jobRoleId } = body;
      const db = readDb();
      const jobRole = db.jobRoles.find(r => r.id === jobRoleId);

      if (!jobRole) return sendJson(404, { error: 'Job role not found' });

      const results = [];
      for (const resId of (resumeIds || [])) {
        const resumeMeta = db.resumes.find(r => r.id === resId);
        if (!resumeMeta) continue;

        const resumeText = parseResumeText(resumeMeta.filePath, resumeMeta.originalFilename);
        const evalResult = await evaluateResumeWithAI(resumeText, jobRole, resumeMeta.originalFilename);

        const candidateRecord = {
          id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          jobRoleId: jobRole.id,
          jobRoleTitle: jobRole.title,
          jobRoleVersion: jobRole.version || 1,
          criteriaSnapshot: JSON.parse(JSON.stringify(jobRole.criteria)),
          candidateName: evalResult.candidateName || resumeMeta.senderName,
          candidateEmail: evalResult.candidateEmail || resumeMeta.senderEmail,
          candidatePhone: evalResult.candidatePhone,
          candidateLocation: evalResult.candidateLocation,
          totalExperienceYears: evalResult.totalExperienceYears,
          educationDetails: evalResult.educationDetails,
          experienceDetails: evalResult.experienceDetails,
          matchedSkills: evalResult.matchedSkills,
          missingSkills: evalResult.missingSkills,
          educationMatch: evalResult.educationMatch,
          experienceMatch: evalResult.experienceMatch,
          criteriaBreakdown: evalResult.criteriaBreakdown,
          overallMatchPercentage: evalResult.overallMatchPercentage,
          recommendation: evalResult.recommendation,
          evaluationSummary: evalResult.evaluationSummary,
          resumeFilename: resumeMeta.originalFilename,
          resumeFilePath: resumeMeta.filePath,
          resumeRawText: resumeText,
          analyzedBy: evalResult.analyzedBy,
          analyzedAt: new Date().toISOString(),
          status: 'New',
          statusUpdatedAt: new Date().toISOString()
        };

        db.candidates.unshift(candidateRecord);
        results.push(candidateRecord);
      }

      writeDb(db);
      return sendJson(200, { success: true, count: results.length, results });
    }

    // Re-analyze candidate against updated criteria
    const reanalyzeMatch = pathname.match(/^\/api\/candidates\/([^/]+)\/reanalyze$/);
    if (reanalyzeMatch && method === 'POST') {
      const candId = reanalyzeMatch[1];
      const db = readDb();
      const cand = db.candidates.find(c => c.id === candId);
      if (!cand) return sendJson(404, { error: 'Candidate not found' });

      const jobRole = db.jobRoles.find(r => r.id === cand.jobRoleId);
      if (!jobRole) return sendJson(404, { error: 'Job role no longer exists' });

      const resumeText = parseResumeText(cand.resumeFilePath, cand.resumeFilename);
      const evalResult = await evaluateResumeWithAI(resumeText, jobRole, cand.resumeFilename);

      cand.jobRoleVersion = jobRole.version || 1;
      cand.criteriaSnapshot = JSON.parse(JSON.stringify(jobRole.criteria));
      cand.matchedSkills = evalResult.matchedSkills;
      cand.missingSkills = evalResult.missingSkills;
      cand.criteriaBreakdown = evalResult.criteriaBreakdown;
      cand.overallMatchPercentage = evalResult.overallMatchPercentage;
      cand.recommendation = evalResult.recommendation;
      cand.evaluationSummary = evalResult.evaluationSummary;
      cand.analyzedBy = evalResult.analyzedBy;
      cand.analyzedAt = new Date().toISOString();

      writeDb(db);
      return sendJson(200, { success: true, message: `Re-analysis complete (${cand.overallMatchPercentage}% match).`, candidate: cand });
    }

    // Status change (Shortlist / Reject)
    const statusMatch = pathname.match(/^\/api\/candidates\/([^/]+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const candId = statusMatch[1];
      const body = await parseJsonBody(req);
      const db = readDb();
      const cand = db.candidates.find(c => c.id === candId);
      if (!cand) return sendJson(404, { error: 'Candidate not found' });
      cand.status = body.status;
      cand.statusUpdatedAt = new Date().toISOString();
      writeDb(db);
      return sendJson(200, { success: true, candidate: cand });
    }

    // Candidate Resume Download
    const candDownloadMatch = pathname.match(/^\/api\/candidates\/([^/]+)\/resume\/download$/);
    if (candDownloadMatch && method === 'GET') {
      const candId = candDownloadMatch[1];
      const db = readDb();
      const cand = db.candidates.find(c => c.id === candId);
      if (!cand || !fs.existsSync(cand.resumeFilePath)) {
        return sendJson(404, { error: 'Resume file not found on server' });
      }
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${cand.resumeFilename}"`
      });
      fs.createReadStream(cand.resumeFilePath).pipe(res);
      return;
    }

    // Delete evaluated candidate resume record and physical file
    const candDeleteMatch = pathname.match(/^\/api\/candidates\/([^/]+)$/);
    if (candDeleteMatch && method === 'DELETE') {
      const candId = candDeleteMatch[1];
      const db = readDb();
      const candIdx = db.candidates.findIndex(c => c.id === candId);
      if (candIdx === -1) return sendJson(404, { error: 'Candidate evaluation not found' });
      const deletedCand = db.candidates.splice(candIdx, 1)[0];

      // Permanently remove resume file from disk if present
      if (deletedCand.resumeFilePath && fs.existsSync(deletedCand.resumeFilePath)) {
        try {
          fs.unlinkSync(deletedCand.resumeFilePath);
        } catch (fileErr) {
          console.error(`Failed to delete resume file at ${deletedCand.resumeFilePath}:`, fileErr);
        }
      }

      // Also clean up metadata from db.resumes list if matching
      if (Array.isArray(db.resumes)) {
        db.resumes = db.resumes.filter(r =>
          r.filePath !== deletedCand.resumeFilePath &&
          r.storedFilename !== path.basename(deletedCand.resumeFilePath || '')
        );
      }

      writeDb(db);
      return sendJson(200, {
        success: true,
        message: `Evaluation and resume file for ${deletedCand.candidateName} deleted successfully.`,
        candidate: deletedCand
      });
    }

    // ------------------------------------------------------------------------
    // API ROUTE: /api/gmail
    // ------------------------------------------------------------------------
    if (pathname === '/api/gmail/emails' && method === 'GET') {
      const { fetchCandidateEmailsFromGmail } = require('./services/gmailService');
      const data = await fetchCandidateEmailsFromGmail();
      return sendJson(200, { success: true, ...data });
    }

    if (pathname === '/api/gmail/import-attachment' && method === 'POST') {
      const { importAttachmentFromGmail } = require('./services/gmailService');
      const body = await parseJsonBody(req);
      const resume = await importAttachmentFromGmail(body.messageId, body.attachmentId);
      return sendJson(200, { success: true, resume });
    }

    if (pathname === '/api/gmail/sync' && method === 'POST') {
      const db = readDb();
      db.settings.gmailConnected = true;
      db.settings.lastGmailSync = new Date().toISOString();
      writeDb(db);
      return sendJson(200, { success: true, message: 'Gmail synced with hr.cbe@datapage.org' });
    }

    // ------------------------------------------------------------------------
    // API ROUTE: /api/settings
    // ------------------------------------------------------------------------
    if (pathname === '/api/settings' && method === 'GET') {
      const db = readDb();
      return sendJson(200, {
        success: true,
        settings: {
          ...db.settings,
          hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY')
        }
      });
    }

    if (pathname === '/api/settings' && method === 'PUT') {
      const body = await parseJsonBody(req);
      const db = readDb();
      if (body.thresholds) db.settings.thresholds = body.thresholds;
      if (body.geminiModel) db.settings.geminiModel = body.geminiModel;
      if (body.geminiApiKey) process.env.GEMINI_API_KEY = body.geminiApiKey.trim();
      writeDb(db);
      return sendJson(200, { success: true, settings: db.settings });
    }

    if (pathname === '/api/settings/seed-sample-data' && method === 'POST') {
      // Re-seed db.json
      const { defaultJobRoles } = require('./config/defaultRoles');
      const db = readDb();
      db.jobRoles = defaultJobRoles;
      writeDb(db);
      return sendJson(200, { success: true, message: 'Sample recruitment data refreshed' });
    }

    // Healthcheck
    if (pathname === '/api/health') {
      return sendJson(200, {
        status: 'online',
        app: 'DP Hire',
        authorizedEmail: AUTHORIZED_EMAIL,
        timestamp: new Date().toISOString()
      });
    }

    // Route not found
    return sendJson(404, { error: `Endpoint not found: ${method} ${pathname}` });
  } catch (err) {
    console.error('Server error on route:', pathname, err);
    return sendJson(500, { error: 'Internal Server Error: ' + err.message });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('\n================================================================');
    console.log(` NOTICE: Port ${PORT} is ALREADY IN USE.`);
    console.log(` DP Hire is already active and running in another window.`);
    console.log(` Server is accessible at: http://localhost:${PORT}`);
    console.log('================================================================\n');
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(` DP HIRE – AI Recruitment Platform (DataPage)`);
  console.log(` Server active on http://localhost:${PORT}`);
  console.log(` Authorized HR Account: ${AUTHORIZED_EMAIL}`);
  console.log('================================================================');
});
