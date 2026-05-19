/*
 * routes/adjusterField.js — Apply pass 5
 *
 * Adjuster field workflow: per-adjuster active claim queue, photo URL pointers,
 * field-note submission. Mirrors `customerPortal.js` style — additive tables only.
 */
const router = require('express').Router();
const { pool } = require('../db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS field_notes (
        id SERIAL PRIMARY KEY,
        adjuster_id INTEGER,
        claim_id INTEGER,
        note TEXT,
        location_lat NUMERIC,
        location_lon NUMERIC,
        created_at TIMESTAMP DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS field_photo_pointers (
        id SERIAL PRIMARY KEY,
        adjuster_id INTEGER,
        claim_id INTEGER,
        external_url TEXT,
        caption TEXT,
        captured_at TIMESTAMP,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) {
    console.error('adjusterField bootstrap error:', e.message);
  }
})();

// GET /api/adjuster-field/queue?adjuster_id=
router.get('/queue', async (req, res) => {
  try {
    const aid = Number(req.query.adjuster_id);
    if (!aid) return res.status(400).json({ error: 'adjuster_id required' });
    const r = await pool.query(
      `SELECT id, claim_number, status, claim_type, date_of_loss, customer_id, total_amount
       FROM claims WHERE assigned_adjuster_id = $1 AND status IN ('open', 'in_review', 'investigating', 'pending')
       ORDER BY created_at ASC LIMIT 50`,
      [aid]
    ).catch(() => ({ rows: [] }));
    res.json({ queue: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/adjuster-field/notes
router.post('/notes', async (req, res) => {
  try {
    const { adjuster_id, claim_id, note, location_lat, location_lon } = req.body || {};
    if (!claim_id || !note) return res.status(400).json({ error: 'claim_id and note required' });
    const r = await pool.query(
      `INSERT INTO field_notes (adjuster_id, claim_id, note, location_lat, location_lon)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [adjuster_id ? Number(adjuster_id) : null, Number(claim_id), String(note).slice(0, 4000), location_lat || null, location_lon || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/adjuster-field/notes?claim_id=
router.get('/notes', async (req, res) => {
  try {
    const cid = Number(req.query.claim_id);
    if (!cid) return res.status(400).json({ error: 'claim_id required' });
    const r = await pool.query(`SELECT * FROM field_notes WHERE claim_id = $1 ORDER BY created_at DESC LIMIT 200`, [cid]);
    res.json({ notes: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/adjuster-field/photos
router.post('/photos', async (req, res) => {
  try {
    const { adjuster_id, claim_id, external_url, caption, captured_at } = req.body || {};
    if (!claim_id || !external_url) return res.status(400).json({ error: 'claim_id and external_url required' });
    const r = await pool.query(
      `INSERT INTO field_photo_pointers (adjuster_id, claim_id, external_url, caption, captured_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [adjuster_id ? Number(adjuster_id) : null, Number(claim_id), String(external_url).slice(0, 2000), caption || null, captured_at || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/adjuster-field/photos?claim_id=
router.get('/photos', async (req, res) => {
  try {
    const cid = Number(req.query.claim_id);
    if (!cid) return res.status(400).json({ error: 'claim_id required' });
    const r = await pool.query(`SELECT * FROM field_photo_pointers WHERE claim_id = $1 ORDER BY uploaded_at DESC LIMIT 200`, [cid]);
    res.json({ photos: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
