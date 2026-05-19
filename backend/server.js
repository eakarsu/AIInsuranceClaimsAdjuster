require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { initDB, pool } = require('./db');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_subrogation_recovery_optimizer = require('./routes/gap-no-subrogation-recovery-optimizer');
const route_gap_no_reserve_estimation_ai = require('./routes/gap-no-reserve-estimation-ai');
const route_gap_no_litigation_outcome_predictor = require('./routes/gap-no-litigation-outcome-predictor');
const route_gap_no_image_based_vehicle_damage_estimator = require('./routes/gap-no-image-based-vehicle-damage-estimator');
const route_gap_no_webhook_surface_for_fnol_ingestion = require('./routes/gap-no-webhook-surface-for-fnol-ingestion');
const route_gap_no_mobile_push_notifications_for_field = require('./routes/gap-no-mobile-push-notifications-for-field');
const route_gap_no_e_signature_for_settlements = require('./routes/gap-no-e-signature-for-settlements');
const route_gap_no_notifications_module_0_references = require('./routes/gap-no-notifications-module-0-references');
const route_gap_no_websocket_real_time_claim_feed = require('./routes/gap-no-websocket-real-time-claim-feed');
const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(require('helmet')());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// AI rate limiter: 20 requests per hour per user/IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    if (req.user?.id) return String(req.user.id);
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return ipKeyGenerator(ip);
  },
  validate: { xForwardedForHeader: false },
  handler: (req, res) => res.status(429).json({ error: 'AI rate limit exceeded. Maximum 20 requests per hour.' }),
});

// Audit middleware — logs all successful mutations
async function auditMiddleware(req, res, next) {
  res.on('finish', async () => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
      try {
        await pool.query(
          'INSERT INTO audit_log (user_id, action, table_name, record_id, timestamp) VALUES ($1,$2,$3,$4,NOW())',
          [req.user?.id, req.method, req.path.split('/')[2], req.params?.id || null]
        );
      } catch (e) { /* silent */ }
    }
  });
  next();
}
app.use('/api', auditMiddleware);

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
app.use('/api/ai', aiRateLimiter, require('./routes/ai'));
app.use('/api/reports', require('./routes/reports'));
// Apply pass 5 — additive
app.use('/api/customer-portal', require('./routes/customerPortal'));
app.use('/api/adjuster-field', require('./routes/adjusterField'));
app.use('/api/reinsurance', require('./routes/reinsurance'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/cv-damage', require('./routes/cvDamageEstimator'));
app.use('/api/fraud-ring', require('./routes/fraudRingDetection'));

// Custom Views — 2 VIZ + 2 NON-VIZ — mounted BEFORE the 404 catch-all
app.use('/api/custom-views', require('./routes/customViews'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initDB()
  .then(() => {
    
app.use('/api/gap-no-subrogation-recovery-optimizer', route_gap_no_subrogation_recovery_optimizer);
app.use('/api/gap-no-reserve-estimation-ai', route_gap_no_reserve_estimation_ai);
app.use('/api/gap-no-litigation-outcome-predictor', route_gap_no_litigation_outcome_predictor);
app.use('/api/gap-no-image-based-vehicle-damage-estimator', route_gap_no_image_based_vehicle_damage_estimator);
app.use('/api/gap-no-webhook-surface-for-fnol-ingestion', route_gap_no_webhook_surface_for_fnol_ingestion);
app.use('/api/gap-no-mobile-push-notifications-for-field', route_gap_no_mobile_push_notifications_for_field);
app.use('/api/gap-no-e-signature-for-settlements', route_gap_no_e_signature_for_settlements);
app.use('/api/gap-no-notifications-module-0-references', route_gap_no_notifications_module_0_references);
app.use('/api/gap-no-websocket-real-time-claim-feed', route_gap_no_websocket_real_time_claim_feed);

app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

module.exports = app;
