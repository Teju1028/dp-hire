// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Mail,
  Sliders,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Key,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings({ settings = {}, onSettingsUpdated, onReloadData }) {
  const [strongMatch, setStrongMatch] = useState(settings.thresholds?.strongMatch || 80);
  const [potentialMatch, setPotentialMatch] = useState(settings.thresholds?.potentialMatch || 60);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-2.5-flash');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (settings.thresholds) {
      setStrongMatch(settings.thresholds.strongMatch || 80);
      setPotentialMatch(settings.thresholds.potentialMatch || 60);
    }
    if (settings.geminiModel) {
      setGeminiModel(settings.geminiModel);
    }
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const strong = Number(strongMatch);
    const potential = Number(potentialMatch);

    if (isNaN(strong) || isNaN(potential) || strong <= potential || strong > 100 || potential < 0) {
      setErrorMsg('Invalid thresholds: Strong Match must be greater than Potential Match (0 to 100%).');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        thresholds: {
          strongMatch: strong,
          potentialMatch: potential
        },
        geminiModel
      };

      if (geminiApiKey.trim()) {
        payload.geminiApiKey = geminiApiKey.trim();
      }

      const res = await api.updateSettings(payload);
      setSuccessMsg('Recruitment thresholds and settings saved successfully.');
      if (onSettingsUpdated) onSettingsUpdated(res.settings);
      setGeminiApiKey('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedSampleData = async () => {
    if (!window.confirm('Initialize rich sample recruitment data (Python & Java roles, candidate evaluations, and Gmail inbox)?')) {
      return;
    }
    setSeeding(true);
    setErrorMsg('');
    try {
      const res = await api.seedSampleData();
      setSuccessMsg(res.message || 'Sample recruitment data initialized successfully.');
      if (onReloadData) await onReloadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Error initializing sample data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-sky-400" />
          <span>System & Recruitment Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure AI match thresholds, Gemini API credentials, and HR integration policies.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Candidate Match Percentage Thresholds */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Candidate Match Percentage Thresholds
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Define the benchmark percentage bands used by DP Hire to classify candidates into Strong, Potential, and Low match categories.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Strong Match Threshold (%)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Candidates scoring at or above this value are marked as Strong Matches (Default: 80%).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={strongMatch}
                  onChange={(e) => setStrongMatch(e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-mono font-bold text-white outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">
                  Range: {strongMatch}% to 100%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                Potential Match Threshold (%)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Candidates scoring below Strong Match but at/above this value (Default: 60%).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  max="80"
                  value={potentialMatch}
                  onChange={(e) => setPotentialMatch(e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-mono font-bold text-white outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400 font-mono">
                  Range: {potentialMatch}% to {strongMatch - 1}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <strong>Low Match Band:</strong> Automatically assigned to any candidate scoring below <span className="text-rose-400 font-mono font-bold">{potentialMatch}%</span>.
          </div>
        </div>

        {/* Section 2: Google Gemini AI Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Google Gemini AI Model
              </h3>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              settings.hasGeminiKey
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {settings.hasGeminiKey ? 'Gemini API Key Configured' : 'Using Intelligent Built-in Analyzer'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Gemini Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-sky-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest & High Precision)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Update Gemini API Key (Optional)
              </label>
              <input
                type="password"
                placeholder={settings.hasGeminiKey ? '••••••••••••••••••••••••' : 'AIzaSy... (Paste Google AI Studio Key)'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            DP Hire uses Google Gemini for deep semantic understanding, multi-lingual resume parsing, and transparent evidence extraction against HR's configured criteria weightages.
          </p>
        </div>

        {/* Section 3: Authorized Account & Access Restriction */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Access Control & Official HR Account
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  Authorized HR Email: <span className="text-sky-300 font-mono">hr.cbe@datapage.org</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  DataPage Coimbatore Operations • Exclusively authorized for candidate evaluation
                </div>
              </div>
            </div>

            <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
              Enforced
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleSeedSampleData}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            title="Load realistic candidate profiles and sample Gmail applications"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Initializing...' : 'Reset / Load Sample Recruitment Data'}</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
