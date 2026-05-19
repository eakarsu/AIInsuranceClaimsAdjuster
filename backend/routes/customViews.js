// Custom Views — 2 VIZ + 2 NON-VIZ endpoints
// Domain: insurance claims adjusting
const router = require('express').Router();
const { pool } = require('../db');

// ---- Helper: ensure routing_rules table exists ----
let initPromise = null;
function ensureTable() {
  if (!initPromise) {
    initPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS claims_routing_rules (
        id SERIAL PRIMARY KEY,
        severity VARCHAR(30) NOT NULL,
        adjuster_id INTEGER REFERENCES adjusters(id) ON DELETE SET NULL,
        adjuster_name VARCHAR(255),
        min_amount NUMERIC(12,2) DEFAULT 0,
        max_amount NUMERIC(12,2) DEFAULT 0,
        priority INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `).then(async () => {
      const r = await pool.query('SELECT COUNT(*) FROM claims_routing_rules');
      if (parseInt(r.rows[0].count) === 0) {
        // Seed a few rules using existing adjusters if any
        const adj = await pool.query('SELECT id, name FROM adjusters ORDER BY id LIMIT 4');
        const sevs = ['minor', 'moderate', 'severe', 'catastrophic'];
        for (let i = 0; i < sevs.length; i++) {
          const a = adj.rows[i % Math.max(1, adj.rows.length)] || { id: null, name: 'Unassigned' };
          await pool.query(
            `INSERT INTO claims_routing_rules (severity, adjuster_id, adjuster_name, min_amount, max_amount, priority, active, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [sevs[i], a.id, a.name, i === 0 ? 0 : i * 10000, (i + 1) * 50000, i + 1, true, `Auto-seeded ${sevs[i]} rule`]
          );
        }
      }
    }).catch((e) => { console.error('routing_rules init error:', e.message); });
  }
  return initPromise;
}

