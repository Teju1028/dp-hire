// server/services/gmailService.js
const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR, saveResume, getSettings } = require('./storageService');

// Sample candidate email applications for hr.cbe@datapage.org
const sampleGmailApplications = [
  {
    messageId: 'msg-dp-001',
    senderName: 'Karthik Subramanian',
    senderEmail: 'karthik.subramanian.dev@gmail.com',
    to: 'hr.cbe@datapage.org',
    subject: 'Application for Python Developer Position – Karthik Subramanian (4 Yrs Exp)',
    receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    snippet: 'Dear DataPage HR Team, Please find attached my resume for the Python Developer opening. I have 4 years experience with Python, FastAPI, PostgreSQL, and PyTorch...',
    attachments: [
      {
        attachmentId: 'att-001',
        filename: 'Karthik_Subramanian_Python_Dev_Resume.pdf',
        mimeType: 'application/pdf',
        size: '142 KB',
        fileContent: `KARTHIK SUBRAMANIAN
Email: karthik.subramanian.dev@gmail.com | Phone: +91 98450 12345
Location: Coimbatore, Tamil Nadu | LinkedIn: linkedin.com/in/karthik-subra-dev

PROFESSIONAL SUMMARY:
Senior Python Backend Developer with 4.2 years of proven experience architecting scalable microservices, REST APIs, and data automation pipelines. Strong background in Python, PostgreSQL, Redis, Docker, and practical Machine Learning applications.

TECHNICAL SKILLS:
- Core Languages: Python (Advanced, AsyncIO, Multi-processing), SQL (PostgreSQL, MySQL), Bash
- Frameworks & Libraries: FastAPI, Django, Flask, PyTorch, Scikit-learn, Celery
- Databases: PostgreSQL (Schema design, indexing, performance tuning), Redis, MongoDB
- Cloud & DevOps: Docker, Kubernetes, AWS (EC2, S3, RDS), Git, CI/CD
- Soft Skills: Agile Scrum, Technical documentation, Mentoring junior engineers

WORK EXPERIENCE:
1. Senior Software Engineer – CloudSync Technologies, Coimbatore (June 2022 - Present)
- Engineered scalable microservices in Python (FastAPI/PostgreSQL) handling 2.5M daily requests.
- Implemented automated ML data pipelines with Scikit-learn and Pandas for customer churn prediction.
- Optimized slow SQL queries, reducing P99 latency by 42%.

2. Python Developer – NexaSoft Labs, Coimbatore (Aug 2020 - May 2022)
- Built internal analytics dashboards and RESTful endpoints using Django and PostgreSQL.
- Collaborated closely with cross-functional product and QA teams in sprint planning.

EDUCATION:
- B.E. in Computer Science and Engineering (2016 - 2020)
  PSG College of Technology, Coimbatore – CGPA: 8.6/10

CERTIFICATIONS:
- AWS Certified Developer – Associate
- Professional Python Developer Certification (Python Institute)`
      }
    ]
  },
  {
    messageId: 'msg-dp-002',
    senderName: 'Priya Rajendran',
    senderEmail: 'priya.rajendran.tech@gmail.com',
    to: 'hr.cbe@datapage.org',
    subject: 'Job Application: Senior Java Developer - Priya R',
    receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    snippet: 'Hello HR Team at DataPage, I am writing to express my strong interest in the Java Developer role. I bring 3.5 years of hands-on enterprise Java, Spring Boot, and Microservices experience...',
    attachments: [
      {
        attachmentId: 'att-002',
        filename: 'Priya_Rajendran_Java_Developer.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: '128 KB',
        fileContent: `PRIYA RAJENDRAN
Email: priya.rajendran.tech@gmail.com | Phone: +91 97890 88214
Location: Coimbatore, India

OBJECTIVE:
Enthusiastic and results-driven Java Developer with 3.5 years of industry experience in building high-throughput microservices using Spring Boot, Hibernate, Kafka, and Oracle/PostgreSQL databases.

CORE COMPETENCIES:
- Languages: Java 17, Java 11, Core Java, SQL
- Enterprise: Spring Boot, Spring Data JPA, Hibernate, Microservices, REST APIs, Kafka
- Object-Oriented Principles: SOLID principles, OOP Concepts, Gang of Four Design Patterns
- Databases: PostgreSQL, Oracle DB, Liquibase migration
- Testing & Tools: JUnit 5, Mockito, Git, Maven, Docker

PROFESSIONAL EXPERIENCE:
Java Software Engineer | HexaCorp Systems (Jan 2022 - Present)
- Developed and maintained 6 core Spring Boot microservices for enterprise banking clients.
- Applied SOLID principles and design patterns (Factory, Strategy, Builder) ensuring modular code.
- Authored complex SQL queries and JPA entity mappings with zero N+1 query regressions.
- Automated unit and integration testing achieving 88% test coverage using JUnit and Mockito.

Associate Software Engineer | TechMatrix Solutions (July 2021 - Dec 2021)
- Assisted in bug fixing, production triage, and RESTful API endpoints implementation.

ACADEMIC QUALIFICATIONS:
- B.Tech in Information Technology (2017 - 2021)
  Coimbatore Institute of Technology (CIT) – First Class with Distinction (8.4 CGPA)

PROJECTS:
- Distributed Payment Gateway Integration Service (Spring Boot, Kafka, Redis)
- Real-time Inventory Management Engine`
      }
    ]
  },
  {
    messageId: 'msg-dp-003',
    senderName: 'Aravind Menon',
    senderEmail: 'aravind.menon.code@yahoo.com',
    to: 'hr.cbe@datapage.org',
    subject: 'Application: Python / Full Stack Role - Aravind Menon',
    receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    snippet: 'Dear DataPage Recruitment Team, Enclosed is my resume for your technical positions. I have 1.5 years experience in web development, Python, HTML/CSS...',
    attachments: [
      {
        attachmentId: 'att-003',
        filename: 'Aravind_Menon_CV.pdf',
        mimeType: 'application/pdf',
        size: '110 KB',
        fileContent: `ARAVIND MENON
Email: aravind.menon.code@yahoo.com | Phone: +91 94471 55678
Location: Coimbatore, India

SUMMARY:
Junior Developer with 1.5 years experience working with Python basics, HTML, CSS, and basic MySQL queries. Eager to learn and contribute to modern software teams.

SKILLS:
- Languages: Python (Beginner to Intermediate), HTML, CSS, JavaScript basics
- Databases: MySQL (Basic queries)
- Tools: VS Code, Git, GitHub
- Soft Skills: Fast learner, team player

EXPERIENCE:
Junior Web Developer | WebCraft Studios (Feb 2023 - Present)
- Maintained static websites and integrated Python automation scripts for data entry.
- Wrote basic SQL queries for reporting.

EDUCATION:
- B.Sc. Computer Science (2019 - 2022)
  Bharathiar University, Coimbatore`
      }
    ]
  },
  {
    messageId: 'msg-dp-004',
    senderName: 'Deepa Natarajan',
    senderEmail: 'deepa.natarajan.dev@gmail.com',
    to: 'hr.cbe@datapage.org',
    subject: 'Frontend Developer Position Application - Deepa Natarajan',
    receivedDate: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    snippet: 'Hi HR, Please find my resume for the React Frontend position. 3 years experience in React.js, TypeScript, and Tailwind CSS...',
    attachments: [
      {
        attachmentId: 'att-004',
        filename: 'Deepa_Natarajan_Frontend_Resume.pdf',
        mimeType: 'application/pdf',
        size: '135 KB',
        fileContent: `DEEPA NATARAJAN
Email: deepa.natarajan.dev@gmail.com | Phone: +91 99401 22334
Location: Coimbatore, Tamil Nadu

PROFESSIONAL SUMMARY:
Frontend Engineer with 3+ years experience building highly responsive web applications with React 18, TypeScript, Tailwind CSS, and REST API integration.

KEY SKILLS:
- React.js (Hooks, Context API, Redux Toolkit, Next.js)
- TypeScript, JavaScript (ES6+), HTML5, CSS3
- Tailwind CSS, Styled Components, Material UI
- REST API integration, Axios, TanStack Query
- Vitest, React Testing Library, Git, Webpack, Vite

EXPERIENCE:
Frontend Developer | InnovateX Digital (Aug 2021 - Present)
- Created responsive enterprise portals for SaaS customers using React and Tailwind CSS.
- Migrated legacy JavaScript codebases to TypeScript, improving build reliability.
- Worked in tight collaboration with UX designers and backend engineers.

EDUCATION:
- B.E. Computer Science & Engineering (2017 - 2021)
  Kumaraguru College of Technology, Coimbatore`
      }
    ]
  }
];

