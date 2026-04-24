require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/adjusters', require('./routes/adjusters'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/fraud-alerts', require('./routes/fraudAlerts'));
app.use('/api/damage-assessments', require('./routes/damageAssessments'));
app.use('/api/risk-assessments', require('./routes/riskAssessments'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/audit-log', require('./routes/auditLog'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

module.exports = app;