// =========================================================
// VIZ #1 — GET /api/custom-views/claim-status-pipeline
// Returns claim counts grouped by status (pipeline chart)
// =========================================================
router.get('/claim-status-pipeline', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(status), ''), 'unknown') AS status,
        COUNT(*)::int AS count,
        COALESCE(SUM(estimated_amount), 0)::float AS total_estimated,
        COALESCE(AVG(estimated_amount), 0)::float AS avg_estimated
      FROM claims
      GROUP BY status
      ORDER BY count DESC
    `);
    // Canonical pipeline ordering for UX
    const order = ['open', 'under_review', 'approved', 'denied', 'settled'];
    const map = new Map(result.rows.map(r => [r.status, r]));
    const pipeline = [
      ...order.filter(s => map.has(s)).map(s => map.get(s)),
      ...result.rows.filter(r => !order.includes(r.status))
    ];
    const total = pipeline.reduce((a, b) => a + b.count, 0);
    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      total_claims: total,
      pipeline,
    });
  } catch (err) {
    console.error('claim-status-pipeline error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// =========================================================
// VIZ #2 — GET /api/custom-views/fraud-risk-heatmap
// Matrix: claim type x risk indicator bucket (low/med/high/critical)
// =========================================================
router.get('/fraud-risk-heatmap', async (req, res) => {
  try {
    // Join claims to fraud_alerts and bucket by risk_score
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(cl.type), ''), 'Unknown') AS claim_type,
        CASE
          WHEN fa.risk_score IS NULL THEN 'unscored'
          WHEN fa.risk_score < 30 THEN 'low'
          WHEN fa.risk_score < 60 THEN 'medium'
          WHEN fa.risk_score < 85 THEN 'high'
          ELSE 'critical'
        END AS risk_bucket,
        COUNT(*)::int AS count,
        COALESCE(AVG(fa.risk_score), 0)::float AS avg_risk_score
      FROM claims cl
      LEFT JOIN fraud_alerts fa ON fa.claim_id = cl.id
      GROUP BY claim_type, risk_bucket
      ORDER BY claim_type, risk_bucket
    `);

    const buckets = ['low', 'medium', 'high', 'critical', 'unscored'];
    const typeMap = new Map();
    for (const row of result.rows) {
      if (!typeMap.has(row.claim_type)) {
        typeMap.set(row.claim_type, { claim_type: row.claim_type, cells: {} });
      }
      typeMap.get(row.claim_type).cells[row.risk_bucket] = {
        count: row.count,
        avg_risk_score: Number(row.avg_risk_score.toFixed(2)),
      };
    }
    const matrix = Array.from(typeMap.values()).map(row => ({
      ...row,
      cells: Object.fromEntries(buckets.map(b => [b, row.cells[b] || { count: 0, avg_risk_score: 0 }]))
    }));
    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      buckets,
      matrix,
    });
  } catch (err) {
    console.error('fraud-risk-heatmap error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// =========================================================
// NON-VIZ #1 — POST /api/custom-views/settlement-letter
// Generates a printable settlement letter (PDF-ready HTML)
// =========================================================
router.post('/settlement-letter', async (req, res) => {
  try {
    const { claim_id, settlement_amount, notes, sender_name } = req.body || {};
    if (!claim_id) return res.status(400).json({ error: 'claim_id is required' });

    const q = await pool.query(`
      SELECT cl.*,
        c.first_name, c.last_name, c.address, c.city, c.state, c.zip, c.email,
        p.policy_number,
        a.name AS adjuster_name
      FROM claims cl
      LEFT JOIN customers c ON cl.customer_id = c.id
      LEFT JOIN policies p ON cl.policy_id = p.id
      LEFT JOIN adjusters a ON cl.adjuster_id = a.id
      WHERE cl.id = $1
    `, [claim_id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    const r = q.rows[0];

    const amount = Number(settlement_amount || r.approved_amount || r.estimated_amount || 0);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const customerName = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Policyholder';
    const customerAddr = [r.address, [r.city, r.state, r.zip].filter(Boolean).join(', ')].filter(Boolean).join('\n');
    const policyNo = r.policy_number || 'N/A';
    const adjusterName = sender_name || r.adjuster_name || 'Claims Department';

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Settlement Letter — ${r.claim_number}</title>
<style>
@page { size: Letter; margin: 1in; }
body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a2e; max-width: 720px; margin: 0 auto; padding: 32px; line-height: 1.6; }
.letterhead { border-bottom: 3px solid #0f3460; padding-bottom: 16px; margin-bottom: 24px; }
.letterhead h1 { margin: 0; font-size: 22px; color: #0f3460; }
.letterhead .sub { color: #7f8c8d; font-size: 13px; margin-top: 4px; }
.meta { display: flex; justify-content: space-between; font-size: 13px; color: #555; margin-bottom: 24px; }
.recipient { white-space: pre-line; margin-bottom: 24px; font-size: 14px; }
.body p { margin: 12px 0; font-size: 14px; }
.amount-box { background: #f1f5f9; border-left: 4px solid #27ae60; padding: 12px 16px; margin: 18px 0; font-size: 16px; font-weight: 700; }
.signature { margin-top: 48px; font-size: 14px; }
.footer { margin-top: 32px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 11px; color: #888; text-align: center; }
.print-btn { background: #0f3460; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
@media print { .print-btn { display: none; } }
</style></head><body>
<div class="letterhead">
  <h1>AI Insurance Claims Adjuster</h1>
  <div class="sub">Settlement Notification — Official Correspondence</div>
</div>
<div class="meta">
  <div><strong>Claim #:</strong> ${escapeHtml(r.claim_number)}<br/><strong>Policy #:</strong> ${escapeHtml(policyNo)}</div>
  <div style="text-align:right;"><strong>Date:</strong> ${today}</div>
</div>
<div class="recipient">${escapeHtml(customerName)}\n${escapeHtml(customerAddr)}</div>
<div class="body">
  <p>Dear ${escapeHtml(customerName)},</p>
  <p>We are writing to inform you that your claim <strong>${escapeHtml(r.claim_number)}</strong> regarding the
  ${escapeHtml(r.type || 'incident')} reported on ${r.incident_date ? new Date(r.incident_date).toLocaleDateString('en-US') : 'the date on file'}
  has been reviewed and a settlement has been determined.</p>
  <div class="amount-box">Approved Settlement Amount: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
  <p>The settlement amount listed above reflects our evaluation of the damages, the terms of your policy, and any
  applicable deductibles. Payment will be issued within 10 business days of acceptance.</p>
  ${notes ? `<p><strong>Adjuster Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
  <p>If you have any questions about this settlement, please contact your adjuster directly.</p>
</div>
<div class="signature">
  Sincerely,<br/><br/>
  <strong>${escapeHtml(adjusterName)}</strong><br/>
  Claims Adjuster, AI Insurance Claims Adjuster
</div>
<div class="footer">This letter was generated on ${today}. Reference: SETTLE-${r.claim_number}-${Date.now()}</div>
<div style="text-align:center; margin-top:24px;"><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

    res.json({
      ok: true,
      claim_id: r.id,
      claim_number: r.claim_number,
      settlement_amount: amount,
      generated_at: new Date().toISOString(),
      html,
      summary: {
        recipient: customerName,
        policy_number: policyNo,
        adjuster: adjusterName,
      }
    });
  } catch (err) {
    console.error('settlement-letter error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// =========================================================
// NON-VIZ #2 — CRUD on /api/custom-views/routing-rules
// Severity → Adjuster rule editor
// =========================================================
router.get('/routing-rules', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query(`
      SELECT rr.*, a.specialization, a.email AS adjuster_email
      FROM claims_routing_rules rr
      LEFT JOIN adjusters a ON rr.adjuster_id = a.id
      ORDER BY rr.priority ASC, rr.id ASC
    `);
    res.json({ ok: true, data: r.rows });
  } catch (err) {
    console.error('routing-rules GET error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.post('/routing-rules', async (req, res) => {
  try {
    await ensureTable();
    const { severity, adjuster_id, adjuster_name, min_amount, max_amount, priority, active, notes } = req.body || {};
    const validSev = ['minor', 'moderate', 'severe', 'catastrophic'];
    if (!validSev.includes((severity || '').toLowerCase())) {
      return res.status(400).json({ error: `severity must be one of: ${validSev.join(', ')}` });
    }
    let resolvedName = adjuster_name;
    if (adjuster_id && !resolvedName) {
      const a = await pool.query('SELECT name FROM adjusters WHERE id=$1', [adjuster_id]);
      resolvedName = a.rows[0]?.name || null;
    }
    const r = await pool.query(
      `INSERT INTO claims_routing_rules (severity, adjuster_id, adjuster_name, min_amount, max_amount, priority, active, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [severity.toLowerCase(), adjuster_id || null, resolvedName || null,
        Number(min_amount) || 0, Number(max_amount) || 0,
        Number(priority) || 1, active !== false, notes || null]
    );
    res.status(201).json({ ok: true, data: r.rows[0] });
  } catch (err) {
    console.error('routing-rules POST error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.put('/routing-rules/:id', async (req, res) => {
  try {
    await ensureTable();
    const { severity, adjuster_id, adjuster_name, min_amount, max_amount, priority, active, notes } = req.body || {};
    const r = await pool.query(
      `UPDATE claims_routing_rules
       SET severity=COALESCE($1, severity),
           adjuster_id=COALESCE($2, adjuster_id),
           adjuster_name=COALESCE($3, adjuster_name),
           min_amount=COALESCE($4, min_amount),
           max_amount=COALESCE($5, max_amount),
           priority=COALESCE($6, priority),
           active=COALESCE($7, active),
           notes=COALESCE($8, notes),
           updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [severity || null, adjuster_id || null, adjuster_name || null,
        min_amount !== undefined ? Number(min_amount) : null,
        max_amount !== undefined ? Number(max_amount) : null,
        priority !== undefined ? Number(priority) : null,
        active !== undefined ? !!active : null,
        notes || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ ok: true, data: r.rows[0] });
  } catch (err) {
    console.error('routing-rules PUT error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.delete('/routing-rules/:id', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query('DELETE FROM claims_routing_rules WHERE id=$1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ ok: true, message: 'Rule deleted' });
  } catch (err) {
    console.error('routing-rules DELETE error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
