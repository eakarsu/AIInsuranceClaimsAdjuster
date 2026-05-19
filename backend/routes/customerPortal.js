/*
 * routes/customerPortal.js — Apply pass 5
 *
 * Customer-facing claim portal: read-only claim status, document upload (text
 * pointer only — no binary in Postgres), in-portal messages.
 * Additive `portal_messages` and `portal_document_pointers` tables.
 * Matches project convention: no JWT middleware on routes (existing routes
 * follow the same pattern). Future hardening: gate via authMiddleware.
 */
const router = require('express').Router();
const { pool } = require('../db');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portal_messages (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER,
        customer_id INTEGER,
        sender_role TEXT,
        body TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portal_document_pointers (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER,
        customer_id INTEGER,
        title TEXT,
        external_url TEXT,
        mime_type TEXT,
        size_bytes BIGINT,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) {
    console.error('customerPortal bootstrap error:', e.message);
  }
})();

// GET /api/customer-portal/claims/:claim_id/status
router.get('/claims/:claim_id/status', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, claim_number, status, claim_type, date_of_loss, total_amount, customer_id, created_at, updated_at
       FROM claims WHERE id = $1`,
      [Number(req.params.claim_id)]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customer-portal/customers/:customer_id/claims
router.get('/customers/:customer_id/claims', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, claim_number, status, claim_type, total_amount, date_of_loss, created_at
       FROM claims WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [Number(req.params.customer_id)]
    );
    res.json({ claims: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/customer-portal/documents
router.post('/documents', async (req, res) => {
  try {
    const { claim_id, customer_id, title, external_url, mime_type, size_bytes } = req.body || {};
    if (!claim_id || !external_url) {
      return res.status(400).json({ error: 'claim_id and external_url required' });
    }
    const r = await pool.query(
      `INSERT INTO portal_document_pointers (claim_id, customer_id, title, external_url, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [Number(claim_id), customer_id ? Number(customer_id) : null, title || null, String(external_url).slice(0, 2000), mime_type || null, size_bytes ? Number(size_bytes) : null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/customer-portal/documents?claim_id=
router.get('/documents', async (req, res) => {
  try {
    const cid = Number(req.query.claim_id);
    if (!cid) return res.status(400).json({ error: 'claim_id required' });
    const r = await pool.query(`SELECT * FROM portal_document_pointers WHERE claim_id = $1 ORDER BY uploaded_at DESC`, [cid]);
    res.json({ documents: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/customer-portal/messages
router.post('/messages', async (req, res) => {
  try {
    const { claim_id, customer_id, sender_role, body } = req.body || {};
    if (!claim_id || !body) return res.status(400).json({ error: 'claim_id and body required' });
    const role = ['customer', 'adjuster'].includes(sender_role) ? sender_role : 'customer';
    const r = await pool.query(
      `INSERT INTO portal_messages (claim_id, customer_id, sender_role, body) VALUES ($1, $2, $3, $4) RETURNING *`,
      [Number(claim_id), customer_id ? Number(customer_id) : null, role, String(body).slice(0, 4000)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/customer-portal/messages?claim_id=
router.get('/messages', async (req, res) => {
  try {
    const cid = Number(req.query.claim_id);
    if (!cid) return res.status(400).json({ error: 'claim_id required' });
    const r = await pool.query(`SELECT * FROM portal_messages WHERE claim_id = $1 ORDER BY created_at ASC LIMIT 500`, [cid]);
    res.json({ thread: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
