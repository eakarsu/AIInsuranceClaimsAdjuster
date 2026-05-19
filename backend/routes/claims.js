const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM claims');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT cl.*,
        c.first_name || ' ' || c.last_name AS customer_name,
        p.policy_number,
        a.name AS adjuster_name
      FROM claims cl
      LEFT JOIN customers c ON cl.customer_id = c.id
      LEFT JOIN policies p ON cl.policy_id = p.id
      LEFT JOIN adjusters a ON cl.adjuster_id = a.id
      ORDER BY cl.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Error fetching claims:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching claim:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_number, policy_id, customer_id, adjuster_id, type, description, incident_date, filed_date, status, estimated_amount, approved_amount, location, priority } = req.body;
    if (!customer_id || !policy_id) {
      return res.status(400).json({ error: 'customer_id and policy_id are required' });
    }
    const result = await pool.query(
      'INSERT INTO claims (claim_number, policy_id, customer_id, adjuster_id, type, description, incident_date, filed_date, status, estimated_amount, approved_amount, location, priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [claim_number, policy_id, customer_id, adjuster_id, type, description, incident_date, filed_date, status || 'open', estimated_amount, approved_amount, location, priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating claim:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_number, policy_id, customer_id, adjuster_id, type, description, incident_date, filed_date, status, estimated_amount, approved_amount, location, priority } = req.body;
    const result = await pool.query(
      'UPDATE claims SET claim_number=$1, policy_id=$2, customer_id=$3, adjuster_id=$4, type=$5, description=$6, incident_date=$7, filed_date=$8, status=$9, estimated_amount=$10, approved_amount=$11, location=$12, priority=$13 WHERE id=$14 RETURNING *',
      [claim_number, policy_id, customer_id, adjuster_id, type, description, incident_date, filed_date, status, estimated_amount, approved_amount, location, priority, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating claim:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM claims WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Claim not found' });
    res.json({ message: 'Claim deleted' });
  } catch (err) {
    console.error('Error deleting claim:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/claims/:id/workflow-action
router.post('/:id/workflow-action', async (req, res) => {
  const { action } = req.body;
  const validActions = ['triage', 'investigate', 'assess', 'settle', 'close'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
  }

  try {
    const claimResult = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id]);
    if (claimResult.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    const claim = claimResult.rows[0];

    const statusMap = {
      triage: 'under_review',
      investigate: 'under_review',
      assess: 'under_review',
      settle: 'approved',
      close: 'settled',
    };
    const newStatus = statusMap[action];
    await pool.query('UPDATE claims SET status=$1 WHERE id=$2', [newStatus, req.params.id]);

    let aiResult = null;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

    async function aiCall(systemPrompt, userPrompt) {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.3 }),
      });
      const d = await r.json();
      const text = d.choices?.[0]?.message?.content || '';
      try { return JSON.parse(text); } catch (e) {
        const m = text.match(/\{[\s\S]*\}/);
        return m ? JSON.parse(m[0]) : { analysis: text };
      }
    }

    if (action === 'triage') {
      aiResult = await aiCall(
        'You are an insurance fraud detection AI. Return JSON: { risk_score: number, risk_level: "low|medium|high|critical", indicators: [], recommendation: "approve|investigate|deny", detailed_analysis: string }',
        `Triage claim: Type=${claim.type}, Amount=$${claim.estimated_amount}, Description=${claim.description}`
      );
      if (aiResult.risk_score) {
        await pool.query('INSERT INTO fraud_alerts (claim_id, risk_score, indicators, ai_analysis, status) VALUES ($1,$2,$3,$4,$5)',
          [claim.id, aiResult.risk_score, JSON.stringify(aiResult.indicators || []), JSON.stringify(aiResult), 'pending']);
      }
    } else if (action === 'assess') {
      aiResult = await aiCall(
        'You are an insurance damage assessment AI. Return JSON: { estimated_cost: number, severity: "minor|moderate|severe|catastrophic", repair_timeline: string, damage_breakdown: [], recommendations: [], detailed_analysis: string }',
        `Assess damage for claim: Type=${claim.type}, Location=${claim.location}, Description=${claim.description}`
      );
      if (aiResult.estimated_cost) {
        await pool.query('INSERT INTO damage_assessments (claim_id, damage_type, severity, estimated_cost, ai_analysis, repair_timeline) VALUES ($1,$2,$3,$4,$5,$6)',
          [claim.id, claim.type, aiResult.severity || 'moderate', aiResult.estimated_cost || 0, JSON.stringify(aiResult), aiResult.repair_timeline || 'TBD']);
      }
    } else if (action === 'settle') {
      aiResult = await aiCall(
        'You are an insurance settlement recommendation AI. Return JSON: { recommended_amount: number, confidence_level: number, justification: string, negotiation_range: { min: number, max: number }, detailed_analysis: string }',
        `Recommend settlement: Amount=$${claim.estimated_amount}, Type=${claim.type}, Description=${claim.description}`
      );
    }

    res.json({ new_status: newStatus, action, ai_result: aiResult });
  } catch (err) {
    console.error('Workflow action error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
