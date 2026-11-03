// src/services/api.js
const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('dp_hire_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  loginGoogle: (credentials) => request('/auth/google', { method: 'POST', body: JSON.stringify(credentials) }),
  loginHrDirect: () => request('/auth/hr-login', { method: 'POST' }),
  testUnauthorizedLogin: (email) => request('/auth/test-unauthorized', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => request('/auth/me'),

  // Job Roles
  getJobRoles: () => request('/roles'),
  getJobRoleById: (id) => request(`/roles/${id}`),
  createJobRole: (role) => request('/roles', { method: 'POST', body: JSON.stringify(role) }),
  updateJobRole: (id, role) => request(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(role) }),
  deleteJobRole: (id) => request(`/roles/${id}`, { method: 'DELETE' }),

  // Candidates & Analysis
  getCandidates: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return request(`/candidates${qs ? `?${qs}` : ''}`);
  },
  getCandidateById: (id) => request(`/candidates/${id}`),
  uploadResumes: (formData) => request('/candidates/upload', { method: 'POST', body: formData }),
  analyzeResume: (payload) => request('/candidates/analyze', { method: 'POST', body: JSON.stringify(payload) }),
  batchAnalyze: (payload) => request('/candidates/batch-analyze', { method: 'POST', body: JSON.stringify(payload) }),
  reanalyzeCandidate: (id) => request(`/candidates/${id}/reanalyze`, { method: 'POST' }),
  updateCandidateStatus: (id, status) => request(`/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),
  viewResumeText: (id) => request(`/candidates/${id}/resume/view`),
  getResumeDownloadUrl: (id) => `${API_BASE}/candidates/${id}/resume/download`,

  // Gmail Integration
  getGmailEmails: (forceSample = false) => request(`/gmail/emails?forceSample=${forceSample}`),
  importGmailAttachment: (messageId, attachmentId) => request('/gmail/import-attachment', {
    method: 'POST',
    body: JSON.stringify({ messageId, attachmentId })
  }),
  syncGmail: () => request('/gmail/sync', { method: 'POST' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  seedSampleData: () => request('/settings/seed-sample-data', { method: 'POST' })
};
