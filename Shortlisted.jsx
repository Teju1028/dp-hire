// src/pages/Shortlisted.jsx
import React, { useState } from 'react';
import {
  CheckCircle2,
  Users,
  Mail,
  Phone,
  Download,
  Eye,
  FileSpreadsheet,
  Briefcase,
  X,
  ExternalLink,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export default function Shortlisted({
  candidates = [],
  jobRoles = [],
  onOpenCandidateDetail,
  onStatusChange,
  onViewResumeText
}) {
  const [selectedRole, setSelectedRole] = useState('all');

  const shortlistedList = candidates.filter(c => c.status === 'Shortlisted');
  const filteredList = shortlistedList.filter(c =>
    selectedRole === 'all' || c.jobRoleId === selectedRole
  );

  const handleExportCsv = () => {
    if (filteredList.length === 0) return;

    const headers = ['Candidate Name', 'Email', 'Phone', 'Job Role', 'Match %', 'Top Skills', 'Filename'];
    const rows = filteredList.map(c => [
      `"${c.candidateName || ''}"`,
      `"${c.candidateEmail || ''}"`,
      `"${c.candidatePhone || ''}"`,
      `"${c.jobRoleTitle || ''}"`,
      c.overallMatchPercentage || 0,
      `"${(c.matchedSkills || []).join(', ')}"`,
      `"${c.resumeFilename || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DP_Hire_Shortlisted_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Shortlisted Candidates ({filteredList.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Top talent shortlisted by DataPage HR for technical rounds and interviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={filteredList.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Role Filter */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter by Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white outline-none"
          >
            <option value="all">All Roles ({shortlistedList.length})</option>
            {jobRoles.map((r) => {
              const count = shortlistedList.filter(c => c.jobRoleId === r.id).length;
              return (
                <option key={r.id} value={r.id}>
                  {r.title} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredList.length} shortlisted candidate(s)
        </span>
      </div>

      {/* Candidates Grid */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No shortlisted candidates in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Review candidate results and click the green checkmark to shortlist top applicants.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((cand) => (
            <div
              key={cand.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 p-5 flex flex-col justify-between transition-all shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {cand.candidateName}
                    </h3>
                    <p className="text-xs text-sky-400 font-medium">
                      {cand.jobRoleTitle}
                    </p>
                  </div>
                  <span className="text-base font-extrabold font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {cand.overallMatchPercentage}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a
                      href={`mailto:${cand.candidateEmail}`}
                      className="text-slate-300 hover:text-sky-400 underline font-mono truncate"
                    >
                      {cand.candidateEmail}
                    </a>
                  </div>
                  {cand.candidatePhone && cand.candidatePhone !== 'Not found' && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-300 font-mono">{cand.candidatePhone}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 mb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    AI Assessment Summary:
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed italic">
                    "{cand.evaluationSummary}"
                  </p>
                </div>

                {/* Top matched skills */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                    Key Strengths:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(cand.matchedSkills || []).slice(0, 3).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onStatusChange(cand.id, 'New')}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Remove Shortlist
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenCandidateDetail(cand)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Scorecard</span>
                  </button>
                  <button
                    onClick={() => window.open(api.getResumeDownloadUrl(cand.id), '_blank')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    title="Download resume"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
