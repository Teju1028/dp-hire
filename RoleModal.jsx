// src/components/RoleModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Required Skill',
  'Preferred Skill',
  'Technical Skill',
  'Education',
  'Experience',
  'Certification',
  'Soft Skill'
];

const PRESET_TEMPLATES = [
  {
    name: 'Python Developer (DataPage Standard)',
    title: 'Python Developer',
    department: 'Software Engineering',
    location: 'Coimbatore, India',
    experienceLevel: 'Mid to Senior (3-6 years)',
    minExperienceYears: 3,
    description: 'Build backend microservices, data processing pipelines, and AI workflows.',
    criteria: [
      { name: 'Python Programming', category: 'Required Skill', weight: 30, description: 'Core Python, async programming, data structures' },
      { name: 'SQL & Database Design', category: 'Required Skill', weight: 20, description: 'PostgreSQL, query optimization, indexing' },
      { name: 'Machine Learning / AI', category: 'Preferred Skill', weight: 20, description: 'PyTorch, Scikit-learn, or LLM APIs' },
      { name: 'Communication & Teamwork', category: 'Soft Skill', weight: 10, description: 'Documentation, agile collaboration' },
      { name: 'Problem Solving & Algorithms', category: 'Technical Skill', weight: 10, description: 'System design, complexity analysis' },
      { name: 'Education (B.Tech/BE/MCA/M.Sc)', category: 'Education', weight: 10, description: 'Engineering or Computer Science degree' }
    ]
  },
  {
    name: 'Java Developer (DataPage Standard)',
    title: 'Java Developer',
    department: 'Enterprise Solutions',
    location: 'Coimbatore, India',
    experienceLevel: 'Mid-Level (2-5 years)',
    minExperienceYears: 2,
    description: 'Enterprise microservices development using Spring Boot and cloud architecture.',
    criteria: [
      { name: 'Core Java & Multi-threading', category: 'Required Skill', weight: 35, description: 'Java 17+, Concurrency, JVM' },
      { name: 'OOP Concepts & Design Patterns', category: 'Required Skill', weight: 20, description: 'SOLID principles, clean architecture' },
      { name: 'SQL & Relational Databases', category: 'Required Skill', weight: 15, description: 'Complex queries, ORM, transactions' },
      { name: 'Spring Boot & Microservices', category: 'Technical Skill', weight: 15, description: 'REST APIs, Spring Boot, Docker' },
      { name: 'Problem Solving', category: 'Soft Skill', weight: 10, description: 'Troubleshooting, logical reasoning' },
      { name: 'Education (Degree in CS/IT)', category: 'Education', weight: 5, description: 'Degree in Engineering or CS' }
    ]
  }
];

