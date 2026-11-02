# dp-hire
AI Evaluation on Resume
Conversation Log
Add delete option for the resume which is evaluated

The delete option for evaluated candidate resumes has been added across the application:

What was added:

Candidate Results Table:

A Delete button (trash icon 🗑️) has been added in the Actions column for every evaluated candidate row.
Clicking it displays a confirmation prompt: "Are you sure you want to delete the evaluation for [Candidate Name]? This action cannot be undone."
On confirmation, the record is removed from the database and UI in real time.

Candidate Scorecard / Detail Modal:

A "Delete Evaluation" button is now available in the modal's bottom footer next to the "Download Resume" option.
Clicking it deletes the evaluation and automatically closes the scorecard modal.

Dashboard Recent Candidates Table:

A quick-delete icon has been added alongside the "Scorecard" button for rapid triage.

Shortlisted Candidates Page:

A delete option is now available on candidate cards in the shortlisted pool.

Backend API (DELETE /api/candidates/:id):

Implemented on both the standalone server (server/standaloneServer.js) and Express route (server/routes/candidateRoutes.js).
Validates authorization, removes the candidate evaluation record from persistent storage (data/db.json), and updates counts dynamically.
How to use:
Refresh or reopen your browser at http://localhost:5000
.
Go to Candidate Results (or open any candidate's Scorecard).
Click the red-hovering Delete (🗑️) button and confirm to remove the evaluation.
The file should delete if the delete option is choosen and remove the view text option from the candidate reults

The requested features have been implemented and verified:

1. Resume File Deletion on Candidate Delete
Physical File Removal: When HR deletes an evaluated candidate (via the Candidate Results table or Scorecard modal), the server permanently unlinks and deletes the physical resume file (fs.unlinkSync) from data/uploads/.
Database & Metadata Cleanup: The candidate evaluation record is removed from db.candidates, and the corresponding resume metadata entry is purged from db.resumes.
Backend Safety: Both server/standaloneServer.js and server/services/storageService.js handle file deletion safely with path verification and error handling.
Confirmation Prompt: HR receives a confirmation dialog ("Are you sure you want to permanently delete this candidate evaluation and its resume file? This action cannot be undone.").
2. Removed "View Text" Option from Candidate Results
Results Table Actions: Removed the "View text" button (FileText icon) from the candidate table in CandidateResults.jsx and public/app.js.
Candidate Detail / Scorecard: Removed the "View Extracted Text" action button from CandidateDetailModal.jsx and cleaned up unused modal viewer handlers.
3. Verification
Authenticated integration tests confirmed:
Candidate evaluation removed from database.
Physical file permanently deleted from disk.
Resume metadata removed from metadata store.
Non-authorized requests remain blocked with 403 Access Denied.
How to share?

Depending on what you want to share, here are the different ways:

1. Share the Live Application with Others
Option A: Instant Public Link (Quickest — No Setup Required)

You can create a temporary, secure public link to share with anyone immediately:

Start the DP Hire server:
powershell
node server/standaloneServer.js
In a second terminal window, run:
powershell
npx localtunnel --port 5000
(Or using ngrok: ngrok http 5000)
It will give you a public URL (e.g., https://funny-tiger-12.loca.lt). Anyone can open this link in their browser.

Security Note: Only hr.cbe@datapage.org will be granted access to the application; any other user will see "Access Denied – You are not an authorized user".

Option B: Share on the Same Office Wi-Fi / Local Network

If your team members are connected to the same office Wi-Fi network:

Find your computer's local IP address:
powershell
ipconfig
(Look for IPv4 Address, e.g., 192.168.1.45)
Start the server:
powershell
node server/standaloneServer.js
Share this address with your team:
text
http://<YOUR_IP>:5000   (e.g., http://192.168.1.45:5000)
Option C: Permanent Free Cloud Hosting (Render / Railway)

To keep DP Hire online 24/7 with a permanent URL:

Push your project to GitHub (see section 3 below).
Go to render.com
 or railway.app
.
Create a New Web Service and select your repository.
Set the start command to:
bash
node server/standaloneServer.js
Add your environment variable:
GEMINI_API_KEY: (your Gemini key)
You will receive a permanent HTTPS link (e.g., https://dp-hire.onrender.com).
2. Share Shortlisted Candidate Reports (CSV)

To share candidate evaluations with department managers:

Navigate to the Shortlisted Candidates tab in DP Hire.
Filter by the relevant Job Role (or leave as All).
Click the green "Export Shortlist (CSV)" button at the top right.
An organized spreadsheet containing candidate names, emails, phones, match percentages, and matched skills will download, ready to attach to an email.
3. Share the Code Repository (GitHub)

To share the project source code with other developers:

powershell
# 1. Create a new repository on GitHub (e.g. dp-hire)
# 2. Link your local project to GitHub:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/dp-hire.git
git branch -M main
git push -u origin main

(Ensure your .env file containing API keys is ignored by .gitignore before pushing).

Review
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
package.json
/c:/Users/dhiya_qjpbwbe/OneDrive/Documents/dp hire
package.json
/c:/Users/dhiya_qjpbwbe/OneDrive/Documents/dp hire/server
package.json
/c:/Users/dhiya_qjpbwbe/OneDrive/Documents/dp hire/client
package.json
package.json
server
package.json
client
vite.config.js
tailwind.config.js
postcss.config.js
index.html
defaultRoles.js
server/config
storageService.js
server/services
resumeParser.js
server/services
geminiService.js
server/services
gmailService.js
server/services
auth.js
server/middleware
authRoutes.js
server/routes
jobRoleRoutes.js
server/routes
candidateRoutes.js
server/routes
gmailRoutes.js
server/routes
settingsRoutes.js
server/routes
server.js
server
.env.example
.env
index.css
src
api.js
src/services
AuthContext.jsx
src/context
Sidebar.jsx
src/components
Header.jsx
src/components
StatCard.jsx
src/components
RoleModal.jsx
src/components
CandidateDetailModal.jsx
src/components
ResumeViewerModal.jsx
src/components
Login.jsx
src/pages
Dashboard.jsx
src/pages
JobRoles.jsx
src/pages
ImportResumes.jsx
src/pages
AnalyseResumes.jsx
src/pages
CandidateResults.jsx
src/pages
Shortlisted.jsx
src/pages
Settings.jsx
src/pages
App.jsx
src
main.jsx
src
db.json
data
sample-karthik.pdf
data/uploads
sample-priya.docx
data/uploads
sample-aravind.pdf
data/uploads
sample-deepa.pdf
data/uploads
standaloneServer.js
server
index.html
public
app.js
public
README.md
