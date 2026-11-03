// src/pages/ImportResumes.jsx
import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  Upload,
  FileText,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Paperclip,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ImportResumes({ onNavigate, onResumesImported }) {
  const [activeTab, setActiveTab] = useState('gmail'); // 'gmail' | 'manual'
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState({}); // { messageId: [attId] }
  const [importing, setImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Manual Upload State
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedRecords, setUploadedRecords] = useState([]);

  useEffect(() => {
    fetchGmailEmails();
  }, []);

  const fetchGmailEmails = async () => {
    setLoadingEmails(true);
    setErrorMsg('');
    try {
      const res = await api.getGmailEmails();
      setEmails(res.emails || []);
    } catch (err) {
      setErrorMsg('Failed to load Gmail messages: ' + err.message);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    setErrorMsg('');
    try {
      const res = await api.syncGmail();
      await fetchGmailEmails();
      setImportSuccessMsg(res.message || 'Gmail synced successfully.');
      setTimeout(() => setImportSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Sync failed: ' + err.message);
    } finally {
      setSyncingGmail(false);
    }
  };

  const toggleAttachment = (msgId, attId) => {
    setSelectedAttachments(prev => {
      const currentList = prev[msgId] || [];
      const exists = currentList.includes(attId);
      const updatedList = exists
        ? currentList.filter(id => id !== attId)
        : [...currentList, attId];

      const next = { ...prev };
      if (updatedList.length === 0) {
        delete next[msgId];
      } else {
        next[msgId] = updatedList;
      }
      return next;
    });
  };

  const selectAllAttachments = () => {
    const all = {};
    emails.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        all[msg.messageId] = msg.attachments.map(a => a.attachmentId);
      }
    });
    setSelectedAttachments(all);
  };

  const clearSelection = () => {
    setSelectedAttachments({});
  };

  const totalSelectedCount = Object.values(selectedAttachments).reduce((sum, list) => sum + list.length, 0);

  const handleImportSelectedFromGmail = async () => {
    if (totalSelectedCount === 0) return;
    setImporting(true);
    setErrorMsg('');
    const importedList = [];

    try {
      for (const [msgId, attIds] of Object.entries(selectedAttachments)) {
        for (const attId of attIds) {
          const res = await api.importGmailAttachment(msgId, attId);
          if (res.resume) {
            importedList.push(res.resume);
          }
        }
      }

      setImportSuccessMsg(`Successfully imported ${importedList.length} resume(s) from Gmail ready for AI evaluation!`);
      clearSelection();
      if (onResumesImported) onResumesImported(importedList);
    } catch (err) {
      setErrorMsg('Error importing attachments: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Manual Upload Handlers
  const handleFileChange = (e) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ['pdf', 'docx', 'doc'].includes(ext);
      });
      setUploadFiles(validFiles);
    }
  };

  const handleManualUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('resumes', file);
      });

      const res = await api.uploadResumes(formData);
      setUploadedRecords(res.resumes || []);
      setUploadFiles([]);
      setImportSuccessMsg(`Successfully uploaded ${res.resumes?.length || 0} resume(s)!`);
      if (onResumesImported) onResumesImported(res.resumes || []);
    } catch (err) {
      setErrorMsg('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-sky-400" />
            <span>Import Candidate Resumes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Collect resumes directly from the authorized HR Gmail inbox (<span className="text-sky-300 font-mono">hr.cbe@datapage.org</span>) or upload multiple files.
          </p>
        </div>

        {/* Action button to proceed to analysis */}
        <button
          onClick={() => onNavigate('analyse')}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Proceed to AI Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Success / Error Messages */}
      {importSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
          <button
            onClick={() => onNavigate('analyse')}
            className="underline font-semibold hover:text-white"
          >
            Run AI Matching Now →
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'gmail'
              ? 'border-sky-500 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>HR Gmail Inbox Integration</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {emails.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'manual'
              ? 'border-sky-500 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Manual Resume Upload (PDF / DOCX)</span>
        </button>
      </div>

      {/* TAB 1: Gmail Integration */}
      {activeTab === 'gmail' && (
        <div className="space-y-4">
          {/* Top Gmail status bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    DataPage HR Gmail: hr.cbe@datapage.org
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold uppercase">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Filters specifically for candidate emails with PDF/DOCX attachments. Non-resume attachments (logos, images) are automatically ignored.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncGmail}
                disabled={syncingGmail}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${syncingGmail ? 'animate-spin' : ''}`} />
                <span>{syncingGmail ? 'Syncing...' : 'Sync Inbox'}</span>
              </button>
            </div>
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllAttachments}
                className="text-sky-400 hover:underline font-medium"
              >
                Select All Resumes
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={clearSelection}
                className="text-slate-400 hover:underline"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono">
                Selected: <strong className="text-sky-400 font-bold">{totalSelectedCount}</strong> attachment(s)
              </span>
              <button
                onClick={handleImportSelectedFromGmail}
                disabled={totalSelectedCount === 0 || importing}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>{importing ? 'Importing...' : `Import ${totalSelectedCount} Selected`}</span>
              </button>
            </div>
          </div>

          {/* Email List */}
          {loadingEmails ? (
            <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
              <span>Fetching emails from hr.cbe@datapage.org...</span>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No candidate resumes found in Gmail.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Sync Inbox" to check for new incoming applications with PDF/DOCX resumes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((msg) => {
                const msgSelections = selectedAttachments[msg.messageId] || [];
                return (
                  <div
                    key={msg.messageId}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {msg.senderName}
                          </h4>
                          <span className="text-xs text-sky-400 font-mono">
                            &lt;{msg.senderEmail}&gt;
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          Subject: {msg.subject}
                        </p>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono shrink-0">
                        {new Date(msg.receivedDate).toLocaleDateString()} {new Date(msg.receivedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.snippet && (
                      <p className="text-xs text-slate-400 mb-3 line-clamp-1 italic">
                        "{msg.snippet}"
                      </p>
                    )}

                    {/* Extracted Resume Attachments */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" /> Valid Resume Attachment(s):
                      </span>

                      {(msg.attachments || []).map((att) => {
                        const isChecked = msgSelections.includes(att.attachmentId);
                        return (
                          <button
                            key={att.attachmentId}
                            onClick={() => toggleAttachment(msg.messageId, att.attachmentId)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              isChecked
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            <span className="font-mono">{att.filename}</span>
                            <span className="text-[10px] text-slate-500">({att.size})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Manual Upload */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <form onSubmit={handleManualUploadSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-2xl p-10 text-center bg-slate-900/50 transition-all">
              <Upload className="w-12 h-12 text-sky-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                Upload Candidate Resumes Manually
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Drag and drop PDF or DOCX files here, or browse from your computer. Supports uploading multiple resumes at once.
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 cursor-pointer transition-all">
                <FileText className="w-4 h-4" />
                <span>Select Resume Files</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="mt-3 text-[11px] text-slate-500">
                Supported formats: <span className="text-slate-300 font-mono font-medium">.PDF, .DOCX, .DOC</span> (Max 15MB each)
              </div>
            </div>

            {/* Selected files preview */}
            {uploadFiles.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Queued Files ({uploadFiles.length}):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadFiles([])}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-white font-mono truncate">{file.name}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-900/40 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} Resume(s)`}</span>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Uploaded records history */}
          {uploadedRecords.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Recently Uploaded & Ready for Analysis
              </h4>
              <div className="space-y-2">
                {uploadedRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono text-white">{r.originalFilename}</span>
                      <span className="text-slate-500">({r.fileSize})</span>
                    </div>
                    <button
                      onClick={() => onNavigate('analyse')}
                      className="px-2.5 py-1 rounded bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 font-semibold text-[11px]"
                    >
                      Analyse →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
