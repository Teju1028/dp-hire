// src/components/CandidateDetailModal.jsx
import React from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  ExternalLink,
  Award,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

export default function CandidateDetailModal({
  isOpen,
  onClose,
  candidate,
  onStatusChange,
  onReanalyze,
  onViewResumeText,
  onDeleteCandidate
}) {
  if (!isOpen || !candidate) return null;

  const score = candidate.overallMatchPercentage || 0;
  let tierBadge = {
    label: 'Low Match',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    ring: 'text-rose-400'
  };
  if (score >= 80) {
    tierBadge = {
      label: 'Strong Match',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      ring: 'text-emerald-400'
    };
  } else if (score >= 60) {
    tierBadge = {
      label: 'Potential Match',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      ring: 'text-amber-400'
    };
  }

  const handleDownload = () => {
    window.open(api.getResumeDownloadUrl(candidate.id), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-sky-500/20 shrink-0">
              {candidate.candidateName?.substring(0, 2).toUpperCase() || 'CA'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {candidate.candidateName}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierBadge.bg}`}>
                  {score}% – {tierBadge.label}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                  candidate.status === 'Shortlisted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : candidate.status === 'Rejected'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  Status: {candidate.status || 'New'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-sky-400 font-semibold">{candidate.jobRoleTitle}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {candidate.candidateEmail}
                </span>
                {candidate.candidatePhone && candidate.candidatePhone !== 'Not found' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {candidate.candidatePhone}
                    </span>
                  </>
                )}
                {candidate.candidateLocation && candidate.candidateLocation !== 'Not specified' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {candidate.candidateLocation}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive AI Evaluation Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 via-slate-900 to-indigo-950/30 border border-sky-500/25">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI Evaluation Summary
              </span>
              <span className="text-[11px] text-slate-400">
                {candidate.analyzedBy || 'Google Gemini'}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {candidate.evaluationSummary || 'No summary provided.'}
            </p>
          </div>

          {/* Quick Metrics & Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <GraduationCap className="w-4 h-4 text-sky-400" /> Education Alignment
              </div>
              <p className="text-xs font-medium text-slate-200">
                {candidate.educationMatch || 'Standard academic evaluation'}
              </p>
              {candidate.educationDetails?.length > 0 && (
                <ul className="mt-2 text-xs text-slate-400 list-disc list-inside space-y-0.5">
                  {candidate.educationDetails.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Experience Alignment
              </div>
              <p className="text-xs font-medium text-slate-200">
                {candidate.experienceMatch || 'Experience evaluated'}
              </p>
              <div className="mt-2 text-xs text-slate-400">
                Total Industry Experience: <span className="text-white font-bold">{candidate.totalExperienceYears} years</span>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/20">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Matched Skills & Criteria ({candidate.matchedSkills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.matchedSkills?.length > 0 ? (
                  candidate.matchedSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                    >
                      ✓ {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No specific matching skills found</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/15 border border-rose-500/20">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <XCircle className="w-4 h-4 text-rose-400" /> Missing or Weak Requirements ({candidate.missingSkills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.missingSkills?.length > 0 ? (
                  candidate.missingSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium"
                    >
                      ✗ {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">Candidate satisfies all core requirements!</span>
                )}
              </div>
            </div>
          </div>

          {/* Transparent Scoring Breakdown Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>Transparent Scoring Breakdown (Weighted Match: {score}%)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Formula: ∑ (Score × Weight) / 100
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Criterion</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-center">Weight</th>
                    <th className="py-2.5 px-2 text-center">Score (0-100)</th>
                    <th className="py-2.5 px-2 text-center">Weighted</th>
                    <th className="py-2.5 px-3">Evidence & HR Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(candidate.criteriaBreakdown || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        {row.criterionName}
                      </td>
                      <td className="py-3 px-2 text-slate-400">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {row.category || 'Skill'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-sky-400 font-bold">
                        {row.weight}%
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          row.score >= 80 ? 'text-emerald-400 bg-emerald-950/40' :
                          row.score >= 60 ? 'text-amber-400 bg-amber-950/40' : 'text-rose-400 bg-rose-950/40'
                        }`}>
                          {row.score}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-white font-bold">
                        +{row.weightedScore}%
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {row.evidenceFound && (
                          <div className="text-[11px] text-sky-300 font-medium mb-1">
                            Evidence: "{row.evidenceFound}"
                          </div>
                        )}
                        <div className="text-slate-400">{row.evaluationNotes}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900/80 font-bold border-t border-slate-800">
                    <td colSpan="2" className="py-2.5 px-3 text-slate-300">
                      Total Recruitment Match Score
                    </td>
                    <td className="py-2.5 px-2 text-center text-sky-400">100%</td>
                    <td className="py-2.5 px-2 text-center text-slate-400">—</td>
                    <td className="py-2.5 px-2 text-center text-lg text-emerald-400 font-mono">
                      {score}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {tierBadge.label} (meets DataPage threshold)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Resume Document Info */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Resume File:</span>
              <span className="font-mono text-white font-semibold">{candidate.resumeFilename}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Resume</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Decision Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReanalyze(candidate.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
              title="Re-evaluate resume against latest job role criteria"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Re-analyze</span>
            </button>
            <button
              onClick={() => onDeleteCandidate(candidate.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-700 hover:border-rose-500/40 transition-all"
              title="Permanently delete this candidate evaluation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Evaluation</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onStatusChange(candidate.id, 'Rejected')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                candidate.status === 'Rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-950/70 border border-rose-500/30'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>{candidate.status === 'Rejected' ? 'Rejected' : 'Reject Candidate'}</span>
            </button>

            <button
              onClick={() => onStatusChange(candidate.id, 'Shortlisted')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all ${
                candidate.status === 'Shortlisted'
                  ? 'bg-emerald-600 text-white shadow-emerald-900/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{candidate.status === 'Shortlisted' ? 'Shortlisted ✓' : 'Shortlist Candidate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
