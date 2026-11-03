// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { readDb, UPLOADS_DIR } = require('./services/storageService');
const authRoutes = require('./routes/authRoutes');
const jobRoleRoutes = require('./routes/jobRoleRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize DB with defaults if needed
readDb();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve uploaded resumes statically (protected in candidate routes)
app.use('/uploads', express.static(UPLOADS_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', jobRoleRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'DP Hire',
    organization: 'DataPage',
    authorizedEmail: 'hr.cbe@datapage.org',
    timestamp: new Date().toISOString()
  });
});

// Production Client Serving
const clientDistPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` DP HIRE – AI Recruitment Platform (DataPage)`);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Authorized HR Account: hr.cbe@datapage.org`);
  console.log(`=======================================================`);
});

module.exports = app;
