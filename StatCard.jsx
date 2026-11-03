// src/components/StatCard.jsx
import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'sky', badge }) {
  const colorMap = {
    sky: 'from-sky-500/10 to-sky-500/5 text-sky-400 border-sky-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-400 border-rose-500/20',
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20'
  };

  const iconBgMap = {
    sky: 'bg-sky-500/15 text-sky-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
    indigo: 'bg-indigo-500/15 text-indigo-400',
    purple: 'bg-purple-500/15 text-purple-400'
  };

  return (
    <div className={`p-5 rounded-xl border bg-gradient-to-br ${colorMap[color] || colorMap.sky} relative overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBgMap[color] || iconBgMap.sky}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{badge}</span>
        </div>
      )}
    </div>
  );
}
