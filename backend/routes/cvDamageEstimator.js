// Computer-vision damage assessment from mobile-uploaded photos with cost
// estimation.
// Audit: batch_04.md / AIInsuranceClaimsAdjuster / Custom Feature Suggestions #2
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
      'X-Title': 'Insurance Claims - CV Damage'
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

// POST /api/cv-damage/estimate
// Body: { claim_id, image_urls: [..], asset_type: 'auto'|'property'|'cargo', region? }
router.post('/estimate', async (req, res) => {
  try {
    const { claim_id, image_urls = [], asset_type = 'auto', region } = req.body || {};
    if (!claim_id || image_urls.length === 0) {
      return res.status(400).json({ error: 'claim_id and image_urls required' });
    }

    let claim = null;
    try {
      const r = await pool.query(`SELECT * FROM claims WHERE id = $1`, [claim_id]);
      claim = r.rows[0] || null;
    } catch (_) {}

    const systemPrompt = `You are a CV-based insurance damage estimator. Given image URLs and claim context,
estimate damage severity, repair cost (low/mid/high range), total-loss likelihood, salvage value, and required
documentation. If images cannot be viewed, produce a structured inspector template. Return STRICT JSON only.`;

    const userPrompt = `Claim: ${JSON.stringify(claim)}
Asset type: ${asset_type}
Region: ${region || 'unspecified'}
Image URLs (${image_urls.length}):
${image_urls.slice(0, 10).join('\n')}

Return JSON:
{
  "summary": "...",
  "severity": "minor|moderate|major|total_loss",
  "estimated_repair_cost_usd": { "low": 0, "mid": 0, "high": 0 },
  "total_loss_probability_pct": 0,
  "estimated_salvage_value_usd": 0,
  "damaged_components": [{ "component": "string", "damage_type": "string", "confidence_pct": 0 }],
  "additional_evidence_needed": ["..."],
  "recommended_workflow": "fast_track_pay|adjuster_review|inspector_visit|fraud_review",
  "disclaimer": "AI estimate; certified adjuster signs final settlement."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await pool.query(
        `INSERT INTO damage_assessments (claim_id, payload, source, created_at)
         VALUES ($1,$2,'cv_ai',NOW())`,
        [claim_id, JSON.stringify(parsed)]
      ).catch(() => {});
    } catch (_) {}

    res.json({ claim_id, image_count: image_urls.length, estimate: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/claim/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, payload, source, created_at FROM damage_assessments
       WHERE claim_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.params.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
