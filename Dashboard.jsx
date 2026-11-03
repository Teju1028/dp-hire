// src/pages/Dashboard.jsx
import React from 'react';
import {
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  XCircle,
  Inbox,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Users,
  Eye,
  Award
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Dashboard({
  candidates = [],
  jobRoles = [],
  resumes = [],
  settings = {},
  onNavigate,
  onOpenCandidateDetail,
  onOpenRoleModal
}) {
  const strongThresh = settings.thresholds?.strongMatch || 80;
  const potentialThresh = settings.thresholds?.potentialMatch || 60;

  const totalReceived = Math.max(resumes.length, candidates.length);
  const totalAnalysed = candidates.length;
  const strongMatches = candidates.filter(c => (c.overallMatchPercentage || 0) >= strongThresh);
  const potentialMatches = candidates.filter(c => {
    const s = c.overallMatchPercentage || 0;
    return s >= potentialThresh && s < strongThresh;
  });
  const lowMatches = candidates.filter(c => (c.overallMatchPercentage || 0) < potentialThresh);
  const shortlisted = candidates.filter(c => c.status === 'Shortlisted');

  // Distribution chart calculations
  const totalForChart = totalAnalysed || 1;
  const strongPct = Math.round((strongMatches.length / totalForChart) * 100);
  const potentialPct = Math.round((potentialMatches.length / totalForChart) * 100);
  const lowPct = Math.round((lowMatches.length / totalForChart) * 100);

  // Group candidates by Job Role
  const roleBreakdown = jobRoles.map(role => {
    const roleCands = candidates.filter(c => c.jobRoleId === role.id);
    const avgMatch = roleCands.length > 0
      ? Math.round(roleCands.reduce((sum, c) => sum + (c.overallMatchPercentage || 0), 0) / roleCands.length)
      : 0;
    const strong = roleCands.filter(c => (c.overallMatchPercentage || 0) >= strongThresh).length;
    return {
      ...role,
      candidateCount: roleCands.length,
      avgMatch,
      strongCount: strong
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-900/40 via-slate-900 to-indigo-900/30 border border-sky-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
              DataPage HR Recruitment
            </span>
            <span className="text-xs text-slate-400">Coimbatore Hub</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            AI Talent Screening & Matching Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Automatically ingest candidate resumes via official HR Gmail (<span className="text-sky-300 font-mono">hr.cbe@datapage.org</span>) or manual upload, then benchmark against custom role weightages.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('import')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Inbox className="w-4 h-4 text-sky-400" />
            <span>Import Resumes</span>
          </button>
          <button
            onClick={() => onNavigate('analyse')}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-900/40 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run AI Analysis</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Resumes Received"
          value={totalReceived}
          subtitle="Gmail & Uploads"
          icon={FileText}
          color="sky"
        />
        <StatCard
          title="Resumes Analysed"
          value={totalAnalysed}
          subtitle="Gemini Evaluated"
          icon={Sparkles}
          color="indigo"
        />
        <StatCard
          title="Strong Matches"
          value={strongMatches.length}
          subtitle={`≥ ${strongThresh}% Score`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Potential Matches"
          value={potentialMatches.length}
          subtitle={`${potentialThresh}-${strongThresh - 1}% Score`}
          icon={TrendingUp}
          color="amber"
        />
        <StatCard
          title="Low Matches"
          value={lowMatches.length}
          subtitle={`< ${potentialThresh}% Score`}
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Shortlisted"
          value={shortlisted.length}
          subtitle="HR Approved"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Match Distribution Visual Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <span>Match Score Distribution</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {totalAnalysed} candidates
              </span>
            </div>

            {/* Custom SVG Radial / Multi-Segment Bar Chart */}
            <div className="space-y-4 my-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-emerald-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Strong Match ({strongThresh}–100%)
                  </span>
                  <span className="text-white font-bold">{strongMatches.length} ({strongPct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${strongPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-amber-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Potential Match ({potentialThresh}–{strongThresh - 1}%)
                  </span>
                  <span className="text-white font-bold">{potentialMatches.length} ({potentialPct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${potentialPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-rose-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Low Match (&lt; {potentialThresh}%)
                  </span>
                  <span className="text-white font-bold">{lowMatches.length} ({lowPct}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${lowPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Thresholds configurable in Settings</span>
            <button
              onClick={() => onNavigate('settings')}
              className="text-sky-400 hover:underline"
            >
              Adjust
            </button>
          </div>
        </div>

        {/* Role-by-Role Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span>Job Roles & Candidate Funnel</span>
              </h3>
              <button
                onClick={onOpenRoleModal}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                + New Role
              </button>
            </div>

            <div className="space-y-3">
              {roleBreakdown.map((role) => (
                <div
                  key={role.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {role.title}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        v{role.version || 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {role.department} • {role.criteria?.length || 0} weighted criteria
                    </p>
                  </div>

                  <div className="flex items-center gap-5 text-right shrink-0">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {role.candidateCount}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">Applicants</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-400">
                        {role.strongCount}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">Strong</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-400 font-mono">
                        {role.avgMatch}%
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">Avg Match</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Each job role maintains independent recruitment criteria
            </span>
            <button
              onClick={() => onNavigate('roles')}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
            >
              <span>Manage Roles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recently Evaluated Candidates Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Recent AI Candidate Evaluations</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by weighted criteria match percentage
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidates')}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
          >
            <span>View All ({candidates.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No candidates analysed yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Import resumes from Gmail or upload files to run AI recruitment matching.
            </p>
            <button
              onClick={() => onNavigate('import')}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
            >
              Import Resumes Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Job Role</th>
                  <th className="py-3 px-3 text-center">Match %</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Top Matched Skills</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.slice(0, 5).map((cand) => {
                  const score = cand.overallMatchPercentage || 0;
                  const isStrong = score >= strongThresh;
                  const isPotential = score >= potentialThresh && score < strongThresh;
                  return (
                    <tr key={cand.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{cand.candidateName}</div>
                        <div className="text-slate-400 text-[11px]">{cand.candidateEmail}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 font-medium">{cand.jobRoleTitle}</span>
                        <div className="text-[10px] text-slate-500 font-mono">v{cand.jobRoleVersion || 1}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          isStrong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isPotential ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {score}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-medium ${
                          isStrong ? 'text-emerald-400' : isPotential ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {isStrong ? 'Strong Match' : isPotential ? 'Potential Match' : 'Low Match'}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate">
                        <div className="flex flex-wrap gap-1">
                          {(cand.matchedSkills || []).slice(0, 2).map((s, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {s}
                            </span>
                          ))}
                          {(cand.matchedSkills || []).length > 2 && (
                            <span className="text-[10px] text-slate-500">
                              +{(cand.matchedSkills.length - 2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          cand.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-300' :
                          cand.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {cand.status || 'New'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenCandidateDetail(cand)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 font-semibold text-xs transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Scorecard</span>
                        </button>
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
