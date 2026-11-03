// src/pages/CandidateResults.jsx
import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function CandidateResults({
  candidates = [],
  jobRoles = [],
  settings = {},
  onOpenCandidateDetail,
  onViewResumeText,
  onStatusChange,
  onReanalyze,
  onDeleteCandidate,
  onNavigate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('score_desc');

  const strongThresh = settings.thresholds?.strongMatch || 80;
  const potentialThresh = settings.thresholds?.potentialMatch || 60;

  // Filter candidates
  const filteredCandidates = candidates.filter(cand => {
    // Search keyword
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q ||
      cand.candidateName.toLowerCase().includes(q) ||
      cand.candidateEmail.toLowerCase().includes(q) ||
      cand.jobRoleTitle.toLowerCase().includes(q) ||
      cand.resumeFilename.toLowerCase().includes(q) ||
      (cand.matchedSkills || []).some(s => s.toLowerCase().includes(q));

    // Role filter
    const matchesRole = selectedRole === 'all' || cand.jobRoleId === selectedRole;

    // Status filter
    const matchesStatus = selectedStatus === 'all' || (cand.status || 'New').toLowerCase() === selectedStatus.toLowerCase();

    // Tier filter
    const score = cand.overallMatchPercentage || 0;
    let matchesTier = true;
    if (selectedTier === 'Strong Match') matchesTier = score >= strongThresh;
    else if (selectedTier === 'Potential Match') matchesTier = score >= potentialThresh && score < strongThresh;
    else if (selectedTier === 'Low Match') matchesTier = score < potentialThresh;

    return matchesSearch && matchesRole && matchesStatus && matchesTier;
  });

  // Sort candidates
  filteredCandidates.sort((a, b) => {
    if (sortBy === 'score_desc') return (b.overallMatchPercentage || 0) - (a.overallMatchPercentage || 0);
    if (sortBy === 'score_asc') return (a.overallMatchPercentage || 0) - (b.overallMatchPercentage || 0);
    if (sortBy === 'name') return (a.candidateName || '').localeCompare(b.candidateName || '');
    if (sortBy === 'date') return new Date(b.analyzedAt || 0) - new Date(a.analyzedAt || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Candidate Matching Results</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Objective, weighted scoring breakdown evaluated against HR job role requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Total Analysed: <strong className="text-white">{candidates.length}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-xs text-emerald-400 font-medium">
            Strong Match: &ge;{strongThresh}%
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name, email, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Job Role Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Job Roles</option>
              {jobRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Match Tier Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Match Tiers</option>
              <option value="Strong Match">Strong Match ({strongThresh}-100%)</option>
              <option value="Potential Match">Potential Match ({potentialThresh}-{strongThresh - 1}%)</option>
              <option value="Low Match">Low Match (&lt;{potentialThresh}%)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="New">New / Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none font-medium"
              title="Sort criteria"
            >
              <option value="score_desc">Highest %</option>
              <option value="score_asc">Lowest %</option>
              <option value="name">Name</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">No candidate matches found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, selecting "All Job Roles", or running AI analysis on newly imported resumes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Candidate & Role</th>
                  <th className="py-3 px-3 text-center">Match %</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3">Matched Skills</th>
                  <th className="py-3 px-3">Missing Requirements</th>
                  <th className="py-3 px-3">Education & Exp</th>
                  <th className="py-3 px-3">HR Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredCandidates.map((cand) => {
                  const score = cand.overallMatchPercentage || 0;
                  const isStrong = score >= strongThresh;
                  const isPotential = score >= potentialThresh && score < strongThresh;

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Candidate Name & Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
                          {cand.candidateName}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          {cand.candidateEmail}
                        </div>
                        <div className="text-[11px] text-sky-400/90 font-medium mt-0.5 flex items-center gap-1.5">
                          <span>{cand.jobRoleTitle}</span>
                          <span className="text-[10px] text-slate-500 font-mono">v{cand.jobRoleVersion || 1}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={cand.resumeFilename}>
                          File: {cand.resumeFilename}
                        </div>
                      </td>

                      {/* Match Percentage */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-base font-extrabold font-mono px-2.5 py-1 rounded-lg border ${
                            isStrong
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isPotential
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}>
                            {score}%
                          </span>
                        </div>
                      </td>

                      {/* Tier Categorization */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                          isStrong
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : isPotential
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-rose-950/60 text-rose-300'
                        }`}>
                          {isStrong ? 'Strong Match' : isPotential ? 'Potential Match' : 'Low Match'}
                        </span>
                      </td>

                      {/* Matched Skills */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(cand.matchedSkills || []).slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              ✓ {s}
                            </span>
                          ))}
                          {(cand.matchedSkills || []).length > 3 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              +{(cand.matchedSkills.length - 3)} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Missing Skills */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(cand.missingSkills || []).length === 0 ? (
                            <span className="text-[10px] text-emerald-400 font-medium">None (All Met)</span>
                          ) : (
                            (cand.missingSkills || []).slice(0, 2).map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                              >
                                ✗ {s}
                              </span>
                            ))
                          )}
                          {(cand.missingSkills || []).length > 2 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              +{(cand.missingSkills.length - 2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Education & Experience Alignment */}
                      <td className="py-3.5 px-3 text-[11px] text-slate-300 max-w-[180px]">
                        <div className="truncate font-medium text-white">
                          Exp: {cand.totalExperienceYears} yrs
                        </div>
                        <div className="text-slate-400 truncate text-[10px]" title={cand.educationMatch}>
                          {cand.educationMatch || 'Standard degree'}
                        </div>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onStatusChange(cand.id, cand.status === 'Shortlisted' ? 'New' : 'Shortlisted')}
                            className={`p-1 rounded-md transition-all ${
                              cand.status === 'Shortlisted'
                                ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                                : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title={cand.status === 'Shortlisted' ? 'Remove shortlist' : 'Shortlist candidate'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onStatusChange(cand.id, cand.status === 'Rejected' ? 'New' : 'Rejected')}
                            className={`p-1 rounded-md transition-all ${
                              cand.status === 'Rejected'
                                ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40'
                                : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                            }`}
                            title={cand.status === 'Rejected' ? 'Unmark rejected' : 'Reject candidate'}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <span className={`text-[10px] font-bold uppercase ${
                            cand.status === 'Shortlisted' ? 'text-emerald-400' :
                            cand.status === 'Rejected' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {cand.status || 'New'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenCandidateDetail(cand)}
                            className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-semibold text-xs transition-all flex items-center gap-1"
                            title="Detailed transparent AI scorecard breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Scorecard</span>
                          </button>

                          <button
                            onClick={() => window.open(api.getResumeDownloadUrl(cand.id), '_blank')}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                            title="Download original resume file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onReanalyze(cand.id)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition-all"
                            title="Re-analyze against updated criteria"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteCandidate(cand.id)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-all"
                            title="Delete candidate evaluation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
