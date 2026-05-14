/*
 * routes/reinsurance.js — Apply pass 5
 *
 * Mechanical reinsurance / cession reporting. Aggregates the existing `claims`,
 * `settlements`, `policies` tables into a per-month cession report and a CSV
 * export. No external integration. Additive `reinsurance_treaties` table holds
 * a list of treaties used for the report logic.
 */
const router = require('express').Router();
const { pool } = require('../db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reinsurance_treaties (
        id SERIAL PRIMARY KEY,
        treaty_name TEXT,
        treaty_type TEXT,
        retention_amount NUMERIC,
        cession_pct NUMERIC,
        effective_from DATE,
        effective_to DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) {
    console.error('reinsurance bootstrap error:', e.message);
  }
})();

// GET /api/reinsurance/treaties
router.get('/treaties', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM reinsurance_treaties ORDER BY created_at DESC`);
    res.json({ treaties: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reinsurance/treaties
router.post('/treaties', async (req, res) => {
  try {
    const { treaty_name, treaty_type, retention_amount, cession_pct, effective_from, effective_to, notes } = req.body || {};
    if (!treaty_name) return res.status(400).json({ error: 'treaty_name required' });
    const r = await pool.query(
      `INSERT INTO reinsurance_treaties (treaty_name, treaty_type, retention_amount, cession_pct, effective_from, effective_to, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [treaty_name, treaty_type || 'quota_share', retention_amount || null, cession_pct || null, effective_from || null, effective_to || null, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reinsurance/cession-report?year_month=YYYY-MM&treaty_id=
router.get('/cession-report', async (req, res) => {
  try {
    const ym = String(req.query.year_month || '').match(/^(\d{4})-(\d{2})$/);
    if (!ym) return res.status(400).json({ error: 'year_month=YYYY-MM required' });
    const treatyId = req.query.treaty_id ? Number(req.query.treaty_id) : null;

    let treaty = null;
    if (treatyId) {
      const tr = await pool.query(`SELECT * FROM reinsurance_treaties WHERE id = $1`, [treatyId]);
      if (tr.rows.length === 0) return res.status(404).json({ error: 'Treaty not found' });
      treaty = tr.rows[0];
    }

    // Sum settlements paid in the month from the existing settlements table.
    const r = await pool.query(
      `SELECT s.id, s.claim_id, s.amount, s.created_at, c.claim_type
       FROM settlements s
       LEFT JOIN claims c ON c.id = s.claim_id
       WHERE date_trunc('month', s.created_at) = make_date($1::int, $2::int, 1)::timestamp`,
      [Number(ym[1]), Number(ym[2])]
    ).catch(() => ({ rows: [] }));

    const retention = treaty ? Number(treaty.retention_amount || 0) : 0;
    const cessionPct = treaty ? Number(treaty.cession_pct || 0) / 100 : 0;

    let totalGross = 0;
    let totalCeded = 0;
    const rows = r.rows.map((s) => {
      const amt = Number(s.amount || 0);
      totalGross += amt;
      const ceded = treaty ? Math.max(0, amt - retention) * cessionPct : 0;
      totalCeded += ceded;
      return { settlement_id: s.id, claim_id: s.claim_id, claim_type: s.claim_type, amount: amt, ceded_amount: +ceded.toFixed(2), retained_amount: +(amt - ceded).toFixed(2) };
    });

    res.json({
      year_month: req.query.year_month,
      treaty,
      summary: { total_gross: totalGross, total_ceded: +totalCeded.toFixed(2), total_retained: +(totalGross - totalCeded).toFixed(2), settlement_count: rows.length },
      rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reinsurance/cession-report.csv?year_month=YYYY-MM&treaty_id=
router.get('/cession-report.csv', async (req, res, next) => {
  try {
    req.url = `/cession-report?${new URLSearchParams(req.query).toString()}`;
    // duplicate logic inline for simplicity: re-run report
    const ym = String(req.query.year_month || '').match(/^(\d{4})-(\d{2})$/);
    if (!ym) return res.status(400).json({ error: 'year_month=YYYY-MM required' });
    const treatyId = req.query.treaty_id ? Number(req.query.treaty_id) : null;
    let treaty = null;
    if (treatyId) {
      const tr = await pool.query(`SELECT * FROM reinsurance_treaties WHERE id = $1`, [treatyId]);
      if (tr.rows.length > 0) treaty = tr.rows[0];
    }
    const r = await pool.query(
      `SELECT s.id, s.claim_id, s.amount, c.claim_type
       FROM settlements s LEFT JOIN claims c ON c.id = s.claim_id
       WHERE date_trunc('month', s.created_at) = make_date($1::int, $2::int, 1)::timestamp`,
      [Number(ym[1]), Number(ym[2])]
    ).catch(() => ({ rows: [] }));
    const retention = treaty ? Number(treaty.retention_amount || 0) : 0;
    const cessionPct = treaty ? Number(treaty.cession_pct || 0) / 100 : 0;
    res.setHeader('Content-Type', 'text/csv');
    res.write('settlement_id,claim_id,claim_type,amount,ceded,retained\n');
    for (const s of r.rows) {
      const amt = Number(s.amount || 0);
      const ceded = treaty ? Math.max(0, amt - retention) * cessionPct : 0;
      res.write(`${s.id},${s.claim_id},${(s.claim_type || '').replace(/,/g, ' ')},${amt},${ceded.toFixed(2)},${(amt - ceded).toFixed(2)}\n`);
    }
    res.end();
  } catch (err) { next(err); }
});

module.exports = router;
