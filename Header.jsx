// src/components/Header.jsx
import React from 'react';
import { Mail, Sparkles, RefreshCw, PlusCircle, Check } from 'lucide-react';

export default function Header({ title, subtitle, onSyncGmail, syncingGmail, onOpenRoleModal }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onSyncGmail && (
          <button
            onClick={onSyncGmail}
            disabled={syncingGmail}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
            title="Sync Gmail inbox for candidate resumes"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${syncingGmail ? 'animate-spin' : ''}`} />
            <span>{syncingGmail ? 'Syncing Gmail...' : 'Sync Gmail'}</span>
          </button>
        )}

        {onOpenRoleModal && (
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-900 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Job Role</span>
          </button>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            DataPage HR (Active)
          </span>
        </div>
      </div>
    </header>
  );
}
