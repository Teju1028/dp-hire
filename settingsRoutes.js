// server/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getSettings, updateSettings, writeDb, readDb } = require('../services/storageService');
const { defaultJobRoles } = require('../config/defaultRoles');
const { sampleGmailApplications } = require('../services/gmailService');

router.use(requireAuth);

/**
 * GET current settings
 */
router.get('/', (req, res) => {
  try {
    const settings = getSettings();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY');
    const hasGoogleAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    res.json({
      success: true,
      settings: {
        ...settings,
        hasGeminiKey,
        hasGoogleAuth
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT update settings (e.g. thresholds, company name)
 */
router.put('/', (req, res) => {
  try {
    const { thresholds, geminiModel, geminiApiKey } = req.body;

    if (thresholds) {
      const strong = Number(thresholds.strongMatch);
      const potential = Number(thresholds.potentialMatch);

      if (isNaN(strong) || isNaN(potential) || strong <= potential || strong > 100 || potential < 0) {
        return res.status(400).json({
          error: 'Invalid thresholds. Strong Match threshold must be greater than Potential Match threshold (0-100).'
        });
      }
    }

    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
    }

    const updated = updateSettings({
      thresholds,
      geminiModel
    });

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      settings: updated
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST reset or seed sample data
 */
router.post('/seed-sample-data', async (req, res) => {
  try {
    const db = readDb();
    db.jobRoles = defaultJobRoles;
    
    // Add sample analyzed candidates for instant out-of-the-box demonstration
    const sampleCandidates = [
      {
        id: 'cand-demo-001',
        jobRoleId: 'role-python-dev',
        jobRoleTitle: 'Python Developer',
        jobRoleVersion: 1,
        criteriaSnapshot: defaultJobRoles[0].criteria,
        candidateName: 'Karthik Subramanian',
        candidateEmail: 'karthik.subramanian.dev@gmail.com',
        candidatePhone: '+91 98450 12345',
        candidateLocation: 'Coimbatore, Tamil Nadu',
        totalExperienceYears: 4.2,
        educationDetails: ['B.E. Computer Science – PSG College of Technology, CGPA 8.6'],
        experienceDetails: [
          'Senior Software Engineer at CloudSync Technologies (2.5 years)',
          'Python Developer at NexaSoft Labs (1.8 years)'
        ],
        matchedSkills: ['Python Programming', 'SQL & Database Design', 'Machine Learning / AI', 'Communication & Teamwork', 'Problem Solving & Algorithms', 'Education (B.Tech/BE/MCA/M.Sc)'],
        missingSkills: [],
        educationMatch: 'Meets requirements (B.E. Computer Science, PSG College of Technology)',
        experienceMatch: 'Exceeds minimum 3 years requirement (4.2 years total)',
        criteriaBreakdown: [
          { criterionId: 'c1', criterionName: 'Python Programming', category: 'Required Skill', weight: 30, score: 95, weightedScore: 28.5, evidenceFound: '4+ yrs production Python, FastAPI, Django, AsyncIO, Celery', evaluationNotes: 'Comprehensive backend engineering experience with high-scale services.' },
          { criterionId: 'c2', criterionName: 'SQL & Database Design', category: 'Required Skill', weight: 20, score: 90, weightedScore: 18.0, evidenceFound: 'PostgreSQL schema design, query optimization, indexing, Redis', evaluationNotes: 'Proven SQL tuning reducing P99 latency by 42%.' },
          { criterionId: 'c3', criterionName: 'Machine Learning / AI', category: 'Preferred Skill', weight: 20, score: 85, weightedScore: 17.0, evidenceFound: 'PyTorch, Scikit-learn, ML data pipelines for customer churn', evaluationNotes: 'Hands-on ML pipeline deployment experience in production.' },
          { criterionId: 'c4', criterionName: 'Communication & Teamwork', category: 'Soft Skill', weight: 10, score: 90, weightedScore: 9.0, evidenceFound: 'Mentoring junior engineers, cross-functional sprint planning', evaluationNotes: 'Strong leadership and team collaboration attributes.' },
          { criterionId: 'c5', criterionName: 'Problem Solving & Algorithms', category: 'Technical Skill', weight: 10, score: 90, weightedScore: 9.0, evidenceFound: 'System architecture, microservice design handling 2.5M req/day', evaluationNotes: 'Solid problem-solving background in distributed environments.' },
          { criterionId: 'c6', criterionName: 'Education (B.Tech/BE/MCA/M.Sc)', category: 'Education', weight: 10, score: 95, weightedScore: 9.5, evidenceFound: 'PSG College of Technology, B.E. CSE (CGPA 8.6/10)', evaluationNotes: 'Tier-1 engineering qualification.' }
        ],
        overallMatchPercentage: 91,
        recommendation: 'Strong Match',
        evaluationSummary: 'Outstanding candidate with 4.2 years of Python engineering. Strong in FastAPI, PostgreSQL, and ML pipelines with Tier-1 engineering degree from Coimbatore. Highly recommended for interview.',
        resumeFilename: 'Karthik_Subramanian_Python_Dev_Resume.pdf',
        resumeFilePath: '',
        analyzedBy: 'Google Gemini 2.5 Flash',
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        status: 'Shortlisted',
        statusUpdatedAt: new Date().toISOString()
      },
      {
        id: 'cand-demo-002',
        jobRoleId: 'role-java-dev',
        jobRoleTitle: 'Java Developer',
        jobRoleVersion: 1,
        criteriaSnapshot: defaultJobRoles[1].criteria,
        candidateName: 'Priya Rajendran',
        candidateEmail: 'priya.rajendran.tech@gmail.com',
        candidatePhone: '+91 97890 88214',
        candidateLocation: 'Coimbatore, India',
        totalExperienceYears: 3.5,
        educationDetails: ['B.Tech IT – Coimbatore Institute of Technology (CIT), Distinction (8.4 CGPA)'],
        experienceDetails: [
          'Java Software Engineer at HexaCorp Systems (2+ years)',
          'Associate Software Engineer at TechMatrix (6 months)'
        ],
        matchedSkills: ['Core Java & Multi-threading', 'OOP Concepts & Design Patterns', 'SQL & Relational Databases', 'Spring Boot & Microservices', 'Education (Degree in CS/IT)'],
        missingSkills: [],
        educationMatch: 'Meets requirements (B.Tech IT, First Class Distinction)',
        experienceMatch: 'Meets 2+ years requirement (3.5 years active experience)',
        criteriaBreakdown: [
          { criterionId: 'c1', criterionName: 'Core Java & Multi-threading', category: 'Required Skill', weight: 35, score: 92, weightedScore: 32.2, evidenceFound: 'Java 17, Java 11, Concurrency, JVM internals', evaluationNotes: 'Deep understanding of modern Java paradigms.' },
          { criterionId: 'c2', criterionName: 'OOP Concepts & Design Patterns', category: 'Required Skill', weight: 20, score: 90, weightedScore: 18.0, evidenceFound: 'SOLID principles, Factory, Strategy, Builder design patterns', evaluationNotes: 'Clean architecture mindset demonstrated in past projects.' },
          { criterionId: 'c3', criterionName: 'SQL & Relational Databases', category: 'Required Skill', weight: 15, score: 85, weightedScore: 12.8, evidenceFound: 'PostgreSQL, Oracle DB, Liquibase, JPA entity mapping', evaluationNotes: 'Proficient database and ORM experience.' },
          { criterionId: 'c4', criterionName: 'Spring Boot & Microservices', category: 'Technical Skill', weight: 15, score: 88, weightedScore: 13.2, evidenceFound: '6 core Spring Boot microservices, Kafka, Docker', evaluationNotes: 'Enterprise microservices production experience.' },
          { criterionId: 'c5', criterionName: 'Problem Solving', category: 'Soft Skill', weight: 10, score: 80, weightedScore: 8.0, evidenceFound: 'JUnit 5, Mockito, zero N+1 regressions', evaluationNotes: 'Demonstrated proactive debugging and QA.' },
          { criterionId: 'c6', criterionName: 'Education (Degree in CS/IT)', category: 'Education', weight: 5, score: 95, weightedScore: 4.8, evidenceFound: 'CIT Coimbatore, B.Tech IT Distinction', evaluationNotes: 'Strong relevant academic credentials.' }
        ],
        overallMatchPercentage: 89,
        recommendation: 'Strong Match',
        evaluationSummary: 'Exceptional enterprise Java specialist with 3.5 years of Spring Boot, Kafka, and solid architectural principles. Highly aligned with DataPage criteria.',
        resumeFilename: 'Priya_Rajendran_Java_Developer.docx',
        resumeFilePath: '',
        analyzedBy: 'Google Gemini 2.5 Flash',
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        status: 'Shortlisted',
        statusUpdatedAt: new Date().toISOString()
      },
      {
        id: 'cand-demo-003',
        jobRoleId: 'role-python-dev',
        jobRoleTitle: 'Python Developer',
        jobRoleVersion: 1,
        criteriaSnapshot: defaultJobRoles[0].criteria,
        candidateName: 'Aravind Menon',
        candidateEmail: 'aravind.menon.code@yahoo.com',
        candidatePhone: '+91 94471 55678',
        candidateLocation: 'Coimbatore, India',
        totalExperienceYears: 1.5,
        educationDetails: ['B.Sc. Computer Science – Bharathiar University'],
        experienceDetails: ['Junior Web Developer at WebCraft Studios (1.5 years)'],
        matchedSkills: ['Python Programming', 'SQL & Database Design', 'Education (B.Tech/BE/MCA/M.Sc)'],
        missingSkills: ['Machine Learning / AI', 'Problem Solving & Algorithms'],
        educationMatch: 'Partial Match (B.Sc. Computer Science, degree qualification met)',
        experienceMatch: 'Below requirement (1.5 years vs required 3+ years)',
        criteriaBreakdown: [
          { criterionId: 'c1', criterionName: 'Python Programming', category: 'Required Skill', weight: 30, score: 60, weightedScore: 18.0, evidenceFound: 'Python scripting for data entry and basic automation', evaluationNotes: 'Foundational syntax knowledge, lacks advanced async/microservices experience.' },
          { criterionId: 'c2', criterionName: 'SQL & Database Design', category: 'Required Skill', weight: 20, score: 55, weightedScore: 11.0, evidenceFound: 'Basic MySQL queries for reporting', evaluationNotes: 'Basic CRUD query capability, no complex schema design.' },
          { criterionId: 'c3', criterionName: 'Machine Learning / AI', category: 'Preferred Skill', weight: 20, score: 15, weightedScore: 3.0, evidenceFound: 'No ML libraries or models cited', evaluationNotes: 'Missing machine learning requirement.' },
          { criterionId: 'c4', criterionName: 'Communication & Teamwork', category: 'Soft Skill', weight: 10, score: 75, weightedScore: 7.5, evidenceFound: 'Team player in web studio', evaluationNotes: 'Good baseline communication.' },
          { criterionId: 'c5', criterionName: 'Problem Solving & Algorithms', category: 'Technical Skill', weight: 10, score: 50, weightedScore: 5.0, evidenceFound: 'Static site maintenance', evaluationNotes: 'Limited complex algorithmic exposure.' },
          { criterionId: 'c6', criterionName: 'Education (B.Tech/BE/MCA/M.Sc)', category: 'Education', weight: 10, score: 70, weightedScore: 7.0, evidenceFound: 'B.Sc. CS Bharathiar University', evaluationNotes: 'Possesses computer science degree.' }
        ],
        overallMatchPercentage: 52,
        recommendation: 'Low Match',
        evaluationSummary: 'Junior developer with 1.5 years basic experience. Lacks required depth in microservices, advanced SQL, and Machine Learning. Not recommended for mid-to-senior role.',
        resumeFilename: 'Aravind_Menon_CV.pdf',
        resumeFilePath: '',
        analyzedBy: 'Google Gemini 2.5 Flash',
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        status: 'Rejected',
        statusUpdatedAt: new Date().toISOString()
      },
      {
        id: 'cand-demo-004',
        jobRoleId: 'role-frontend-react',
        jobRoleTitle: 'Frontend React Developer',
        jobRoleVersion: 1,
        criteriaSnapshot: defaultJobRoles[2].criteria,
        candidateName: 'Deepa Natarajan',
        candidateEmail: 'deepa.natarajan.dev@gmail.com',
        candidatePhone: '+91 99401 22334',
        candidateLocation: 'Coimbatore, Tamil Nadu',
        totalExperienceYears: 3.2,
        educationDetails: ['B.E. Computer Science – Kumaraguru College of Technology'],
        experienceDetails: ['Frontend Developer at InnovateX Digital (3+ years)'],
        matchedSkills: ['React.js & Hooks', 'JavaScript (ES6+) & TypeScript', 'Tailwind CSS & Responsive UI', 'REST & GraphQL API Integration', 'Code Quality & Testing', 'Education'],
        missingSkills: [],
        educationMatch: 'Meets requirements (B.E. Computer Science, KCT Coimbatore)',
        experienceMatch: 'Meets 2-4 years requirement (3.2 years active experience)',
        criteriaBreakdown: [
          { criterionId: 'c1', criterionName: 'React.js & Hooks', category: 'Required Skill', weight: 35, score: 94, weightedScore: 32.9, evidenceFound: 'React 18, Custom hooks, Context API, Redux Toolkit, Next.js', evaluationNotes: 'Comprehensive modern React toolkit.' },
          { criterionId: 'c2', criterionName: 'JavaScript (ES6+) & TypeScript', category: 'Required Skill', weight: 25, score: 90, weightedScore: 22.5, evidenceFound: 'Migrated JavaScript codebases to TypeScript', evaluationNotes: 'Strong type safety and async proficiency.' },
          { criterionId: 'c3', criterionName: 'Tailwind CSS & Responsive UI', category: 'Technical Skill', weight: 15, score: 95, weightedScore: 14.3, evidenceFound: 'Tailwind CSS, responsive enterprise portals', evaluationNotes: 'Design-system oriented UI developer.' },
          { criterionId: 'c4', criterionName: 'REST & GraphQL API Integration', category: 'Technical Skill', weight: 10, score: 88, weightedScore: 8.8, evidenceFound: 'Axios, TanStack Query, REST API integration', evaluationNotes: 'Effective data fetching and caching practices.' },
          { criterionId: 'c5', criterionName: 'Code Quality & Testing', category: 'Technical Skill', weight: 10, score: 85, weightedScore: 8.5, evidenceFound: 'Vitest, React Testing Library, Git', evaluationNotes: 'Good testing habits.' },
          { criterionId: 'c6', criterionName: 'Education', category: 'Education', weight: 5, score: 95, weightedScore: 4.8, evidenceFound: 'B.E. CSE, Kumaraguru College of Technology', evaluationNotes: 'Accredited engineering degree.' }
        ],
        overallMatchPercentage: 92,
        recommendation: 'Strong Match',
        evaluationSummary: 'Strong Frontend React engineer with 3.2 years of TypeScript, Tailwind CSS, and testing experience. Excellent culture fit for modern web applications.',
        resumeFilename: 'Deepa_Natarajan_Frontend_Resume.pdf',
        resumeFilePath: '',
        analyzedBy: 'Google Gemini 2.5 Flash',
        analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        status: 'New',
        statusUpdatedAt: new Date().toISOString()
      }
    ];

    db.candidates = sampleCandidates;
    writeDb(db);

    res.json({
      success: true,
      message: 'Sample recruitment data initialized successfully.',
      candidatesCount: sampleCandidates.length,
      jobRolesCount: defaultJobRoles.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
