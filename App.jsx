// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RoleModal from './components/RoleModal';
import CandidateDetailModal from './components/CandidateDetailModal';
import ResumeViewerModal from './components/ResumeViewerModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobRoles from './pages/JobRoles';
import ImportResumes from './pages/ImportResumes';
import AnalyseResumes from './pages/AnalyseResumes';
import CandidateResults from './pages/CandidateResults';
import Shortlisted from './pages/Shortlisted';
import Settings from './pages/Settings';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Application Data States
  const [jobRoles, setJobRoles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [settings, setSettings] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [viewResumeCandidate, setViewResumeCandidate] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [rolesRes, candsRes, settingsRes] = await Promise.all([
        api.getJobRoles().catch(() => ({ roles: [] })),
        api.getCandidates().catch(() => ({ candidates: [] })),
        api.getSettings().catch(() => ({ settings: {} }))
      ]);

      setJobRoles(rolesRes.roles || []);
      setCandidates(candsRes.candidates || []);
      setSettings(settingsRes.settings || {});

      // Derive resumes from candidates or fetch
      const derivedResumes = (candsRes.candidates || []).map(c => ({
        id: c.id,
        originalFilename: c.resumeFilename,
        senderName: c.candidateName,
        senderEmail: c.candidateEmail,
        source: 'Stored Resume',
        fileSize: '120 KB',
        filePath: c.resumeFilePath
      }));
      setResumes(derivedResumes);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Header Titles
  const tabTitles = {
    dashboard: { title: 'HR Recruitment Overview', subtitle: 'Real-time candidate metrics and match distribution for DataPage' },
    roles: { title: 'Manage Job Roles', subtitle: 'Define dynamic recruitment criteria and individual weightages' },
    import: { title: 'Import Resumes', subtitle: 'Collect candidate applications from Gmail (hr.cbe@datapage.org) or upload files' },
    analyse: { title: 'Analyse Resumes with Gemini AI', subtitle: 'Benchmark candidate documents against role weightages' },
    candidates: { title: 'Candidate Matching Results', subtitle: 'Transparent scoring breakdown and candidate rankings' },
    shortlisted: { title: 'Shortlisted Candidates', subtitle: 'Curated pool of top candidates recommended for interview' },
    settings: { title: 'Recruitment Settings', subtitle: 'Match thresholds, Gemini AI models, and access control policies' },
  };

  // Role Handlers
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (roleData) => {
    try {
      if (editingRole) {
        const res = await api.updateJobRole(editingRole.id, roleData);
        setJobRoles(prev => prev.map(r => r.id === editingRole.id ? res.role : r));
      } else {
        const res = await api.createJobRole(roleData);
        setJobRoles(prev => [...prev, res.role]);
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job role? Candidates attached to it will be preserved.')) {
      return;
    }
    try {
      await api.deleteJobRole(id);
      setJobRoles(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Candidate Actions
  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      const res = await api.updateCandidateStatus(candidateId, newStatus);
      setCandidates(prev => prev.map(c => c.id === candidateId ? res.candidate : c));
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate(res.candidate);
      }
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleReanalyzeCandidate = async (candidateId) => {
    try {
      const res = await api.reanalyzeCandidate(candidateId);
      setCandidates(prev => prev.map(c => c.id === candidateId ? res.candidate : c));
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate(res.candidate);
      }
      alert(res.message);
    } catch (err) {
      alert('Re-analysis failed: ' + err.message);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this candidate evaluation and its resume file?')) return;
    try {
      await api.deleteCandidate(id);
      setCandidates(prev => prev.filter(c => c.id !== id));
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickSyncGmail = async () => {
    setSyncingGmail(true);
    try {
      await api.syncGmail();
      alert('Gmail synced with hr.cbe@datapage.org!');
    } catch (err) {
      alert('Gmail sync error: ' + err.message);
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleResumesImported = (newResumes) => {
    setResumes(prev => [...newResumes, ...prev]);
  };

  const handleAnalysisCompleted = (newCandidates) => {
    setCandidates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const filtered = newCandidates.filter(c => !existingIds.has(c.id));
      return [...filtered, ...prev];
    });
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-extrabold text-xl animate-pulse mb-3">
          DP
        </div>
        <p className="text-xs font-mono">Authenticating with DataPage Security Portal...</p>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const currentHeader = tabTitles[currentTab] || { title: 'DP Hire', subtitle: 'DataPage HR' };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Header */}
        <Header
          title={currentHeader.title}
          subtitle={currentHeader.subtitle}
          onSyncGmail={handleQuickSyncGmail}
          syncingGmail={syncingGmail}
          onOpenRoleModal={handleOpenCreateRole}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          {currentTab === 'dashboard' && (
            <Dashboard
              candidates={candidates}
              jobRoles={jobRoles}
              resumes={resumes}
              settings={settings}
              onNavigate={setCurrentTab}
              onOpenCandidateDetail={setSelectedCandidate}
              onOpenRoleModal={handleOpenCreateRole}
            />
          )}

          {currentTab === 'roles' && (
            <JobRoles
              jobRoles={jobRoles}
              candidates={candidates}
              onOpenCreateModal={handleOpenCreateRole}
              onOpenEditModal={handleOpenEditRole}
              onDeleteRole={handleDeleteRole}
            />
          )}

          {currentTab === 'import' && (
            <ImportResumes
              onNavigate={setCurrentTab}
              onResumesImported={handleResumesImported}
            />
          )}

          {currentTab === 'analyse' && (
            <AnalyseResumes
              jobRoles={jobRoles}
              resumes={resumes}
              onAnalysisCompleted={handleAnalysisCompleted}
              onNavigate={setCurrentTab}
              onOpenCandidateDetail={setSelectedCandidate}
            />
          )}

          {currentTab === 'candidates' && (
            <CandidateResults
              candidates={candidates}
              jobRoles={jobRoles}
              settings={settings}
              onOpenCandidateDetail={setSelectedCandidate}
              onViewResumeText={setViewResumeCandidate}
              onStatusChange={handleStatusChange}
              onReanalyze={handleReanalyzeCandidate}
              onDeleteCandidate={handleDeleteCandidate}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'shortlisted' && (
            <Shortlisted
              candidates={candidates}
              jobRoles={jobRoles}
              onOpenCandidateDetail={setSelectedCandidate}
              onStatusChange={handleStatusChange}
              onViewResumeText={setViewResumeCandidate}
            />
          )}

          {currentTab === 'settings' && (
            <Settings
              settings={settings}
              onSettingsUpdated={setSettings}
              onReloadData={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        editingRole={editingRole}
      />

      <CandidateDetailModal
        isOpen={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onStatusChange={handleStatusChange}
        onReanalyze={handleReanalyzeCandidate}
        onViewResumeText={setViewResumeCandidate}
        onDeleteCandidate={handleDeleteCandidate}
      />

      <ResumeViewerModal
        isOpen={Boolean(viewResumeCandidate)}
        candidate={viewResumeCandidate}
        onClose={() => setViewResumeCandidate(null)}
      />
    </div>
  );
}
