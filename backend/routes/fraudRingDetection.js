// Fraud-ring detection correlating claims across customers, adjusters, and
// providers.
// Audit: batch_04.md / AIInsuranceClaimsAdjuster / Custom Feature Suggestions #3
const express = require('express');
const fetch = require('node-fetch');
const authMiddleware = require('../middleware/auth');
const { pool } = require('../db');

const router = express.Router();
router.use(authMiddleware);

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Insurance Claims - Fraud Ring'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, max_tokens: 3000
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/fraud-ring/scan { lookback_days?, region?, claim_type? }
router.post('/scan', async (req, res) => {
  try {
    const { lookback_days = 90, region, claim_type } = req.body || {};

    let claims = { rows: [] };
    try {
      claims = await pool.query(
        `SELECT id, customer_id, adjuster_id, provider_id, claim_type, location, amount, created_at
         FROM claims WHERE created_at > NOW() - ($1 || ' days')::interval
           ${claim_type ? 'AND claim_type = $2' : ''}
         ORDER BY created_at DESC LIMIT 300`,
        claim_type ? [String(lookback_days), claim_type] : [String(lookback_days)]
      );
    } catch (_) {}

    // Build simple feature aggregations
    const byProvider = {};
    for (const c of claims.rows) {
      if (!c.provider_id) continue;
      byProvider[c.provider_id] = byProvider[c.provider_id] || { claims: 0, customers: new Set(), adjusters: new Set() };
      byProvider[c.provider_id].claims++;
      if (c.customer_id) byProvider[c.provider_id].customers.add(c.customer_id);
      if (c.adjuster_id) byProvider[c.provider_id].adjusters.add(c.adjuster_id);
    }
    const providerAgg = Object.entries(byProvider).map(([id, v]) => ({
      provider_id: id, claims: v.claims, unique_customers: v.customers.size, unique_adjusters: v.adjusters.size
    }));

    const systemPrompt = `You are an SIU (Special Investigations Unit) AI for insurance. Detect potential fraud
rings by correlating claims, providers, customers, and adjusters. Surface clusters with shared addresses,
phones, providers, or staged incidents. Return STRICT JSON only.`;

    const userPrompt = `Lookback days: ${lookback_days}
Region filter: ${region || 'all'}
Claim type filter: ${claim_type || 'all'}
Provider aggregation: ${JSON.stringify(providerAgg.slice(0, 30))}
Claim sample: ${JSON.stringify(claims.rows.slice(0, 40))}

Return JSON:
{
  "summary": "...",
  "suspicious_clusters": [
    { "cluster_id": "string", "node_types": ["customer","provider","adjuster"], "claim_ids": ["..."], "ring_indicators": ["..."], "estimated_loss_usd": 0, "confidence_pct": 0 }
  ],
  "next_investigation_steps": ["..."],
  "watchlist_entities": [{ "type": "string", "id": "string", "reason": "string" }],
  "disclaimer": "AI-assisted detection; SIU human review required before action."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ lookback_days, scan: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-alerts', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, severity, message, created_at FROM fraud_alerts ORDER BY created_at DESC LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