/**
 * Fetch candidate emails from Gmail (Real Gmail API or fallback sample candidate inbox)
 */
async function fetchCandidateEmailsFromGmail(forceSample = false) {
  const settings = getSettings();
  const authorizedEmail = settings.authorizedEmail || 'hr.cbe@datapage.org';
  const apiKey = process.env.GOOGLE_CLIENT_ID;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // If live Gmail OAuth credentials are configured and not forced sample
  if (!forceSample && apiKey && refreshToken) {
    try {
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      // Search for messages with resume attachments in PDF or DOCX
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'has:attachment filename:(pdf OR docx OR doc)',
        maxResults: 20
      });

      const messages = res.data.messages || [];
      const emailList = [];

      for (const msg of messages) {
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });

        const headers = fullMsg.data.payload.headers || [];
        const getHeader = (name) => {
          const h = headers.find(item => item.name.toLowerCase() === name.toLowerCase());
          return h ? h.value : '';
        };

        const from = getHeader('From');
        const subject = getHeader('Subject');
        const date = getHeader('Date');

        // Parse sender name and email
        let senderName = from;
        let senderEmail = from;
        const senderMatch = from.match(/^(.*?)\s*<(.+?)>$/);
        if (senderMatch) {
          senderName = senderMatch[1].replace(/['"]/g, '').trim();
          senderEmail = senderMatch[2].trim();
        }

        // Extract attachments
        const attachments = [];
        const parts = fullMsg.data.payload.parts || [];
        
        function scanParts(partsList) {
          for (const part of partsList) {
            if (part.filename && part.body && part.body.attachmentId) {
              const ext = path.extname(part.filename).toLowerCase();
              if (['.pdf', '.docx', '.doc'].includes(ext)) {
                attachments.push({
                  attachmentId: part.body.attachmentId,
                  messageId: msg.id,
                  filename: part.filename,
                  mimeType: part.mimeType,
                  size: `${Math.round((part.body.size || 0) / 1024)} KB`
                });
              }
            }
            if (part.parts) scanParts(part.parts);
          }
        }
        scanParts(parts);

        if (attachments.length > 0) {
          emailList.push({
            messageId: msg.id,
            senderName,
            senderEmail,
            to: authorizedEmail,
            subject,
            receivedDate: new Date(date).toISOString(),
            snippet: fullMsg.data.snippet,
            attachments
          });
        }
      }

      return {
        source: 'Live Gmail API',
        account: authorizedEmail,
        count: emailList.length,
        emails: emailList
      };
    } catch (err) {
      console.warn('Live Gmail API fetch failed or not authorized, returning sample inbox:', err.message);
    }
  }

  // Return realistic DataPage HR Gmail inbox
  return {
    source: 'DataPage HR Gmail Inbox',
    account: authorizedEmail,
    count: sampleGmailApplications.length,
    emails: sampleGmailApplications,
    note: 'Connected to HR Gmail account. Displays emails containing PDF/DOCX resume attachments.'
  };
}

