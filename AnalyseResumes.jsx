// src/pages/AnalyseResumes.jsx
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Briefcase,
  FileText,
  CheckCircle,
  AlertCircle,
  Play,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  CheckSquare,
  Square,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalyseResumes({
  jobRoles = [],
  resumes = [],
  onAnalysisCompleted,
  onNavigate,
  onOpenCandidateDetail
}) {
  const [selectedRoleId, setSelectedRoleId] = useState(jobRoles[0]?.id || '');
  const [selectedResumeIds, setSelectedResumeIds] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!selectedRoleId && jobRoles.length > 0) {
      setSelectedRoleId(jobRoles[0].id);
    }
  }, [jobRoles]);

  const selectedRole = jobRoles.find(r => r.id === selectedRoleId) || jobRoles[0];

  const toggleResumeSelection = (id) => {
    setSelectedResumeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllResumes = () => {
    setSelectedResumeIds(resumes.map(r => r.id));
  };

  const clearSelection = () => {
    setSelectedResumeIds([]);
  };

  const handleRunAnalysis = async () => {
    if (!selectedRoleId) {
      setErrorMsg('Please select a target Job Role first.');
      return;
    }
    if (selectedResumeIds.length === 0) {
      setErrorMsg('Please select at least one candidate resume to analyse.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalysisResults([]);
    setProgressText('Extracting document text and initializing Gemini AI model...');

    try {
      // Analyze selected resumes in batch
      setProgressText(`Evaluating ${selectedResumeIds.length} resume(s) against "${selectedRole.title}" criteria...`);
      const res = await api.batchAnalyze({
        jobRoleId: selectedRoleId,
        resumeIds: selectedResumeIds
      });

      setAnalysisResults(res.results || []);
      if (onAnalysisCompleted) {
        onAnalysisCompleted(res.results || []);
      }
      setProgressText('AI Analysis completed successfully!');
    } catch (err) {
      setErrorMsg('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <span>AI Resume Analysis & Matching Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gemini AI benchmarks candidate resumes against your configured role criteria and individual weightages.
          </p>
        </div>

        {analysisResults.length > 0 && (
          <button
            onClick={() => onNavigate('candidates')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>View All Results ({analysisResults.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Select Job Role */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Select Target Job Role
            </h3>
          </div>
          <button
            onClick={() => onNavigate('roles')}
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust Criteria Weights</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {jobRoles.map((role) => {
            const isSelected = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500 shadow-md shadow-sky-950'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-white truncate">{role.title}</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    v{role.version || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mb-2">{role.department}</p>
                <div className="text-[11px] text-sky-400 font-mono">
                  {role.criteria?.length || 0} Criteria • 100% Weighted
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Role Criteria Preview */}
        {selectedRole && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Recruitment Criteria for {selectedRole.title}:</span>
              <span className="text-emerald-400 font-mono">100% Total Weightage</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {(selectedRole.criteria || []).map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="font-semibold text-white truncate">{c.name}</div>
                  <div className="text-sky-400 font-bold font-mono mt-0.5">{c.weight}%</div>
                  <div className="text-[10px] text-slate-500 truncate">{c.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Select Resumes */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Select Resumes to Analyse ({selectedResumeIds.length} of {resumes.length} selected)
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={selectAllResumes}
              className="text-sky-400 hover:underline font-medium"
            >
              Select All
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={clearSelection}
              className="text-slate-400 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No resumes imported yet.</p>
            <button
              onClick={() => onNavigate('import')}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold"
            >
              Go to Import Resumes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {resumes.map((r) => {
              const isChecked = selectedResumeIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => toggleResumeSelection(r.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-sky-500/15 border-sky-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate font-mono">
                      {r.originalFilename}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {r.senderName || 'Candidate'} • {r.source || 'Upload'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {r.fileSize}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 3: Trigger AI Analysis */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <span>Ready for Gemini AI Evaluation</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {selectedResumeIds.length} candidate resume(s) will be parsed and scored against the 100% weighted criteria defined for "{selectedRole?.title}".
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || selectedResumeIds.length === 0}
          className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-sky-900/50 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Resumes...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run AI Evaluation ({selectedResumeIds.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Progress & Live Results */}
      {isAnalyzing && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-sky-500/30 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">AI Evaluation in Progress</h4>
          <p className="text-xs text-sky-400 font-mono">{progressText}</p>
        </div>
      )}

      {/* Results summary table after analysis run */}
      {analysisResults.length > 0 && !isAnalyzing && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Analysis Completed ({analysisResults.length} Candidates Evaluated)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('candidates')}
              className="text-xs text-sky-400 hover:underline font-semibold"
            >
              Open Full Results Table →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysisResults.map((c) => {
              const score = c.overallMatchPercentage || 0;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {c.candidateName}
                      </h4>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {score}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-2 truncate">
                      {c.candidateEmail}
                    </p>

                    <p className="text-xs text-slate-300 line-clamp-2 italic mb-3">
                      "{c.evaluationSummary}"
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenCandidateDetail(c)}
                    className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Scorecard</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