export default function RoleModal({ isOpen, onClose, onSave, editingRole }) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [location, setLocation] = useState('Coimbatore, India');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level (2-5 years)');
  const [minExperienceYears, setMinExperienceYears] = useState(2);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [criteria, setCriteria] = useState([
    { id: 'c1', name: 'Primary Programming Language', category: 'Required Skill', weight: 40, description: 'Core syntax and frameworks' },
    { id: 'c2', name: 'Databases & SQL', category: 'Required Skill', weight: 30, description: 'Data modeling and queries' },
    { id: 'c3', name: 'Problem Solving & Architecture', category: 'Technical Skill', weight: 20, description: 'Clean code & algorithms' },
    { id: 'c4', name: 'Educational Background', category: 'Education', weight: 10, description: 'Relevant Bachelor or Master degree' }
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingRole) {
      setTitle(editingRole.title || '');
      setDepartment(editingRole.department || 'Software Engineering');
      setLocation(editingRole.location || 'Coimbatore, India');
      setExperienceLevel(editingRole.experienceLevel || 'Mid-Level');
      setMinExperienceYears(editingRole.minExperienceYears || 0);
      setDescription(editingRole.description || '');
      setStatus(editingRole.status || 'Active');
      setCriteria(
        (editingRole.criteria || []).map((c, i) => ({
          id: c.id || `c-${i}`,
          name: c.name || '',
          category: c.category || 'Required Skill',
          weight: Number(c.weight || 0),
          description: c.description || ''
        }))
      );
    } else {
      // Default clean template
      setTitle('');
      setDepartment('Software Engineering');
      setLocation('Coimbatore, India');
      setExperienceLevel('Mid-Level (2-5 years)');
      setMinExperienceYears(2);
      setDescription('');
      setStatus('Active');
      setCriteria([
        { id: 'c1', name: 'Python Programming', category: 'Required Skill', weight: 30, description: 'Core Python, async, FastAPI/Django' },
        { id: 'c2', name: 'SQL & Database Design', category: 'Required Skill', weight: 20, description: 'PostgreSQL, query optimization' },
        { id: 'c3', name: 'Machine Learning / AI', category: 'Preferred Skill', weight: 20, description: 'PyTorch, Scikit-learn, LLM APIs' },
        { id: 'c4', name: 'Communication & Teamwork', category: 'Soft Skill', weight: 10, description: 'Agile collaboration' },
        { id: 'c5', name: 'Problem Solving & Algorithms', category: 'Technical Skill', weight: 10, description: 'System design' },
        { id: 'c6', name: 'Education (B.Tech/BE/MCA/M.Sc)', category: 'Education', weight: 10, description: 'Degree in Engineering/CS' }
      ]);
    }
    setErrorMsg('');
  }, [editingRole, isOpen]);

  if (!isOpen) return null;

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  const isExact100 = totalWeight === 100;

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: `c-${Date.now()}-${criteria.length}`,
        name: '',
        category: 'Required Skill',
        weight: 10,
        description: ''
      }
    ]);
  };

  const handleRemoveCriterion = (index) => {
    if (criteria.length <= 1) {
      setErrorMsg('At least one recruitment criterion is required.');
      return;
    }
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (index, field, value) => {
    const updated = [...criteria];
    updated[index] = {
      ...updated[index],
      [field]: field === 'weight' ? Number(value) : value
    };
    setCriteria(updated);
  };

  const handleApplyTemplate = (template) => {
    setTitle(template.title);
    setDepartment(template.department);
    setLocation(template.location);
    setExperienceLevel(template.experienceLevel);
    setMinExperienceYears(template.minExperienceYears);
    setDescription(template.description);
    setCriteria(
      template.criteria.map((c, i) => ({
        id: `c-tpl-${i}`,
        name: c.name,
        category: c.category,
        weight: c.weight,
        description: c.description
      }))
    );
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Job role title is required.');
      return;
    }

    for (let i = 0; i < criteria.length; i++) {
      if (!criteria[i].name.trim()) {
        setErrorMsg(`Criterion #${i + 1} must have a name.`);
        return;
      }
      if (criteria[i].weight <= 0) {
        setErrorMsg(`Criterion "${criteria[i].name}" weight must be greater than 0%.`);
        return;
      }
    }

    if (totalWeight !== 100) {
      setErrorMsg(`All criteria weightages must add up to exactly 100%. Currently it is ${totalWeight}%. Please adjust by ${100 - totalWeight > 0 ? `+${100 - totalWeight}%` : `${100 - totalWeight}%`}.`);
      return;
    }

    onSave({
      title: title.trim(),
      department,
      location,
      experienceLevel,
      minExperienceYears: Number(minExperienceYears),
      description,
      status,
      criteria
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {editingRole ? `Edit Job Role: ${editingRole.title}` : 'Create New Job Role'}
              </h2>
              {editingRole && (
                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
                  v{editingRole.version || 1}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure independent recruitment criteria and percentage weightages for AI evaluation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Preset Templates */}
          {!editingRole && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Role Templates:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-sky-500/40 transition-all"
                  >
                    + Load {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python Developer, Java Developer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Software Engineering, AI Labs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Minimum Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={minExperienceYears}
                onChange={(e) => setMinExperienceYears(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white outline-none"
              >
                <option value="Active">Active (Accepting Resumes)</option>
                <option value="Paused">Paused</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Role Summary / Responsibilities
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context regarding this role for recruitment..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Criteria & Weightage Section */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Recruitment Criteria & Weightages</span>
                  <span className="text-xs font-normal text-slate-400">
                    (Each role has strictly independent criteria)
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>
            </div>

            {/* Live Weightage Sum Meter */}
            <div className={`p-4 rounded-xl border mb-4 transition-all ${
              isExact100 
                ? 'bg-emerald-950/20 border-emerald-500/30' 
                : 'bg-amber-950/20 border-amber-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isExact100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-200">
                    Total Weightage Sum:
                  </span>
                  <span className={`text-sm font-extrabold ${isExact100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {totalWeight}%
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {isExact100 ? (
                    <span className="text-emerald-400 font-medium">Valid: Exactly 100% (Ready to save)</span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Must equal 100% ({100 - totalWeight > 0 ? `Need +${100 - totalWeight}% more` : `Over by ${totalWeight - 100}%`})
                    </span>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isExact100 ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, totalWeight)}%` }}
                />
              </div>
            </div>

            {/* Criteria Rows */}
            <div className="space-y-3">
              {criteria.map((c, index) => (
                <div
                  key={c.id || index}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 grid grid-cols-12 gap-3 items-center"
                >
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Criterion Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={c.name}
                      onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                      placeholder="e.g. Python Programming, Spring Boot"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-sky-500 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Category
                    </label>
                    <select
                      value={c.category}
                      onChange={(e) => handleCriterionChange(index, 'category', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Weight (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={c.weight}
                        onChange={(e) => handleCriterionChange(index, 'weight', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-sky-400 outline-none pr-6"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div className="col-span-10 md:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={c.description || ''}
                      onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                      placeholder="Guidance for AI"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 outline-none"
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(index)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all"
                      title="Remove criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isExact100}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-sky-900 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingRole ? 'Update Job Role' : 'Create Job Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