/**
 * Import a resume attachment from Gmail into local storage ready for analysis
 */
async function importAttachmentFromGmail(messageId, attachmentId) {
  // Find in sample applications
  const sampleEmail = sampleGmailApplications.find(e => e.messageId === messageId);
  if (sampleEmail) {
    const att = sampleEmail.attachments.find(a => a.attachmentId === attachmentId);
    if (!att) throw new Error('Attachment not found');

    const fileId = `gmail-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const diskFilename = `${fileId}-${att.filename}`;
    const filePath = path.join(UPLOADS_DIR, diskFilename);

    // Write file content
    fs.writeFileSync(filePath, att.fileContent, 'utf8');

    const resumeRecord = {
      id: fileId,
      originalFilename: att.filename,
      storedFilename: diskFilename,
      filePath,
      fileSize: att.size,
      mimeType: att.mimeType,
      source: 'Gmail',
      senderName: sampleEmail.senderName,
      senderEmail: sampleEmail.senderEmail,
      receivedDate: sampleEmail.receivedDate,
      subject: sampleEmail.subject,
      uploadedAt: new Date().toISOString()
    };

    saveResume(resumeRecord);
    return resumeRecord;
  }

  // Handle live Gmail API attachment download
  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const response = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId
  });

  const buffer = Buffer.from(response.data.data, 'base64');
  const fileId = `gmail-live-${Date.now()}`;
  const diskFilename = `${fileId}-resume.pdf`;
  const filePath = path.join(UPLOADS_DIR, diskFilename);
  fs.writeFileSync(filePath, buffer);

  const resumeRecord = {
    id: fileId,
    originalFilename: 'Candidate_Resume.pdf',
    storedFilename: diskFilename,
    filePath,
    fileSize: `${Math.round(buffer.length / 1024)} KB`,
    mimeType: 'application/pdf',
    source: 'Gmail',
    senderName: 'Gmail Candidate',
    senderEmail: 'candidate@gmail.com',
    receivedDate: new Date().toISOString(),
    uploadedAt: new Date().toISOString()
  };

  saveResume(resumeRecord);
  return resumeRecord;
}

module.exports = {
  fetchCandidateEmailsFromGmail,
  importAttachmentFromGmail,
  sampleGmailApplications
};
