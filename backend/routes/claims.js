const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
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
    `);
    res.json(result.rows);
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

module.exports = router;
