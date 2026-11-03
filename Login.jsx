// src/pages/Login.jsx
import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth, AUTHORIZED_EMAIL } from '../context/AuthContext';

export default function Login() {
  const { loginWithGoogle, loginAsAuthorizedHr, testUnauthorized, authError, setAuthError } = useAuth();
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualGooglePrompt, setShowManualGooglePrompt] = useState(false);

  const handleAuthorizedHrLogin = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await loginAsAuthorizedHr();
    } catch (err) {
      // error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestUnauthorized = async () => {
    setIsSubmitting(true);
    try {
      await testUnauthorized('applicant.john@gmail.com');
    } catch (err) {
      // triggers Access Denied message
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) return;

    setIsSubmitting(true);
    try {
      await loginWithGoogle({
        email: googleEmailInput.trim(),
        name: googleEmailInput.split('@')[0],
        picture: null
      });
    } catch (err) {
      // sets Access Denied error if not hr.cbe@datapage.org
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Top Banner */}
      <header className="p-6 border-b border-slate-900 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-sky-500/20">
            DP
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight">DP Hire</span>
            <span className="text-xs text-slate-400 block font-normal">DataPage Recruitment Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-sky-400" />
          <span>Restricted HR Access</span>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle accent light */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400" />

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-4 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              DataPage HR Login
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              AI-Powered Candidate Resume Analysis & Recruitment Evaluation System
            </p>
          </div>

          {/* Access Policy Notice */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1">
              <Info className="w-4 h-4 shrink-0" />
              <span>Strict Authorization Policy</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Only the authorized HR administrator (<span className="text-sky-300 font-mono font-medium">{AUTHORIZED_EMAIL}</span>) is permitted to access candidate profiles, job criteria, and recruitment evaluations.
            </p>
          </div>

          {/* Error Banner: Access Denied */}
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3 animate-shake">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-300 text-sm tracking-tight mb-0.5">
                  {authError}
                </div>
                <div className="text-rose-400/90 leading-relaxed">
                  Only the official HR address ({AUTHORIZED_EMAIL}) is permitted. Other Google accounts are strictly rejected.
                </div>
              </div>
            </div>
          )}

          {/* Login Actions */}
          <div className="space-y-3">
            {/* Primary Action: Sign in as Authorized HR */}
            <button
              onClick={handleAuthorizedHrLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-900/40 hover:shadow-sky-800/60 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google Sign-In as {AUTHORIZED_EMAIL}</span>
            </button>

            {/* Test Access Denied Behavior */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestUnauthorized}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-rose-900/50 text-xs font-medium transition-all"
                title="Verify requirement 1: Rejection of any unauthorized email"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Test Unauthorized Google Account (Rejection Demo)</span>
              </button>
            </div>

            {/* Manual Google Account Entry Toggle */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowManualGooglePrompt(!showManualGooglePrompt)}
                className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors"
              >
                {showManualGooglePrompt ? '▲ Hide manual email tester' : '▼ Test custom Google email address'}
              </button>
            </div>

            {showManualGooglePrompt && (
              <form onSubmit={handleCustomGoogleSubmit} className="pt-2 space-y-2">
                <input
                  type="email"
                  placeholder="Enter email e.g. other@gmail.com"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !googleEmailInput.trim()}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition-all"
                >
                  Attempt Google Sign-In with this Email
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-900 text-center text-xs text-slate-500 z-10 flex items-center justify-center gap-2">
        <Building2 className="w-3.5 h-3.5" />
        <span>DataPage (Coimbatore) • DP Hire AI Recruitment Assistant</span>
      </footer>
    </div>
  );
}
