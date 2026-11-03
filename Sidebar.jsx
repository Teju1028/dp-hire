// src/components/Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  Sparkles,
  Users,
  CheckCircle2,
  Settings,
  LogOut,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { user, logout, authorizedEmail } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roles', label: 'Manage Job Roles', icon: Briefcase },
    { id: 'import', label: 'Import Resumes', icon: Inbox },
    { id: 'analyse', label: 'Analyse Resumes', icon: Sparkles, badge: 'AI' },
    { id: 'candidates', label: 'Candidate Results', icon: Users },
    { id: 'shortlisted', label: 'Shortlisted Candidates', icon: CheckCircle2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-xl tracking-tight">
              DP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight">DP Hire</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" /> DataPage HR Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Recruitment Hub
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
              Authorized HR
            </span>
          </div>
          <div className="text-xs font-medium text-slate-200 truncate" title={authorizedEmail}>
            {authorizedEmail}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Coimbatore HR Department
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 rounded-lg transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
