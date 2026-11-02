# DP Hire – AI-Powered Recruitment Application

**DP Hire** is a modern, corporate web application built specifically for the HR department at **DataPage** (Coimbatore, India). The application automates candidate resume ingestion, parses document text, evaluates skills against dynamic recruitment criteria configured by HR, and provides transparent, weighted scoring with Google Gemini AI.

---

## 🌟 Key Features & Architecture

### 1. Authentication & Access Restriction
- **Restricted Access**: Exclusively accessible to the authorized HR administrator: `hr.cbe@datapage.org`.
- **Google Sign-In**: Integrated Google OAuth authentication flow.
- **Strict Lockdown**: Any other Google account attempting to sign in is blocked immediately with:
  > **"Access Denied – You are not an authorized user."**
- **Protected Routes**: Both frontend and backend API endpoints enforce JWT authorization checks.

### 2. Gmail Integration & Resume Ingestion
- **Official HR Gmail Connection**: Connects with `hr.cbe@datapage.org` to retrieve candidate applications.
- **Attachment Extraction**: Filters and extracts candidate resumes in **PDF** and **DOCX** formats.
- **Smart Attachment Filter**: Automatically excludes logos, signatures, and unrelated attachments.
- **Manual Upload**: High-performance multi-file upload for PDF/DOCX resumes as a direct alternative.
- **Display Details**: Candidate name, email address, received date, and resume filename.

### 3. Dynamic Job Role & Criteria Management
- **Role Independence**: Each job role maintains its own isolated criteria. Updating *Python Developer* requirements will never affect *Java Developer* or other roles.
- **Custom Criteria Builder**: Add/edit required technical skills, preferred skills, educational qualifications, minimum experience, and certifications.
- **Weighted Scoring**: Assign percentage weightages to each criterion.
- **100% Weightage Validation**: Strict validation ensures all criteria weightages sum up to exactly **100%** before saving.
- **Criteria Versioning**: Tracks criteria updates (`v1`, `v2`, etc.) and enables re-analyzing past candidates against updated role criteria.

### 4. AI Resume Analysis (Google Gemini)
- **Deep Resume Parsing**: Extracts candidate credentials, work experience history, projects, and certifications.
- **Evidence-Based Matching**: Never assumes a skill unless supporting evidence is present in the resume.
- **Formula**:
  $$\text{Overall Match \%} = \sum \frac{\text{Criterion Score}_i \times \text{Weight}_i}{100}$$
- **Transparent Scorecard**: Detailed criterion-by-criterion breakdown showing exact score, weight, evidence quote, and evaluation reasoning.

### 5. Candidate Matching Results & Categorization
- **Results Table**: Candidate name, email, role, overall match %, matched skills, missing requirements, and AI summary.
- **Default Match Tiers**:
  - **80–100%**: Strong Match (Emerald)
  - **60–79%**: Potential Match (Amber)
  - **Below 60%**: Low Match (Rose)
- **Configurable in Settings**: HR can modify these threshold percentages at any time.
- **Sorting & Filtering**: Sort by highest match %, filter by role, tier, and shortlist status.

### 6. HR Overview Dashboard
- Metric cards: Resumes Received, Resumes Analysed, Strong Matches, Potential Matches, Low Matches, Shortlisted Candidates.
- Interactive multi-segment visual progress chart showing match distribution.
- Role-by-role recruitment funnel and quick actions.

### 7. Shortlisting & Candidate Management
- HR can manually shortlist or reject candidates.
- Dedicated **Shortlisted Candidates** portal with quick contact options and CSV export.
- Re-analyze resumes whenever job criteria change.
- Raw resume text viewer and original document download.

---

## 🚀 Quick Start Guide

### Start the Application (Zero Dependencies Required)
DP Hire includes a self-contained production server using Node.js built-ins that runs immediately without waiting for package installations:

```bash
# Start DP Hire Server on http://localhost:5000
npm start
# or
node server/standaloneServer.js
```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🔑 Environment Configuration (`.env`)

Create or edit `.env` in the root directory:

```env
PORT=5000
AUTHORIZED_EMAIL=hr.cbe@datapage.org
JWT_SECRET=dp-hire-datapage-secret-cbe-2025

# Google Gemini API Key (Get from https://aistudio.google.com/)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Google Cloud OAuth 2.0 (For Google Sign-In & live Gmail API)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

> **Note**: Even without an external Gemini API key, DP Hire includes an intelligent heuristic evaluation engine that accurately parses and scores resumes against HR's exact criteria weights so testing is always seamless.

---

## 🧪 Testing the Access Control Policy

To verify **Requirement 1** (Access Restriction):
1. Navigate to the login screen.
2. Click **"Test Unauthorized Google Account"**.
3. Observe the rejection banner:
   > **"Access Denied – You are not an authorized user."**
4. Click **"Google Sign-In as hr.cbe@datapage.org"** to gain access to the HR recruitment dashboard.

---

## 📁 Project Structure

```
dp-hire/
├── server/
│   ├── standaloneServer.js    # Self-contained zero-dependency server & API
│   ├── server.js              # Express API server
│   ├── config/
│   │   └── defaultRoles.js    # Pre-configured job roles & criteria
│   ├── services/
│   │   ├── geminiService.js   # Gemini AI prompt engine & weighted scoring
│   │   ├── resumeParser.js    # PDF & DOCX text extraction
│   │   ├── gmailService.js    # Gmail API & candidate application sync
│   │   └── storageService.js  # Persistent JSON database operations
│   └── routes/                # Express modular route handlers
├── src/                       # React 18 frontend source code
│   ├── components/            # Sidebar, Header, Modals, StatCards
│   ├── pages/                 # Dashboard, JobRoles, Import, Analyse, Results, etc.
│   ├── context/               # AuthContext (Google Sign-In & strict email check)
│   └── services/              # API client methods
├── public/
│   ├── index.html             # Client entry point
│   └── app.js                 # Complete reactive SPA interface
├── data/
│   ├── db.json                # Persistent recruitment data
│   └── uploads/               # Stored candidate resume files
├── .env                       # Environment configuration
└── package.json               # Scripts & dependencies
```

---

*DP Hire – Developed for DataPage HR Operations, Coimbatore.*
