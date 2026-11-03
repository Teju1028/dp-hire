// src/pages/JobRoles.jsx
import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Clock,
  MapPin,
  AlertTriangle
} from 'lucide-react';

export default function JobRoles({
  jobRoles = [],
  candidates = [],
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteRole
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const departments = ['all', ...new Set(jobRoles.map(r => r.department).filter(Boolean))];

  const filteredRoles = jobRoles.filter(role => {
    const matchesSearch = role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = departmentFilter === 'all' || role.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-400" />
            <span>Manage Job Roles & Recruitment Criteria</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure custom recruitment criteria and percentage weightages (strictly independent per role).
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Job Role</span>
        </button>
      </div>

      {/* Independent Role Notification Banner */}
      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/25 flex items-center gap-3 text-xs text-indigo-300">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong className="text-white">Strict Role Independence:</strong> Each job role maintains isolated recruitment criteria. Updating criteria for Python Developer will never alter Java Developer or any other role.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search job roles or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Department:
          </span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          const roleCandidates = candidates.filter(c => c.jobRoleId === role.id);
          const totalWeight = (role.criteria || []).reduce((acc, c) => acc + Number(c.weight || 0), 0);

          return (
            <div
              key={role.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between transition-all shadow-lg hover:shadow-sky-950/20"
            >
              <div>
                {/* Top Role Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {role.title}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
                        v{role.version || 1}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {role.department}
                    </span>
                  </div>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    role.status === 'Active'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {role.status || 'Active'}
                  </span>
                </div>

                {role.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                )}

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Min {role.minExperienceYears || 0} yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{role.location || 'Coimbatore'}</span>
                  </div>
                </div>

                {/* Criteria Breakdown */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-sky-400" /> Criteria Weightages ({role.criteria?.length || 0}):
                    </span>
                    <span className={`font-mono ${totalWeight === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {totalWeight}% Total
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(role.criteria || []).map((c, i) => (
                      <div
                        key={c.id || i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-medium text-slate-200 truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.category}</div>
                        </div>
                        <span className="font-mono font-bold text-sky-400 shrink-0">
                          {c.weight}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  <strong className="text-white font-bold">{roleCandidates.length}</strong> candidates
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenEditModal(role)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    title="Edit role and criteria weightages"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRole(role.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-all"
                    title="Delete job role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
