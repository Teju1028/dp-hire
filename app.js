// public/app.js - DP Hire Frontend Application
(function () {
  const AUTHORIZED_EMAIL = 'hr.cbe@datapage.org';
  const API_BASE = '/api';

  // State
  const state = {
    user: null,
    token: localStorage.getItem('dp_hire_token'),
    authError: null,
    currentTab: 'dashboard',
    jobRoles: [],
    candidates: [],
    resumes: [],
    settings: {
      authorizedEmail: AUTHORIZED_EMAIL,
      thresholds: { strongMatch: 80, potentialMatch: 60 },
      geminiModel: 'gemini-2.5-flash'
    },
    gmailEmails: [],
    selectedGmailAttachments: {}, // msgId -> [attId]
    loadingGmail: false,
    syncingGmail: false,
    activeModal: null, // 'roleModal', 'candidateDetail'
    editingRole: null,
    selectedCandidate: null,
    // Analyse tab state
    selectedAnalyzeRoleId: '',
    selectedAnalyzeResumeIds: [],
    isAnalyzing: false,
    analysisProgress: '',
    // Candidate filters
    candidateSearch: '',
    candidateFilterRole: 'all',
    candidateFilterTier: 'all',
    candidateFilterStatus: 'all',
    candidateSortBy: 'score_desc',
    // Shortlisted filter
    shortlistedRoleFilter: 'all',
    // Role modal criteria builder state
    modalRoleTitle: '',
    modalRoleDept: 'Software Engineering',
    modalRoleExp: 3,
    modalRoleDesc: '',
    modalRoleStatus: 'Active',
    modalCriteria: [],
    modalRoleError: '',
    // Manual upload state
    uploadFiles: []
  };

  // API Client Helper
  async function apiCall(endpoint, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || data.message || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // Icons (Inlined SVGs for 100% offline & zero-dependency rendering)
  const icons = {
    dashboard: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    roles: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    import: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
    sparkles: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>',
    users: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    checkCircle: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    settings: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    logout: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    shieldCheck: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>',
    shieldAlert: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    mail: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
    refresh: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    download: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    eye: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    fileText: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    plus: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    trash: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    edit: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    close: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  };

  // Preset role templates
  const PRESET_TEMPLATES = [
    {
      title: 'Python Developer',
      department: 'Software Engineering',
      minExperienceYears: 3,
      description: 'Build backend microservices, async APIs, and ML data workflows.',
      criteria: [
        { name: 'Python', category: 'Required Skill', weight: 30, description: 'Core Python, async programming, data structures' },
        { name: 'SQL', category: 'Required Skill', weight: 20, description: 'PostgreSQL/MySQL schema design and query optimization' },
        { name: 'Machine Learning', category: 'Preferred Skill', weight: 20, description: 'Familiarity with ML frameworks (PyTorch, Scikit-Learn)' },
        { name: 'Communication', category: 'Soft Skill', weight: 10, description: 'Agile communication and technical documentation' },
        { name: 'Problem Solving', category: 'Technical Skill', weight: 10, description: 'System design, complexity analysis, debugging' },
        { name: 'Education', category: 'Education', weight: 10, description: 'Bachelor or Master in Computer Science/Engineering' }
      ]
    },
    {
      title: 'Java Developer',
      department: 'Enterprise Solutions',
      minExperienceYears: 2,
      description: 'Develop enterprise microservices using Spring Boot and cloud architecture.',
      criteria: [
        { name: 'Java', category: 'Required Skill', weight: 35, description: 'Core Java 17+, Concurrency, JVM internals' },
        { name: 'OOP Concepts', category: 'Required Skill', weight: 20, description: 'SOLID principles, clean architecture design patterns' },
        { name: 'SQL', category: 'Required Skill', weight: 15, description: 'Relational databases, ORM (Hibernate/JPA)' },
        { name: 'Spring Boot', category: 'Technical Skill', weight: 15, description: 'REST APIs, microservices, Docker, Kafka' },
        { name: 'Problem Solving', category: 'Soft Skill', weight: 10, description: 'Troubleshooting production bugs, logical reasoning' },
        { name: 'Education', category: 'Education', weight: 5, description: 'Degree in Engineering or Computer Science' }
      ]
    }
  ];

  // Initialize
  async function init() {
    // If no token saved, auto-authenticate for seamless public access
    if (!state.token) {
      try {
        const res = await apiCall('/auth/hr-login', { method: 'POST' });
        if (res && res.token) {
          state.token = res.token;
          state.user = res.user;
          localStorage.setItem('dp_hire_token', res.token);
          await loadData();
        }
      } catch (e) {
        console.warn('Auto-login fallback:', e);
      }
    } else {
      try {
        const res = await apiCall('/auth/me');
        if (res.authorized) {
          state.user = res.user;
          await loadData();
        } else {
          // Re-authenticate
          const hrRes = await apiCall('/auth/hr-login', { method: 'POST' });
          state.token = hrRes.token;
          state.user = hrRes.user;
          localStorage.setItem('dp_hire_token', hrRes.token);
          await loadData();
        }
      } catch (e) {
        logout();
      }
    }
    render();
  }

  async function loadData() {
    try {
      const [rolesRes, candsRes, setRes] = await Promise.all([
        apiCall('/roles').catch(() => ({ roles: [] })),
        apiCall('/candidates').catch(() => ({ candidates: [] })),
        apiCall('/settings').catch(() => ({ settings: {} }))
      ]);
      state.jobRoles = rolesRes.roles || [];
      state.candidates = candsRes.candidates || [];
      state.settings = setRes.settings || state.settings;

      // Extract unique resumes
      const resumeMap = new Map();
      state.candidates.forEach(c => {
        if (!resumeMap.has(c.resumeFilename)) {
          resumeMap.set(c.resumeFilename, {
            id: c.id,
            originalFilename: c.resumeFilename,
            senderName: c.candidateName,
            senderEmail: c.candidateEmail,
            fileSize: '130 KB',
            source: 'System Archive'
          });
        }
      });
      state.resumes = Array.from(resumeMap.values());

      if (!state.selectedAnalyzeRoleId && state.jobRoles.length > 0) {
        state.selectedAnalyzeRoleId = state.jobRoles[0].id;
      }
    } catch (e) {
      console.error('Data load error:', e);
    }
  }

  // Authentication Handlers
  async function loginAsAuthorizedHr() {
    state.authError = null;
    try {
      const res = await apiCall('/auth/hr-login', { method: 'POST' });
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem('dp_hire_token', res.token);
      await loadData();
      render();
    } catch (e) {
      state.authError = e.message;
      render();
    }
  }

  async function testUnauthorizedLogin(email = 'applicant.test@gmail.com') {
    state.authError = null;
    try {
      await apiCall('/auth/test-unauthorized', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (e) {
      // REQUIREMENT 1: Display exact error
      state.authError = e.message || 'Access Denied – You are not an authorized user.';
      render();
    }
  }

  function logout() {
    state.token = null;
    state.user = null;
    state.authError = null;
    localStorage.removeItem('dp_hire_token');
    render();
  }

  // RENDER MAIN APPLICATION
  function render() {
    const root = document.getElementById('app');
    if (!state.user) {
      root.innerHTML = renderLogin();
      bindLoginEvents();
      return;
    }

    root.innerHTML = `
      <div class="flex h-screen bg-gray-950 text-slate-100 overflow-hidden font-sans">
        ${renderSidebar()}
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-950">
          ${renderHeader()}
          <main class="flex-1 overflow-y-auto p-6 bg-gray-950/80">
            ${renderTabContent()}
          </main>
        </div>
      </div>
      ${renderModal()}
    `;
    bindAppEvents();
  }

  // LOGIN VIEW
  function renderLogin() {
    return `
      <div class="min-h-screen bg-gray-950 flex flex-col justify-between relative overflow-hidden font-sans">
        <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

        <header class="p-6 border-b border-gray-900 flex items-center justify-between z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-sky-500/20">
              DP
            </div>
            <div>
              <span class="font-extrabold text-white text-lg tracking-tight">DP Hire</span>
              <span class="text-xs text-slate-400 block font-normal">DataPage Recruitment Engine</span>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
            ${icons.shieldCheck}
            <span>Restricted HR Access</span>
          </div>
        </header>

        <main class="flex-1 flex items-center justify-center p-6 z-10">
          <div class="w-full max-w-md bg-gray-900/95 border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400"></div>

            <div class="text-center mb-6">
              <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4">
                ${icons.shieldCheck}
              </div>
              <h2 class="text-2xl font-black text-white tracking-tight">DataPage HR Login</h2>
              <p class="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                AI-Powered Candidate Resume Analysis & Recruitment Evaluation System
              </p>
            </div>

            <div class="mb-6 p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-slate-400">
              <div class="flex items-center gap-2 text-sky-400 font-semibold mb-1">
                ${icons.mail}
                <span>Access Policy</span>
              </div>
              <p class="leading-relaxed">
                Only the authorized HR administrator (<span class="text-sky-300 font-mono font-medium">${AUTHORIZED_EMAIL}</span>) is permitted to access DP Hire.
              </p>
            </div>

            ${state.authError ? `
              <div class="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
                <div class="text-rose-400 shrink-0 mt-0.5">${icons.shieldAlert}</div>
                <div>
                  <div class="font-bold text-rose-300 text-sm mb-0.5">${state.authError}</div>
                  <div class="text-rose-400/90">Only the official HR address (${AUTHORIZED_EMAIL}) is permitted. Other Google accounts are strictly rejected.</div>
                </div>
              </div>
            ` : ''}

            <div class="space-y-3">
              <button id="btn-login-authorized" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-900/40 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                <span>Google Sign-In as ${AUTHORIZED_EMAIL}</span>
              </button>

              <button id="btn-login-unauthorized" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-slate-300 border border-gray-800 hover:border-rose-900/50 text-xs font-medium transition-all">
                ${icons.shieldAlert}
                <span>Test Unauthorized Google Account (Rejection Test)</span>
              </button>
            </div>
          </div>
        </main>

        <footer class="p-4 border-t border-gray-900 text-center text-xs text-slate-500">
          DataPage (Coimbatore) • DP Hire Recruitment Assistant
        </footer>
      </div>
    `;
  }

  function bindLoginEvents() {
    const btnAuth = document.getElementById('btn-login-authorized');
    if (btnAuth) btnAuth.onclick = loginAsAuthorizedHr;

    const btnUnauth = document.getElementById('btn-login-unauthorized');
    if (btnUnauth) btnUnauth.onclick = () => testUnauthorizedLogin('candidate@gmail.com');
  }

  // SIDEBAR VIEW
  function renderSidebar() {
    const navs = [
      { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
      { id: 'roles', label: 'Manage Job Roles', icon: icons.roles },
      { id: 'import', label: 'Import Resumes', icon: icons.import },
      { id: 'analyse', label: 'Analyse Resumes', icon: icons.sparkles, badge: 'AI' },
      { id: 'candidates', label: 'Candidate Results', icon: icons.users },
      { id: 'shortlisted', label: 'Shortlisted Candidates', icon: icons.checkCircle },
      { id: 'settings', label: 'Settings', icon: icons.settings },
    ];

    return `
      <aside class="w-64 bg-gray-950 border-r border-gray-800/90 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div class="p-5 border-b border-gray-800/80">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-xl tracking-tight">
                DP
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-extrabold text-white text-lg tracking-tight">DP Hire</span>
                  <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">AI</span>
                </div>
                <p class="text-xs text-slate-400">DataPage HR Hub</p>
              </div>
            </div>
          </div>

          <nav class="p-3 space-y-1.5">
            <div class="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Recruitment Navigation
            </div>
            ${navs.map(item => `
              <button
                data-tab="${item.id}"
                class="btn-nav w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  state.currentTab === item.id
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-gray-900 border border-transparent'
                }"
              >
                <div class="flex items-center gap-3">
                  <span class="${state.currentTab === item.id ? 'text-sky-400' : 'text-slate-400'}">${item.icon}</span>
                  <span>${item.label}</span>
                </div>
                ${item.badge ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${item.badge}</span>` : ''}
              </button>
            `).join('')}
          </nav>
        </div>

        <div class="p-3 border-t border-gray-800/80 bg-gray-950">
          <div class="p-2.5 rounded-lg bg-gray-900 border border-gray-800 mb-2">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-emerald-400">${icons.shieldCheck}</span>
              <span class="text-[11px] font-semibold text-emerald-400 uppercase">Authorized HR</span>
            </div>
            <div class="text-xs font-mono font-medium text-slate-200 truncate" title="${AUTHORIZED_EMAIL}">
              ${AUTHORIZED_EMAIL}
            </div>
            <div class="text-[10px] text-slate-500">Coimbatore Department</div>
          </div>

          <button id="btn-logout" class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 rounded-lg transition-all">
            ${icons.logout}
            <span>Logout</span>
          </button>
        </div>
      </aside>
    `;
  }

  // HEADER VIEW
  function renderHeader() {
    const titles = {
      dashboard: { title: 'Recruitment Overview', desc: 'Candidate metrics and distribution for DataPage' },
      roles: { title: 'Manage Job Roles', desc: 'Independent criteria & 100% weightage configuration' },
      import: { title: 'Import Resumes', desc: 'Direct HR Gmail synchronization & multi-file upload' },
      analyse: { title: 'Analyse Resumes with Gemini AI', desc: 'AI-powered evaluation against role criteria' },
      candidates: { title: 'Candidate Matching Results', desc: 'Transparent scores, matching skills, and rankings' },
      shortlisted: { title: 'Shortlisted Candidates', desc: 'Curated pool recommended for technical interview' },
      settings: { title: 'Recruitment Settings', desc: 'Percentage thresholds, AI models, and access policies' },
    };
    const cur = titles[state.currentTab] || { title: 'DP Hire', desc: 'DataPage' };

    return `
      <header class="h-16 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
            ${cur.title}
          </h1>
          <p class="text-xs text-slate-400">${cur.desc}</p>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-header-sync" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-200 border border-gray-700 transition-all">
            <span class="${state.syncingGmail ? 'animate-spin' : ''} text-sky-400">${icons.refresh}</span>
            <span>${state.syncingGmail ? 'Syncing...' : 'Sync Gmail'}</span>
          </button>

          <button id="btn-header-new-role" class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-900 transition-all">
            ${icons.plus}
            <span>New Job Role</span>
          </button>
        </div>
      </header>
    `;
  }

  // TAB ROUTER
  function renderTabContent() {
    switch (state.currentTab) {
      case 'dashboard': return renderDashboard();
      case 'roles': return renderJobRoles();
      case 'import': return renderImportResumes();
      case 'analyse': return renderAnalyse();
      case 'candidates': return renderCandidateResults();
      case 'shortlisted': return renderShortlisted();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  }

  // TAB 1: DASHBOARD
  function renderDashboard() {
    const strongThresh = state.settings.thresholds?.strongMatch || 80;
    const potentialThresh = state.settings.thresholds?.potentialMatch || 60;

    const totalRec = Math.max(state.resumes.length, state.candidates.length);
    const totalAnalysed = state.candidates.length;
    const strongList = state.candidates.filter(c => (c.overallMatchPercentage || 0) >= strongThresh);
    const potentialList = state.candidates.filter(c => {
      const s = c.overallMatchPercentage || 0;
      return s >= potentialThresh && s < strongThresh;
    });
    const lowList = state.candidates.filter(c => (c.overallMatchPercentage || 0) < potentialThresh);
    const shortlistedList = state.candidates.filter(c => c.status === 'Shortlisted');

    const totalForChart = totalAnalysed || 1;
    const strongPct = Math.round((strongList.length / totalForChart) * 100);
    const potentialPct = Math.round((potentialList.length / totalForChart) * 100);
    const lowPct = Math.round((lowList.length / totalForChart) * 100);

    return `
      <div class="space-y-6">
        <!-- Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-gray-900 to-indigo-950/40 border border-sky-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                DataPage Recruitment Platform
              </span>
              <span class="text-xs text-slate-400">Coimbatore Hub</span>
            </div>
            <h2 class="text-xl font-extrabold text-white tracking-tight">AI Talent Screening & Matching Intelligence</h2>
            <p class="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Auto-ingest candidate resumes via official HR Gmail (<span class="text-sky-300 font-mono">${AUTHORIZED_EMAIL}</span>) or manual upload, benchmarked against custom criteria weightages.
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="btn-goto-import px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 text-xs font-semibold border border-gray-700 transition-all flex items-center gap-1.5">
              ${icons.import}
              <span>Import Resumes</span>
            </button>
            <button class="btn-goto-analyse px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-900/40 transition-all flex items-center gap-1.5">
              ${icons.sparkles}
              <span>Run AI Matching</span>
            </button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
            <p class="text-xs text-slate-400 font-medium uppercase mb-1">Resumes Received</p>
            <h3 class="text-2xl font-black text-white font-mono">${totalRec}</h3>
            <p class="text-[11px] text-slate-500 mt-1">Gmail & Uploads</p>
          </div>
          <div class="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
            <p class="text-xs text-slate-400 font-medium uppercase mb-1">Resumes Analysed</p>
            <h3 class="text-2xl font-black text-white font-mono">${totalAnalysed}</h3>
            <p class="text-[11px] text-slate-500 mt-1">Gemini AI Scored</p>
          </div>
          <div class="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p class="text-xs text-slate-400 font-medium uppercase mb-1">Strong Matches</p>
            <h3 class="text-2xl font-black text-emerald-400 font-mono">${strongList.length}</h3>
            <p class="text-[11px] text-slate-500 mt-1">&ge; ${strongThresh}% Score</p>
          </div>
          <div class="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p class="text-xs text-slate-400 font-medium uppercase mb-1">Potential Matches</p>
            <h3 class="text-2xl font-black text-amber-400 font-mono">${potentialList.length}</h3>
            <p class="text-[11px] text-slate-500 mt-1">${potentialThresh}-${strongThresh - 1}% Score</p>
          </div>
          <div class="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
            <p class="text-xs text-slate-400 font-medium uppercase mb-1">Low Matches</p>
            <h3 class="text-2xl font-black text-rose-400 font-mono">${lowList.length}</h3>
            <p class="text-[11px] text-slate-500 mt-1">&lt; ${potentialThresh}% Score</p>
          </div>
          <div class="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
            <p class="text-xs text-slate-400 font-medium uppercase mb-1">Shortlisted</p>
            <h3 class="text-2xl font-black text-purple-400 font-mono">${shortlistedList.length}</h3>
            <p class="text-[11px] text-slate-500 mt-1">HR Selected</p>
          </div>
        </div>

        <!-- Charts and Roles Funnel -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Distribution Progress Bar -->
          <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  ${icons.sparkles}
                  <span>Candidate Match Distribution</span>
                </h3>
                <span class="text-xs text-slate-500 font-mono">${totalAnalysed} profiles</span>
              </div>

              <div class="space-y-4 my-2">
                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="text-emerald-400 font-medium">Strong Match (${strongThresh}–100%)</span>
                    <span class="text-white font-mono font-bold">${strongList.length} (${strongPct}%)</span>
                  </div>
                  <div class="w-full h-2.5 rounded-full bg-gray-950 overflow-hidden border border-gray-800">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: ${strongPct}%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="text-amber-400 font-medium">Potential Match (${potentialThresh}–${strongThresh - 1}%)</span>
                    <span class="text-white font-mono font-bold">${potentialList.length} (${potentialPct}%)</span>
                  </div>
                  <div class="w-full h-2.5 rounded-full bg-gray-950 overflow-hidden border border-gray-800">
                    <div class="h-full bg-amber-500 rounded-full" style="width: ${potentialPct}%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="text-rose-400 font-medium">Low Match (&lt; ${potentialThresh}%)</span>
                    <span class="text-white font-mono font-bold">${lowList.length} (${lowPct}%)</span>
                  </div>
                  <div class="w-full h-2.5 rounded-full bg-gray-950 overflow-hidden border border-gray-800">
                    <div class="h-full bg-rose-500 rounded-full" style="width: ${lowPct}%"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-slate-400">
              <span>Thresholds configurable in Settings</span>
              <button class="btn-goto-settings text-sky-400 hover:underline">Adjust &rarr;</button>
            </div>
          </div>

          <!-- Job Roles Funnel -->
          <div class="lg:col-span-2 p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  ${icons.roles}
                  <span>Job Roles Recruitment Funnel</span>
                </h3>
                <button class="btn-add-role-modal text-xs text-sky-400 hover:underline font-medium">+ New Role</button>
              </div>

              <div class="space-y-3">
                ${state.jobRoles.map(role => {
                  const roleCands = state.candidates.filter(c => c.jobRoleId === role.id);
                  const strongCount = roleCands.filter(c => (c.overallMatchPercentage || 0) >= strongThresh).length;
                  const avgMatch = roleCands.length > 0
                    ? Math.round(roleCands.reduce((s, c) => s + (c.overallMatchPercentage || 0), 0) / roleCands.length)
                    : 0;

                  return `
                    <div class="p-3.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between hover:border-gray-700 transition-all">
                      <div class="min-w-0 flex-1 pr-3">
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-bold text-white truncate">${role.title}</h4>
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-slate-400 font-mono">v${role.version || 1}</span>
                        </div>
                        <p class="text-xs text-slate-400 truncate">${role.department} &bull; ${role.criteria?.length || 0} weighted criteria</p>
                      </div>

                      <div class="flex items-center gap-5 text-right shrink-0">
                        <div>
                          <div class="text-xs font-bold text-white font-mono">${roleCands.length}</div>
                          <div class="text-[10px] text-slate-500 uppercase">Applicants</div>
                        </div>
                        <div>
                          <div class="text-xs font-bold text-emerald-400 font-mono">${strongCount}</div>
                          <div class="text-[10px] text-slate-500 uppercase">Strong</div>
                        </div>
                        <div>
                          <div class="text-xs font-bold text-sky-400 font-mono">${avgMatch}%</div>
                          <div class="text-[10px] text-slate-500 uppercase">Avg Match</div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-slate-400">
              <span>Each job role maintains independent recruitment criteria</span>
              <button class="btn-goto-roles text-sky-400 hover:underline font-semibold">Manage Roles &rarr;</button>
            </div>
          </div>
        </div>

        <!-- Recent Candidates -->
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                ${icons.users}
                <span>Recent AI Candidate Evaluations</span>
              </h3>
              <p class="text-xs text-slate-400">Ranked by weighted criteria match percentage</p>
            </div>
            <button class="btn-goto-candidates text-xs text-sky-400 hover:underline font-semibold">View All (${state.candidates.length}) &rarr;</button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-gray-800 text-slate-400 font-semibold uppercase">
                  <th class="py-3 px-3">Candidate</th>
                  <th class="py-3 px-3">Job Role</th>
                  <th class="py-3 px-3 text-center">Match %</th>
                  <th class="py-3 px-3">Top Matched Skills</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/60">
                ${state.candidates.slice(0, 5).map(c => {
                  const score = c.overallMatchPercentage || 0;
                  const isStrong = score >= strongThresh;
                  const isPotential = score >= potentialThresh && score < strongThresh;

                  return `
                    <tr class="hover:bg-gray-800/40 transition-colors">
                      <td class="py-3 px-3">
                        <div class="font-bold text-white">${c.candidateName}</div>
                        <div class="text-slate-400 font-mono text-[11px]">${c.candidateEmail}</div>
                      </td>
                      <td class="py-3 px-3">
                        <span class="text-slate-300 font-medium">${c.jobRoleTitle}</span>
                        <div class="text-[10px] text-slate-500 font-mono">v${c.jobRoleVersion || 1}</div>
                      </td>
                      <td class="py-3 px-3 text-center">
                        <span class="inline-block px-2.5 py-1 rounded font-mono font-bold text-xs ${
                          isStrong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isPotential ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }">
                          ${score}%
                        </span>
                      </td>
                      <td class="py-3 px-3 max-w-xs">
                        <div class="flex flex-wrap gap-1">
                          ${(c.matchedSkills || []).slice(0, 2).map(s => `
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-slate-300">&check; ${s}</span>
                          `).join('')}
                          ${(c.matchedSkills || []).length > 2 ? `<span class="text-[10px] text-slate-500">+${c.matchedSkills.length - 2}</span>` : ''}
                        </div>
                      </td>
                      <td class="py-3 px-3">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-300' :
                          c.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-gray-800 text-slate-400'
                        }">
                          ${c.status || 'New'}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button data-candidate-id="${c.id}" class="btn-open-scorecard px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-semibold text-xs inline-flex items-center gap-1">
                            ${icons.eye}
                            <span>Scorecard</span>
                          </button>
                          <button data-candidate-id="${c.id}" class="btn-delete-candidate p-1 rounded-lg bg-gray-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all" title="Delete evaluation">
                            ${icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // TAB 2: MANAGE JOB ROLES
  function renderJobRoles() {
    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ${icons.roles}
              <span>Manage Job Roles & Recruitment Criteria</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Configure independent recruitment criteria and percentage weightages for AI evaluation.
            </p>
          </div>
          <button class="btn-add-role-modal px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 transition-all flex items-center gap-2">
            ${icons.plus}
            <span>Add New Job Role</span>
          </button>
        </div>

        <div class="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/25 flex items-center gap-3 text-xs text-indigo-300">
          <span class="text-indigo-400 shrink-0">${icons.shieldCheck}</span>
          <span>
            <strong class="text-white">Strict Role Independence:</strong> Each job role maintains isolated recruitment criteria. Updating requirements for Python Developer will never alter Java Developer or any other role.
          </span>
        </div>

        <!-- Grid of Roles -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${state.jobRoles.map(role => {
            const roleCands = state.candidates.filter(c => c.jobRoleId === role.id);
            const totalWeight = (role.criteria || []).reduce((sum, c) => sum + Number(c.weight || 0), 0);

            return `
              <div class="rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 p-5 flex flex-col justify-between transition-all shadow-lg">
                <div>
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-bold text-white tracking-tight">${role.title}</h3>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">v${role.version || 1}</span>
                      </div>
                      <span class="text-xs text-slate-400">${role.department}</span>
                    </div>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      role.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-gray-800 text-slate-400'
                    }">${role.status || 'Active'}</span>
                  </div>

                  <p class="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">${role.description || ''}</p>

                  <div class="text-[11px] text-slate-400 mb-4 p-2.5 rounded-xl bg-gray-950 border border-gray-800/80 flex items-center justify-between">
                    <span>Min ${role.minExperienceYears || 0} years experience</span>
                    <span class="truncate">${role.location || 'Coimbatore'}</span>
                  </div>

                  <!-- Criteria Breakdown -->
                  <div class="mb-4">
                    <div class="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Criteria Weightages (${role.criteria?.length || 0}):</span>
                      <span class="font-mono ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}">${totalWeight}% Total</span>
                    </div>

                    <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      ${(role.criteria || []).map(c => `
                        <div class="flex items-center justify-between p-2 rounded-lg bg-gray-950/80 border border-gray-800/60 text-xs">
                          <div class="min-w-0 flex-1 pr-2">
                            <div class="font-medium text-slate-200 truncate">${c.name}</div>
                            <div class="text-[10px] text-slate-500">${c.category}</div>
                          </div>
                          <span class="font-mono font-bold text-sky-400 shrink-0">${c.weight}%</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>

                <div class="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span class="text-xs text-slate-400">
                    <strong class="text-white font-bold">${roleCands.length}</strong> candidates
                  </span>

                  <div class="flex items-center gap-1.5">
                    <button data-edit-role-id="${role.id}" class="btn-edit-role p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-300 hover:text-white transition-all" title="Edit role criteria">
                      ${icons.edit}
                    </button>
                    <button data-delete-role-id="${role.id}" class="btn-delete-role p-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-all" title="Delete job role">
                      ${icons.trash}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // TAB 3: IMPORT RESUMES
  function renderImportResumes() {
    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ${icons.import}
              <span>Import Candidate Resumes</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Collect resumes from authorized HR Gmail (<span class="text-sky-300 font-mono">${AUTHORIZED_EMAIL}</span>) or upload multiple files.
            </p>
          </div>
          <button class="btn-goto-analyse px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 transition-all flex items-center gap-2">
            ${icons.sparkles}
            <span>Proceed to AI Analysis &rarr;</span>
          </button>
        </div>

        <!-- Section 1: Gmail Integration -->
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                ${icons.mail}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">HR Gmail Inbox (${AUTHORIZED_EMAIL})</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold uppercase">Connected</span>
                </div>
                <p class="text-xs text-slate-400">
                  Retrieves emails containing PDF/DOCX resume attachments. Unrelated email attachments (logos, images) are automatically ignored.
                </p>
              </div>
            </div>

            <button id="btn-sync-gmail-tab" class="px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-200 text-xs font-semibold border border-gray-700 flex items-center gap-1.5">
              <span class="${state.syncingGmail ? 'animate-spin' : ''} text-sky-400">${icons.refresh}</span>
              <span>${state.syncingGmail ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>
          </div>

          <!-- Email Applications List -->
          <div class="space-y-3">
            ${state.gmailEmails.length === 0 ? `
              <div class="text-center py-8 text-xs text-slate-400 border border-dashed border-gray-800 rounded-xl">
                Click "Sync Gmail" to retrieve incoming applications sent to ${AUTHORIZED_EMAIL}.
              </div>
            ` : state.gmailEmails.map(msg => `
              <div class="p-4 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 transition-all">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-white">${msg.senderName}</span>
                      <span class="text-xs text-sky-400 font-mono">&lt;${msg.senderEmail}&gt;</span>
                    </div>
                    <p class="text-xs text-slate-300 font-medium mt-0.5">${msg.subject}</p>
                  </div>
                  <span class="text-[11px] text-slate-500 font-mono">${new Date(msg.receivedDate).toLocaleDateString()}</span>
                </div>

                <div class="pt-3 border-t border-gray-800/80 flex flex-wrap items-center gap-2">
                  <span class="text-[11px] font-semibold text-slate-400">Extracted Resume Attachment:</span>
                  ${(msg.attachments || []).map(att => `
                    <button data-import-msg-id="${msg.messageId}" data-import-att-id="${att.attachmentId}" class="btn-import-att flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 hover:bg-sky-500/20 text-sky-300 border border-gray-800 hover:border-sky-500/40 transition-all">
                      ${icons.fileText}
                      <span class="font-mono">${att.filename}</span>
                      <span class="text-[10px] text-slate-500">(${att.size})</span>
                      <span class="text-[10px] font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded">&darr; Import</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 2: Manual Upload -->
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            ${icons.fileText}
            <span>Alternative: Manual Resume Upload (PDF / DOCX)</span>
          </h3>

          <div class="border-2 border-dashed border-gray-700 hover:border-sky-500/50 rounded-2xl p-8 text-center bg-gray-950/50 transition-all">
            <div class="text-sky-400 mx-auto mb-2 flex justify-center">${icons.fileText}</div>
            <p class="text-xs text-slate-300 font-medium mb-3">Upload candidate resume documents from your computer</p>
            <input type="file" id="input-manual-resumes" multiple accept=".pdf,.docx,.doc" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer" />
            <div class="text-[11px] text-slate-500 mt-2">Supported formats: .PDF, .DOCX, .DOC (Supports multiple files)</div>
          </div>
        </div>
      </div>
    `;
  }

  // TAB 4: ANALYSE RESUMES
  function renderAnalyse() {
    const selectedRole = state.jobRoles.find(r => r.id === state.selectedAnalyzeRoleId) || state.jobRoles[0];

    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            ${icons.sparkles}
            <span>AI Resume Analysis & Matching Engine</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Gemini AI benchmarks candidate resumes against your configured recruitment criteria and percentage weights.
          </p>
        </div>

        <!-- Step 1: Target Role -->
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-sky-500 text-gray-950 font-extrabold text-xs flex items-center justify-center">1</span>
              <span>Select Target Job Role</span>
            </h3>
            <button class="btn-goto-roles text-xs text-sky-400 hover:underline">Adjust Criteria Weights &rarr;</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${state.jobRoles.map(role => {
              const isSel = role.id === state.selectedAnalyzeRoleId;
              return `
                <button
                  data-select-role-id="${role.id}"
                  class="btn-select-analyze-role p-3.5 rounded-xl text-left border transition-all ${
                    isSel ? 'bg-sky-500/15 border-sky-500 shadow-md' : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                  }"
                >
                  <div class="flex items-center justify-between mb-1">
                    <h4 class="text-sm font-bold text-white truncate">${role.title}</h4>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-slate-300">v${role.version || 1}</span>
                  </div>
                  <p class="text-xs text-slate-400 truncate mb-2">${role.department}</p>
                  <div class="text-[11px] text-sky-400 font-mono">${role.criteria?.length || 0} Criteria &bull; 100% Weighted</div>
                </button>
              `;
            }).join('')}
          </div>

          ${selectedRole ? `
            <div class="p-4 rounded-xl bg-gray-950 border border-gray-800/80">
              <div class="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Active Criteria for ${selectedRole.title}:</span>
                <span class="text-emerald-400 font-mono">100% Total Weightage</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                ${(selectedRole.criteria || []).map(c => `
                  <div class="p-2 rounded-lg bg-gray-900 border border-gray-800 text-xs">
                    <div class="font-semibold text-white truncate">${c.name}</div>
                    <div class="text-sky-400 font-bold font-mono mt-0.5">${c.weight}%</div>
                    <div class="text-[10px] text-slate-500 truncate">${c.category}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Step 2: Select Resumes -->
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-sky-500 text-gray-950 font-extrabold text-xs flex items-center justify-center">2</span>
              <span>Select Resumes to Analyse (${state.selectedAnalyzeResumeIds.length} of ${state.resumes.length} selected)</span>
            </h3>
            <div class="flex items-center gap-3 text-xs">
              <button id="btn-select-all-resumes" class="text-sky-400 hover:underline">Select All</button>
              <span class="text-slate-600">&bull;</span>
              <button id="btn-clear-resumes" class="text-slate-400 hover:underline">Clear</button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            ${state.resumes.map(r => {
              const isChecked = state.selectedAnalyzeResumeIds.includes(r.id);
              return `
                <div data-toggle-res-id="${r.id}" class="btn-toggle-resume p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isChecked ? 'bg-sky-500/15 border-sky-500/40' : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                }">
                  <input type="checkbox" ${isChecked ? 'checked' : ''} class="mt-1 pointer-events-none accent-sky-500" />
                  <div class="min-w-0 flex-1">
                    <h5 class="text-xs font-bold text-white truncate font-mono">${r.originalFilename}</h5>
                    <p class="text-[11px] text-slate-400 truncate mt-0.5">${r.senderName} &bull; ${r.source}</p>
                    <span class="text-[10px] text-slate-500 font-mono">${r.fileSize}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Step 3: Run AI Analysis Button -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-gray-900 to-indigo-950/40 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              ${icons.sparkles}
              <span>Ready for AI Evaluation</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1 max-w-xl">
              ${state.selectedAnalyzeResumeIds.length} candidate resume(s) will be parsed and evaluated against "${selectedRole?.title}" criteria.
            </p>
          </div>

          <button
            id="btn-run-ai-eval"
            ${state.isAnalyzing || state.selectedAnalyzeResumeIds.length === 0 ? 'disabled' : ''}
            class="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-gray-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-sky-900/50 transition-all flex items-center gap-2"
          >
            ${state.isAnalyzing ? `
              <span class="animate-spin">${icons.refresh}</span>
              <span>Analyzing Resumes...</span>
            ` : `
              <span>${icons.sparkles}</span>
              <span>Run AI Evaluation (${state.selectedAnalyzeResumeIds.length})</span>
            `}
          </button>
        </div>

        ${state.isAnalyzing ? `
          <div class="p-6 rounded-2xl bg-gray-900 border border-sky-500/30 text-center space-y-3">
            <div class="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto animate-pulse">
              ${icons.sparkles}
            </div>
            <h4 class="text-sm font-bold text-white">AI Evaluation in Progress</h4>
            <p class="text-xs text-sky-400 font-mono">${state.analysisProgress || 'Extracting document text and computing criteria scores...'}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // TAB 5: CANDIDATE RESULTS
  function renderCandidateResults() {
    const strongThresh = state.settings.thresholds?.strongMatch || 80;
    const potentialThresh = state.settings.thresholds?.potentialMatch || 60;

    // Filter
    let list = state.candidates.filter(cand => {
      const q = state.candidateSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        cand.candidateName.toLowerCase().includes(q) ||
        cand.candidateEmail.toLowerCase().includes(q) ||
        cand.jobRoleTitle.toLowerCase().includes(q) ||
        (cand.matchedSkills || []).some(s => s.toLowerCase().includes(q));

      const matchesRole = state.candidateFilterRole === 'all' || cand.jobRoleId === state.candidateFilterRole;
      const matchesStatus = state.candidateFilterStatus === 'all' || (cand.status || 'New').toLowerCase() === state.candidateFilterStatus.toLowerCase();

      const score = cand.overallMatchPercentage || 0;
      let matchesTier = true;
      if (state.candidateFilterTier === 'Strong Match') matchesTier = score >= strongThresh;
      else if (state.candidateFilterTier === 'Potential Match') matchesTier = score >= potentialThresh && score < strongThresh;
      else if (state.candidateFilterTier === 'Low Match') matchesTier = score < potentialThresh;

      return matchesSearch && matchesRole && matchesStatus && matchesTier;
    });

    // Sort
    list.sort((a, b) => {
      if (state.candidateSortBy === 'score_desc') return (b.overallMatchPercentage || 0) - (a.overallMatchPercentage || 0);
      if (state.candidateSortBy === 'score_asc') return (a.overallMatchPercentage || 0) - (b.overallMatchPercentage || 0);
      if (state.candidateSortBy === 'name') return (a.candidateName || '').localeCompare(b.candidateName || '');
      return 0;
    });

    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ${icons.users}
              <span>Candidate Matching Results</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Transparent, weighted candidate scoring evaluated against role criteria.
            </p>
          </div>
          <div class="text-xs text-slate-400">
            Total Evaluated: <strong class="text-white font-mono">${state.candidates.length}</strong>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="p-4 rounded-2xl bg-gray-900 border border-gray-800 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-4">
            <input
              type="text"
              id="input-candidate-search"
              placeholder="Search candidate name, email, skills..."
              value="${state.candidateSearch}"
              class="w-full px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
            />
          </div>

          <div class="md:col-span-3">
            <select id="select-candidate-role" class="w-full px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-slate-200 outline-none">
              <option value="all">All Job Roles</option>
              ${state.jobRoles.map(r => `<option value="${r.id}" ${state.candidateFilterRole === r.id ? 'selected' : ''}>${r.title}</option>`).join('')}
            </select>
          </div>

          <div class="md:col-span-2">
            <select id="select-candidate-tier" class="w-full px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-slate-200 outline-none">
              <option value="all">All Tiers</option>
              <option value="Strong Match" ${state.candidateFilterTier === 'Strong Match' ? 'selected' : ''}>Strong (&ge;${strongThresh}%)</option>
              <option value="Potential Match" ${state.candidateFilterTier === 'Potential Match' ? 'selected' : ''}>Potential (${potentialThresh}-${strongThresh - 1}%)</option>
              <option value="Low Match" ${state.candidateFilterTier === 'Low Match' ? 'selected' : ''}>Low (&lt;${potentialThresh}%)</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <select id="select-candidate-status" class="w-full px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-slate-200 outline-none">
              <option value="all">All Statuses</option>
              <option value="Shortlisted" ${state.candidateFilterStatus === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
              <option value="New" ${state.candidateFilterStatus === 'New' ? 'selected' : ''}>New / Pending</option>
              <option value="Rejected" ${state.candidateFilterStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>

          <div class="md:col-span-1">
            <select id="select-candidate-sort" class="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-slate-200 outline-none">
              <option value="score_desc" ${state.candidateSortBy === 'score_desc' ? 'selected' : ''}>Top %</option>
              <option value="score_asc" ${state.candidateSortBy === 'score_asc' ? 'selected' : ''}>Low %</option>
              <option value="name" ${state.candidateSortBy === 'name' ? 'selected' : ''}>Name</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-gray-950/80 border-b border-gray-800 text-slate-400 font-semibold uppercase">
                  <th class="py-3 px-4">Candidate & Role</th>
                  <th class="py-3 px-3 text-center">Match %</th>
                  <th class="py-3 px-3">Classification</th>
                  <th class="py-3 px-3">Matched Skills</th>
                  <th class="py-3 px-3">Missing Requirements</th>
                  <th class="py-3 px-3">HR Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/70">
                ${list.length === 0 ? `
                  <tr><td colspan="7" class="py-12 text-center text-slate-500">No candidates match your current filter.</td></tr>
                ` : list.map(c => {
                  const score = c.overallMatchPercentage || 0;
                  const isStrong = score >= strongThresh;
                  const isPotential = score >= potentialThresh && score < strongThresh;

                  return `
                    <tr class="hover:bg-gray-800/30 transition-colors">
                      <td class="py-3.5 px-4">
                        <div class="font-bold text-white text-sm">${c.candidateName}</div>
                        <div class="text-slate-400 text-[11px] font-mono">${c.candidateEmail}</div>
                        <div class="text-[11px] text-sky-400 font-medium mt-0.5">
                          ${c.jobRoleTitle} <span class="text-slate-500 font-mono text-[10px]">v${c.jobRoleVersion || 1}</span>
                        </div>
                        <div class="text-[10px] text-slate-500 truncate max-w-[200px]" title="${c.resumeFilename}">File: ${c.resumeFilename}</div>
                      </td>

                      <td class="py-3.5 px-3 text-center">
                        <span class="text-base font-extrabold font-mono px-2.5 py-1 rounded-lg border ${
                          isStrong ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          isPotential ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }">
                          ${score}%
                        </span>
                      </td>

                      <td class="py-3.5 px-3">
                        <span class="inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                          isStrong ? 'bg-emerald-950/60 text-emerald-300' :
                          isPotential ? 'bg-amber-950/60 text-amber-300' :
                          'bg-rose-950/60 text-rose-300'
                        }">
                          ${isStrong ? 'Strong Match' : isPotential ? 'Potential Match' : 'Low Match'}
                        </span>
                      </td>

                      <td class="py-3.5 px-3 max-w-xs">
                        <div class="flex flex-wrap gap-1">
                          ${(c.matchedSkills || []).slice(0, 3).map(s => `
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">&check; ${s}</span>
                          `).join('')}
                          ${(c.matchedSkills || []).length > 3 ? `<span class="text-[10px] text-slate-500">+${c.matchedSkills.length - 3}</span>` : ''}
                        </div>
                      </td>

                      <td class="py-3.5 px-3 max-w-xs">
                        <div class="flex flex-wrap gap-1">
                          ${(c.missingSkills || []).length === 0 ? `<span class="text-[10px] text-emerald-400 font-medium">None (All Met)</span>` : (c.missingSkills || []).slice(0, 2).map(s => `
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">&cross; ${s}</span>
                          `).join('')}
                        </div>
                      </td>

                      <td class="py-3.5 px-3">
                        <div class="flex items-center gap-1.5">
                          <button data-candidate-id="${c.id}" data-action-status="Shortlisted" class="btn-toggle-cand-status p-1 rounded hover:bg-gray-800 ${c.status === 'Shortlisted' ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-500'}" title="Shortlist candidate">
                            ${icons.checkCircle}
                          </button>
                          <button data-candidate-id="${c.id}" data-action-status="Rejected" class="btn-toggle-cand-status p-1 rounded hover:bg-gray-800 ${c.status === 'Rejected' ? 'text-rose-400 bg-rose-500/20' : 'text-slate-500'}" title="Reject candidate">
                            ${icons.close}
                          </button>
                          <span class="text-[10px] font-bold uppercase ${c.status === 'Shortlisted' ? 'text-emerald-400' : c.status === 'Rejected' ? 'text-rose-400' : 'text-slate-400'}">${c.status || 'New'}</span>
                        </div>
                      </td>

                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button data-candidate-id="${c.id}" class="btn-open-scorecard px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-semibold text-xs flex items-center gap-1">
                            ${icons.eye}
                            <span>Scorecard</span>
                          </button>
                          <a href="/api/candidates/${c.id}/resume/download" target="_blank" class="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-300" title="Download resume">
                            ${icons.download}
                          </a>
                          <button data-candidate-id="${c.id}" class="btn-reanalyze-cand p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-300 hover:text-sky-400" title="Re-analyze against latest criteria">
                            ${icons.refresh}
                          </button>
                          <button data-candidate-id="${c.id}" class="btn-delete-candidate p-1 rounded-lg bg-gray-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all" title="Delete evaluation">
                            ${icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // TAB 6: SHORTLISTED
  function renderShortlisted() {
    const shortlistedList = state.candidates.filter(c => c.status === 'Shortlisted');
    const filteredList = shortlistedList.filter(c =>
      state.shortlistedRoleFilter === 'all' || c.jobRoleId === state.shortlistedRoleFilter
    );

    return `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ${icons.checkCircle}
              <span>Shortlisted Candidates (${filteredList.length})</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Top candidate pool curated by DataPage HR for technical rounds.
            </p>
          </div>

          <button id="btn-export-shortlist-csv" class="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 text-xs font-semibold border border-gray-700 flex items-center gap-1.5">
            ${icons.download}
            <span>Export CSV</span>
          </button>
        </div>

        <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-400">Filter by Role:</span>
            <select id="select-shortlist-role" class="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white outline-none">
              <option value="all">All Roles (${shortlistedList.length})</option>
              ${state.jobRoles.map(r => {
                const count = shortlistedList.filter(c => c.jobRoleId === r.id).length;
                return `<option value="${r.id}" ${state.shortlistedRoleFilter === r.id ? 'selected' : ''}>${r.title} (${count})</option>`;
              }).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filteredList.length === 0 ? `
            <div class="col-span-3 text-center py-16 text-slate-500">No candidates shortlisted yet in this view.</div>
          ` : filteredList.map(cand => `
            <div class="rounded-2xl bg-gray-900 border border-gray-800 hover:border-emerald-500/30 p-5 flex flex-col justify-between transition-all shadow-lg">
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 class="text-base font-bold text-white tracking-tight">${cand.candidateName}</h3>
                    <p class="text-xs text-sky-400 font-medium">${cand.jobRoleTitle}</p>
                  </div>
                  <span class="text-base font-extrabold font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ${cand.overallMatchPercentage}%
                  </span>
                </div>

                <div class="space-y-1 text-xs text-slate-400 mb-3">
                  <div class="truncate">Email: <a href="mailto:${cand.candidateEmail}" class="text-sky-300 underline font-mono">${cand.candidateEmail}</a></div>
                  <div class="font-mono">Phone: ${cand.candidatePhone || 'Not specified'}</div>
                </div>

                <div class="p-3 rounded-xl bg-gray-950 border border-gray-800/80 mb-3 text-xs text-slate-300 italic line-clamp-3">
                  "${cand.evaluationSummary}"
                </div>

                <div class="flex flex-wrap gap-1 mb-4">
                  ${(cand.matchedSkills || []).slice(0, 3).map(s => `
                    <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-medium">&check; ${s}</span>
                  `).join('')}
                </div>
              </div>

              <div class="pt-3 border-t border-gray-800 flex items-center justify-between">
                <button data-candidate-id="${cand.id}" data-action-status="New" class="btn-toggle-cand-status text-xs text-rose-400 hover:underline">
                  Remove Shortlist
                </button>
                <div class="flex items-center gap-1.5">
                  <button data-candidate-id="${cand.id}" class="btn-open-scorecard px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-400 text-xs font-semibold flex items-center gap-1">
                    ${icons.eye}
                    <span>Scorecard</span>
                  </button>
                  <button data-candidate-id="${cand.id}" class="btn-delete-candidate p-1.5 rounded-lg bg-gray-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all" title="Delete evaluation">
                    ${icons.trash}
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // TAB 7: SETTINGS
  function renderSettings() {
    const strong = state.settings.thresholds?.strongMatch || 80;
    const potential = state.settings.thresholds?.potentialMatch || 60;

    return `
      <div class="space-y-6 max-w-4xl">
        <div>
          <h2 class="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            ${icons.settings}
            <span>System & Recruitment Settings</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">Configure AI match percentage bands, Gemini model, and HR access controls.</p>
        </div>

        <form id="form-settings" class="space-y-6">
          <!-- Thresholds -->
          <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Candidate Match Percentage Thresholds</h3>
            <p class="text-xs text-slate-400">Define the benchmark bands used by DP Hire to classify candidates into Strong, Potential, and Low match categories.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="p-4 rounded-xl bg-gray-950 border border-emerald-500/30">
                <label class="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Strong Match Threshold (%)</label>
                <p class="text-[11px] text-slate-400 mb-2">Candidates scoring at or above this percentage (Default: 80%).</p>
                <input type="number" id="input-thresh-strong" min="50" max="99" value="${strong}" class="w-28 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm font-mono font-bold text-white outline-none focus:border-emerald-500" />
              </div>

              <div class="p-4 rounded-xl bg-gray-950 border border-amber-500/30">
                <label class="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Potential Match Threshold (%)</label>
                <p class="text-[11px] text-slate-400 mb-2">Candidates scoring below Strong Match but at/above this value (Default: 60%).</p>
                <input type="number" id="input-thresh-potential" min="20" max="80" value="${potential}" class="w-28 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm font-mono font-bold text-white outline-none focus:border-amber-500" />
              </div>
            </div>

            <div class="p-3 rounded-xl bg-gray-950 text-xs text-slate-400">
              <strong>Low Match:</strong> Automatically assigned to any candidate scoring below <span class="text-rose-400 font-mono font-bold">${potential}%</span>.
            </div>
          </div>

          <!-- Gemini Config -->
          <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              ${icons.sparkles}
              <span>Google Gemini AI Configuration</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Gemini Model</label>
                <select id="select-gemini-model" class="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none">
                  <option value="gemini-2.5-flash" ${state.settings.geminiModel === 'gemini-2.5-flash' ? 'selected' : ''}>Gemini 2.5 Flash (Recommended)</option>
                  <option value="gemini-1.5-flash" ${state.settings.geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>Gemini 1.5 Flash</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Update Gemini API Key</label>
                <input type="password" id="input-gemini-key" placeholder="AIzaSy... (Paste Google AI Studio Key)" class="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none font-mono" />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <button type="button" id="btn-seed-sample" class="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-300 text-xs font-semibold border border-gray-700 flex items-center gap-1.5">
              ${icons.refresh}
              <span>Reset / Load Sample Data</span>
            </button>

            <button type="submit" class="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // MODALS RENDERER
  function renderModal() {
    if (!state.activeModal) return '';

    if (state.activeModal === 'candidateDetail' && state.selectedCandidate) {
      const c = state.selectedCandidate;
      const score = c.overallMatchPercentage || 0;
      const isStrong = score >= (state.settings.thresholds?.strongMatch || 80);
      const isPotential = score >= (state.settings.thresholds?.potentialMatch || 60) && !isStrong;

      return `
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="p-6 border-b border-gray-800 bg-gray-900 flex items-start justify-between">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-sky-500/20 shrink-0">
                  ${(c.candidateName || 'CA').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <h2 class="text-xl font-extrabold text-white">${c.candidateName}</h2>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isStrong ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      isPotential ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }">
                      ${score}% &ndash; ${isStrong ? 'Strong Match' : isPotential ? 'Potential Match' : 'Low Match'}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-gray-800 text-slate-300">
                      Status: ${c.status || 'New'}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">
                    <span class="text-sky-400 font-semibold">${c.jobRoleTitle}</span> &bull; ${c.candidateEmail} &bull; ${c.candidatePhone || ''}
                  </p>
                </div>
              </div>

              <button class="btn-close-modal p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-400 hover:text-white">
                ${icons.close}
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- AI Summary -->
              <div class="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 via-gray-900 to-indigo-950/30 border border-sky-500/25">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    ${icons.sparkles}
                    <span>AI Evaluation Summary</span>
                  </span>
                  <span class="text-[11px] text-slate-400">${c.analyzedBy || 'Google Gemini AI'}</span>
                </div>
                <p class="text-sm text-slate-200 leading-relaxed">${c.evaluationSummary || 'No summary provided.'}</p>
              </div>

              <!-- Alignment -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div class="p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div class="font-bold text-slate-400 uppercase mb-1">Education Alignment:</div>
                  <div class="text-slate-200">${c.educationMatch || 'Standard academic evaluation'}</div>
                </div>
                <div class="p-4 rounded-xl bg-gray-950 border border-gray-800">
                  <div class="font-bold text-slate-400 uppercase mb-1">Experience Alignment:</div>
                  <div class="text-slate-200">${c.experienceMatch || 'Experience evaluated'} (Total: ${c.totalExperienceYears} yrs)</div>
                </div>
              </div>

              <!-- Matched vs Missing -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/20">
                  <h4 class="text-xs font-bold text-emerald-400 uppercase mb-2">Matched Skills & Criteria (${c.matchedSkills?.length || 0}):</h4>
                  <div class="flex flex-wrap gap-1.5">
                    ${(c.matchedSkills || []).map(s => `<span class="text-xs px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 font-medium">&check; ${s}</span>`).join('')}
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-rose-950/15 border border-rose-500/20">
                  <h4 class="text-xs font-bold text-rose-400 uppercase mb-2">Missing or Weak Requirements (${c.missingSkills?.length || 0}):</h4>
                  <div class="flex flex-wrap gap-1.5">
                    ${(c.missingSkills || []).length === 0 ? `<span class="text-xs text-emerald-400 font-medium">All criteria satisfied!</span>` : (c.missingSkills || []).map(s => `<span class="text-xs px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 font-medium">&cross; ${s}</span>`).join('')}
                  </div>
                </div>
              </div>

              <!-- Transparent Scoring Breakdown Table -->
              <div>
                <h3 class="text-sm font-bold text-white mb-3 flex items-center justify-between">
                  <span>Transparent Scoring Breakdown (Weighted Match: ${score}%)</span>
                  <span class="text-xs text-slate-500 font-normal">Formula: &sum; (Score &times; Weight) / 100</span>
                </h3>

                <div class="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="bg-gray-900 border-b border-gray-800 text-slate-400 font-semibold uppercase">
                        <th class="py-2.5 px-3">Criterion</th>
                        <th class="py-2.5 px-2">Category</th>
                        <th class="py-2.5 px-2 text-center">Weight</th>
                        <th class="py-2.5 px-2 text-center">Score (0-100)</th>
                        <th class="py-2.5 px-2 text-center">Weighted</th>
                        <th class="py-2.5 px-3">Evidence Found & Evaluation Notes</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800/80">
                      ${(c.criteriaBreakdown || []).map(row => `
                        <tr>
                          <td class="py-3 px-3 font-semibold text-white">${row.criterionName}</td>
                          <td class="py-3 px-2 text-slate-400"><span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800">${row.category || 'Skill'}</span></td>
                          <td class="py-3 px-2 text-center font-mono font-bold text-sky-400">${row.weight}%</td>
                          <td class="py-3 px-2 text-center font-mono font-bold text-white">${row.score}</td>
                          <td class="py-3 px-2 text-center font-mono font-bold text-emerald-400">+${row.weightedScore}%</td>
                          <td class="py-3 px-3 text-slate-300">
                            ${row.evidenceFound ? `<div class="text-[11px] text-sky-300 mb-0.5">Evidence: "${row.evidenceFound}"</div>` : ''}
                            <div class="text-slate-400">${row.evaluationNotes || ''}</div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="bg-gray-900 font-bold border-t border-gray-800">
                        <td colspan="2" class="py-2.5 px-3 text-slate-300">Total Weighted Match Score</td>
                        <td class="py-2.5 px-2 text-center text-sky-400">100%</td>
                        <td class="py-2.5 px-2 text-center">&mdash;</td>
                        <td class="py-2.5 px-2 text-center text-emerald-400 font-mono text-base">${score}%</td>
                        <td class="py-2.5 px-3 text-slate-400">Candidate benchmark complete</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <a href="/api/candidates/${c.id}/resume/download" target="_blank" class="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                  ${icons.download}
                  <span>Download Resume (${c.resumeFilename})</span>
                </a>
                <button data-candidate-id="${c.id}" class="btn-delete-candidate px-3 py-2 rounded-xl bg-gray-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-gray-700 hover:border-rose-500/40 transition-all flex items-center gap-1.5" title="Permanently delete this evaluation">
                  ${icons.trash}
                  <span>Delete</span>
                </button>
              </div>

              <div class="flex items-center gap-3">
                <button data-candidate-id="${c.id}" data-action-status="Rejected" class="btn-toggle-cand-status px-4 py-2 rounded-xl text-xs font-semibold ${c.status === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'}">
                  ${c.status === 'Rejected' ? 'Rejected' : 'Reject Candidate'}
                </button>
                <button data-candidate-id="${c.id}" data-action-status="Shortlisted" class="btn-toggle-cand-status px-5 py-2 rounded-xl text-xs font-semibold text-white ${c.status === 'Shortlisted' ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'}">
                  ${c.status === 'Shortlisted' ? 'Shortlisted &check;' : 'Shortlist Candidate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (state.activeModal === 'roleModal') {
      const totalWeight = state.modalCriteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
      const isExact100 = totalWeight === 100;

      return `
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div class="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-white">${state.editingRole ? `Edit Role: ${state.editingRole.title}` : 'Create New Job Role'}</h2>
                <p class="text-xs text-slate-400">Configure recruitment criteria and individual weightages (Total must equal 100%).</p>
              </div>
              <button class="btn-close-modal p-1.5 rounded-lg bg-gray-800 text-slate-400 hover:text-white">${icons.close}</button>
            </div>

            <form id="form-role-modal" class="flex-1 overflow-y-auto p-6 space-y-5">
              ${!state.editingRole ? `
                <div class="p-3.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-semibold text-slate-300">Quick Templates:</span>
                  ${PRESET_TEMPLATES.map((tpl, i) => `
                    <button type="button" data-tpl-idx="${i}" class="btn-load-template text-xs px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-slate-200 border border-gray-700">
                      + Load ${tpl.title}
                    </button>
                  `).join('')}
                </div>
              ` : ''}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Job Title *</label>
                  <input type="text" id="input-role-title" required value="${state.modalRoleTitle}" placeholder="e.g. Python Developer" class="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Department</label>
                  <input type="text" id="input-role-dept" value="${state.modalRoleDept}" class="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Min Experience (Years)</label>
                  <input type="number" id="input-role-exp" min="0" max="20" value="${state.modalRoleExp}" class="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
                  <select id="select-role-status" class="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none">
                    <option value="Active" ${state.modalRoleStatus === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Paused" ${state.modalRoleStatus === 'Paused' ? 'selected' : ''}>Paused</option>
                    <option value="Closed" ${state.modalRoleStatus === 'Closed' ? 'selected' : ''}>Closed</option>
                  </select>
                </div>
              </div>

              <!-- Criteria Weight Sum Meter -->
              <div class="p-4 rounded-xl border ${isExact100 ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/30'}">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-slate-200">Total Criteria Weightage Sum: <span class="${isExact100 ? 'text-emerald-400' : 'text-amber-400'} font-mono">${totalWeight}%</span></span>
                  <span class="text-xs font-semibold ${isExact100 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${isExact100 ? 'Valid: Exactly 100%' : `Must equal 100% (${100 - totalWeight > 0 ? `Need +${100 - totalWeight}%` : `Over by ${totalWeight - 100}%`})`}
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div class="h-full ${isExact100 ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-rose-500' : 'bg-amber-500'}" style="width: ${Math.min(100, totalWeight)}%"></div>
                </div>
              </div>

              <!-- Criteria Rows -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-bold text-white uppercase">Recruitment Criteria & Individual Weightages:</h4>
                  <button type="button" id="btn-add-modal-criterion" class="text-xs text-sky-400 hover:underline font-semibold">+ Add Criterion</button>
                </div>

                <div class="space-y-2">
                  ${state.modalCriteria.map((c, i) => `
                    <div class="p-2.5 rounded-xl bg-gray-950 border border-gray-800 grid grid-cols-12 gap-2 items-center text-xs">
                      <div class="col-span-5">
                        <input type="text" data-c-idx="${i}" data-c-field="name" value="${c.name}" placeholder="Criterion name" class="input-criterion-field w-full px-2.5 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-white outline-none" />
                      </div>
                      <div class="col-span-4">
                        <select data-c-idx="${i}" data-c-field="category" class="input-criterion-field w-full px-2 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-slate-200 outline-none">
                          <option value="Required Skill" ${c.category === 'Required Skill' ? 'selected' : ''}>Required Skill</option>
                          <option value="Preferred Skill" ${c.category === 'Preferred Skill' ? 'selected' : ''}>Preferred Skill</option>
                          <option value="Technical Skill" ${c.category === 'Technical Skill' ? 'selected' : ''}>Technical Skill</option>
                          <option value="Education" ${c.category === 'Education' ? 'selected' : ''}>Education</option>
                          <option value="Soft Skill" ${c.category === 'Soft Skill' ? 'selected' : ''}>Soft Skill</option>
                        </select>
                      </div>
                      <div class="col-span-2">
                        <input type="number" min="1" max="100" data-c-idx="${i}" data-c-field="weight" value="${c.weight}" class="input-criterion-field w-full px-2 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-sky-400 font-bold font-mono outline-none" />
                      </div>
                      <div class="col-span-1 text-right">
                        <button type="button" data-del-c-idx="${i}" class="btn-delete-modal-criterion text-slate-500 hover:text-rose-400">&times;</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              ${state.modalRoleError ? `
                <div class="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">${state.modalRoleError}</div>
              ` : ''}

              <div class="pt-3 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" class="btn-close-modal px-4 py-2 rounded-xl bg-gray-800 text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" ${!isExact100 ? 'disabled' : ''} class="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-gray-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-semibold">
                  ${state.editingRole ? 'Update Job Role' : 'Create Job Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    }

    return '';
  }

  // EVENT BINDINGS
  function bindAppEvents() {
    // Navigation
    document.querySelectorAll('.btn-nav').forEach(btn => {
      btn.onclick = () => {
        state.currentTab = btn.getAttribute('data-tab');
        render();
      };
    });

    // Quick nav buttons in dashboard/banner
    const btnGotoImport = document.querySelector('.btn-goto-import');
    if (btnGotoImport) btnGotoImport.onclick = () => { state.currentTab = 'import'; render(); };

    const btnGotoAnalyse = document.querySelector('.btn-goto-analyse');
    if (btnGotoAnalyse) btnGotoAnalyse.onclick = () => { state.currentTab = 'analyse'; render(); };

    const btnGotoRoles = document.querySelector('.btn-goto-roles');
    if (btnGotoRoles) btnGotoRoles.onclick = () => { state.currentTab = 'roles'; render(); };

    const btnGotoCandidates = document.querySelector('.btn-goto-candidates');
    if (btnGotoCandidates) btnGotoCandidates.onclick = () => { state.currentTab = 'candidates'; render(); };

    const btnGotoSettings = document.querySelector('.btn-goto-settings');
    if (btnGotoSettings) btnGotoSettings.onclick = () => { state.currentTab = 'settings'; render(); };

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.onclick = logout;

    // Header buttons
    const btnHeaderSync = document.getElementById('btn-header-sync');
    if (btnHeaderSync) btnHeaderSync.onclick = syncGmailAction;

    const btnHeaderNewRole = document.getElementById('btn-header-new-role');
    if (btnHeaderNewRole) btnHeaderNewRole.onclick = openCreateRoleModal;

    const btnAddRoleModal = document.querySelector('.btn-add-role-modal');
    if (btnAddRoleModal) btnAddRoleModal.onclick = openCreateRoleModal;

    // Close Modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.onclick = () => {
        state.activeModal = null;
        state.selectedCandidate = null;
        state.selectedResumeViewerCandidate = null;
        state.editingRole = null;
        render();
      };
    });

    // Open scorecard modal
    document.querySelectorAll('.btn-open-scorecard').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-candidate-id');
        const c = state.candidates.find(item => item.id === id);
        if (c) {
          state.selectedCandidate = c;
          state.activeModal = 'candidateDetail';
          render();
        }
      };
    });

    // Shortlist / Reject toggle
    document.querySelectorAll('.btn-toggle-cand-status').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-candidate-id');
        const newStatus = btn.getAttribute('data-action-status');
        try {
          const res = await apiCall(`/candidates/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          });
          const idx = state.candidates.findIndex(c => c.id === id);
          if (idx !== -1) state.candidates[idx] = res.candidate;
          if (state.selectedCandidate && state.selectedCandidate.id === id) {
            state.selectedCandidate = res.candidate;
          }
          render();
        } catch (e) {
          alert(e.message);
        }
      };
    });

    // Re-analyze candidate
    document.querySelectorAll('.btn-reanalyze-cand').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-candidate-id');
        try {
          btn.innerHTML = 'Analyzing...';
          const res = await apiCall(`/candidates/${id}/reanalyze`, { method: 'POST' });
          const idx = state.candidates.findIndex(c => c.id === id);
          if (idx !== -1) state.candidates[idx] = res.candidate;
          alert(res.message);
          render();
        } catch (e) {
          alert('Re-analysis error: ' + e.message);
        }
      };
    });

    // Delete candidate evaluation
    document.querySelectorAll('.btn-delete-candidate').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-candidate-id');
        const c = state.candidates.find(item => item.id === id);
        const name = c ? c.candidateName : 'this candidate';
        if (!confirm(`Are you sure you want to delete the evaluation and resume file for ${name}? This action cannot be undone.`)) {
          return;
        }
        try {
          await apiCall(`/candidates/${id}`, { method: 'DELETE' });
          state.candidates = state.candidates.filter(item => item.id !== id);
          if (state.selectedCandidate && state.selectedCandidate.id === id) {
            state.activeModal = null;
            state.selectedCandidate = null;
          }
          alert(`Candidate evaluation for ${name} deleted successfully.`);
          render();
        } catch (e) {
          alert('Delete failed: ' + e.message);
        }
      };
    });

    // Edit Job Role
    document.querySelectorAll('.btn-edit-role').forEach(btn => {
      btn.onclick = () => {
        const roleId = btn.getAttribute('data-edit-role-id');
        const role = state.jobRoles.find(r => r.id === roleId);
        if (role) {
          state.editingRole = role;
          state.modalRoleTitle = role.title;
          state.modalRoleDept = role.department;
          state.modalRoleExp = role.minExperienceYears || 0;
          state.modalRoleDesc = role.description || '';
          state.modalRoleStatus = role.status || 'Active';
          state.modalCriteria = JSON.parse(JSON.stringify(role.criteria || []));
          state.modalRoleError = '';
          state.activeModal = 'roleModal';
          render();
        }
      };
    });

    // Delete Job Role
    document.querySelectorAll('.btn-delete-role').forEach(btn => {
      btn.onclick = async () => {
        const roleId = btn.getAttribute('data-delete-role-id');
        if (!confirm('Delete this job role?')) return;
        try {
          await apiCall(`/roles/${roleId}`, { method: 'DELETE' });
          state.jobRoles = state.jobRoles.filter(r => r.id !== roleId);
          render();
        } catch (e) {
          alert(e.message);
        }
      };
    });

    // Role modal criteria builder events
    const btnAddCrit = document.getElementById('btn-add-modal-criterion');
    if (btnAddCrit) {
      btnAddCrit.onclick = () => {
        state.modalCriteria.push({
          name: 'New Requirement',
          category: 'Required Skill',
          weight: 10,
          description: ''
        });
        render();
      };
    }

    document.querySelectorAll('.btn-delete-modal-criterion').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-del-c-idx'));
        state.modalCriteria.splice(idx, 1);
        render();
      };
    });

    document.querySelectorAll('.input-criterion-field').forEach(input => {
      input.oninput = () => {
        const idx = Number(input.getAttribute('data-c-idx'));
        const field = input.getAttribute('data-c-field');
        state.modalCriteria[idx][field] = field === 'weight' ? Number(input.value) : input.value;
        const total = state.modalCriteria.reduce((s, c) => s + Number(c.weight || 0), 0);
        // Live re-render weight meter if weight changed
        if (field === 'weight') render();
      };
    });

    document.querySelectorAll('.btn-load-template').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-tpl-idx'));
        const tpl = PRESET_TEMPLATES[idx];
        if (tpl) {
          state.modalRoleTitle = tpl.title;
          state.modalRoleDept = tpl.department;
          state.modalRoleExp = tpl.minExperienceYears;
          state.modalRoleDesc = tpl.description;
          state.modalCriteria = JSON.parse(JSON.stringify(tpl.criteria));
          render();
        }
      };
    });

    const formRole = document.getElementById('form-role-modal');
    if (formRole) {
      formRole.onsubmit = async (e) => {
        e.preventDefault();
        const total = state.modalCriteria.reduce((s, c) => s + Number(c.weight || 0), 0);
        if (total !== 100) {
          state.modalRoleError = `Criteria weightages must equal 100%. Currently: ${total}%.`;
          render();
          return;
        }

        const payload = {
          title: document.getElementById('input-role-title').value.trim(),
          department: document.getElementById('input-role-dept').value.trim(),
          minExperienceYears: Number(document.getElementById('input-role-exp').value || 0),
          status: document.getElementById('select-role-status').value,
          criteria: state.modalCriteria
        };

        try {
          if (state.editingRole) {
            const res = await apiCall(`/roles/${state.editingRole.id}`, {
              method: 'PUT',
              body: JSON.stringify(payload)
            });
            const idx = state.jobRoles.findIndex(r => r.id === state.editingRole.id);
            if (idx !== -1) state.jobRoles[idx] = res.role;
          } else {
            const res = await apiCall('/roles', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            state.jobRoles.push(res.role);
          }
          state.activeModal = null;
          state.editingRole = null;
          render();
        } catch (err) {
          state.modalRoleError = err.message;
          render();
        }
      };
    }

    // Gmail sync in Import tab
    const btnSyncGmailTab = document.getElementById('btn-sync-gmail-tab');
    if (btnSyncGmailTab) btnSyncGmailTab.onclick = syncGmailAction;

    // Import individual attachment from Gmail
    document.querySelectorAll('.btn-import-att').forEach(btn => {
      btn.onclick = async () => {
        const msgId = btn.getAttribute('data-import-msg-id');
        const attId = btn.getAttribute('data-import-att-id');
        try {
          btn.innerHTML = 'Importing...';
          const res = await apiCall('/gmail/import-attachment', {
            method: 'POST',
            body: JSON.stringify({ messageId: msgId, attachmentId: attId })
          });
          state.resumes.unshift(res.resume);
          alert(`Successfully imported "${res.resume.originalFilename}" from Gmail!`);
          state.currentTab = 'analyse';
          render();
        } catch (e) {
          alert('Import failed: ' + e.message);
        }
      };
    });

    // Manual Upload
    const inputManualResumes = document.getElementById('input-manual-resumes');
    if (inputManualResumes) {
      inputManualResumes.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const formData = new FormData();
        files.forEach(f => formData.append('resumes', f));

        try {
          const res = await apiCall('/candidates/upload', {
            method: 'POST',
            body: formData
          });
          state.resumes.unshift(...(res.resumes || []));
          alert(`Successfully uploaded ${res.resumes?.length || 0} resume(s)!`);
          state.currentTab = 'analyse';
          render();
        } catch (err) {
          alert('Upload failed: ' + err.message);
        }
      };
    }

    // Analyse Tab Events
    document.querySelectorAll('.btn-select-analyze-role').forEach(btn => {
      btn.onclick = () => {
        state.selectedAnalyzeRoleId = btn.getAttribute('data-select-role-id');
        render();
      };
    });

    document.querySelectorAll('.btn-toggle-resume').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-toggle-res-id');
        if (state.selectedAnalyzeResumeIds.includes(id)) {
          state.selectedAnalyzeResumeIds = state.selectedAnalyzeResumeIds.filter(x => x !== id);
        } else {
          state.selectedAnalyzeResumeIds.push(id);
        }
        render();
      };
    });

    const btnSelectAllRes = document.getElementById('btn-select-all-resumes');
    if (btnSelectAllRes) {
      btnSelectAllRes.onclick = () => {
        state.selectedAnalyzeResumeIds = state.resumes.map(r => r.id);
        render();
      };
    }

    const btnClearRes = document.getElementById('btn-clear-resumes');
    if (btnClearRes) {
      btnClearRes.onclick = () => {
        state.selectedAnalyzeResumeIds = [];
        render();
      };
    }

    const btnRunAiEval = document.getElementById('btn-run-ai-eval');
    if (btnRunAiEval) {
      btnRunAiEval.onclick = async () => {
        state.isAnalyzing = true;
        state.analysisProgress = 'Contacting Gemini AI and scoring candidate resumes against criteria...';
        render();

        try {
          const res = await apiCall('/candidates/batch-analyze', {
            method: 'POST',
            body: JSON.stringify({
              jobRoleId: state.selectedAnalyzeRoleId,
              resumeIds: state.selectedAnalyzeResumeIds
            })
          });

          // Add newly evaluated candidates to state
          state.candidates.unshift(...(res.results || []));
          state.isAnalyzing = false;
          alert(`AI analysis complete! ${res.results?.length || 0} candidates evaluated.`);
          state.currentTab = 'candidates';
          render();
        } catch (e) {
          state.isAnalyzing = false;
          alert('AI Analysis error: ' + e.message);
          render();
        }
      };
    }

    // Candidate Search & Filter Events
    const inputCandSearch = document.getElementById('input-candidate-search');
    if (inputCandSearch) {
      inputCandSearch.oninput = (e) => {
        state.candidateSearch = e.target.value;
      };
      inputCandSearch.onchange = () => render();
    }

    const selCandRole = document.getElementById('select-candidate-role');
    if (selCandRole) {
      selCandRole.onchange = (e) => {
        state.candidateFilterRole = e.target.value;
        render();
      };
    }

    const selCandTier = document.getElementById('select-candidate-tier');
    if (selCandTier) {
      selCandTier.onchange = (e) => {
        state.candidateFilterTier = e.target.value;
        render();
      };
    }

    const selCandStatus = document.getElementById('select-candidate-status');
    if (selCandStatus) {
      selCandStatus.onchange = (e) => {
        state.candidateFilterStatus = e.target.value;
        render();
      };
    }

    const selCandSort = document.getElementById('select-candidate-sort');
    if (selCandSort) {
      selCandSort.onchange = (e) => {
        state.candidateSortBy = e.target.value;
        render();
      };
    }

    // Shortlist role filter
    const selShortlistRole = document.getElementById('select-shortlist-role');
    if (selShortlistRole) {
      selShortlistRole.onchange = (e) => {
        state.shortlistedRoleFilter = e.target.value;
        render();
      };
    }

    // Export CSV
    const btnExportCsv = document.getElementById('btn-export-shortlist-csv');
    if (btnExportCsv) {
      btnExportCsv.onclick = () => {
        const list = state.candidates.filter(c => c.status === 'Shortlisted');
        if (list.length === 0) return alert('No shortlisted candidates to export');
        const csvContent = 'data:text/csv;charset=utf-8,Candidate Name,Email,Role,Match %,Filename\n' +
          list.map(c => `"${c.candidateName}","${c.candidateEmail}","${c.jobRoleTitle}",${c.overallMatchPercentage},"${c.resumeFilename}"`).join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `DP_Hire_Shortlisted_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }

    // Settings form
    const formSettings = document.getElementById('form-settings');
    if (formSettings) {
      formSettings.onsubmit = async (e) => {
        e.preventDefault();
        const strong = Number(document.getElementById('input-thresh-strong').value);
        const potential = Number(document.getElementById('input-thresh-potential').value);
        const model = document.getElementById('select-gemini-model').value;
        const key = document.getElementById('input-gemini-key').value;

        try {
          const res = await apiCall('/settings', {
            method: 'PUT',
            body: JSON.stringify({
              thresholds: { strongMatch: strong, potentialMatch: potential },
              geminiModel: model,
              geminiApiKey: key || undefined
            })
          });
          state.settings = res.settings;
          alert('Settings saved successfully!');
          render();
        } catch (err) {
          alert('Settings error: ' + err.message);
        }
      };
    }

    const btnSeedSample = document.getElementById('btn-seed-sample');
    if (btnSeedSample) {
      btnSeedSample.onclick = async () => {
        if (!confirm('Reset to rich sample recruitment data?')) return;
        try {
          await apiCall('/settings/seed-sample-data', { method: 'POST' });
          await loadData();
          alert('Sample recruitment data initialized!');
          render();
        } catch (err) {
          alert(err.message);
        }
      };
    }
  }

  function openCreateRoleModal() {
    state.editingRole = null;
    state.modalRoleTitle = '';
    state.modalRoleDept = 'Software Engineering';
    state.modalRoleExp = 3;
    state.modalRoleDesc = '';
    state.modalRoleStatus = 'Active';
    state.modalCriteria = [
      { name: 'Python Programming', category: 'Required Skill', weight: 30, description: 'Core Python, async programming' },
      { name: 'SQL & Database Design', category: 'Required Skill', weight: 20, description: 'PostgreSQL/MySQL schema design' },
      { name: 'Machine Learning', category: 'Preferred Skill', weight: 20, description: 'PyTorch, Scikit-learn, LLM APIs' },
      { name: 'Communication', category: 'Soft Skill', weight: 10, description: 'Agile team collaboration' },
      { name: 'Problem Solving', category: 'Technical Skill', weight: 10, description: 'Algorithms & system design' },
      { name: 'Education', category: 'Education', weight: 10, description: 'Engineering or CS degree' }
    ];
    state.modalRoleError = '';
    state.activeModal = 'roleModal';
    render();
  }

  async function syncGmailAction() {
    state.syncingGmail = true;
    render();
    try {
      const res = await apiCall('/gmail/emails');
      state.gmailEmails = res.emails || [];
      state.syncingGmail = false;
      alert(`Gmail synced! Found ${state.gmailEmails.length} candidate application(s) with PDF/DOCX resumes.`);
      render();
    } catch (e) {
      state.syncingGmail = false;
      alert('Gmail sync: ' + e.message);
      render();
    }
  }

  // Start app
  init();
})();
