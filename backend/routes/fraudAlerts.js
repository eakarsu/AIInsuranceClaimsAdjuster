const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fraud_alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching fraud alerts:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fraud_alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fraud alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching fraud alert:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_id, risk_score, indicators, ai_analysis, status, reviewed_by } = req.body;
    const result = await pool.query(
      'INSERT INTO fraud_alerts (claim_id, risk_score, indicators, ai_analysis, status, reviewed_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [claim_id, risk_score, indicators, ai_analysis, status || 'pending', reviewed_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating fraud alert:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_id, risk_score, indicators, ai_analysis, status, reviewed_by } = req.body;
    const result = await pool.query(
      'UPDATE fraud_alerts SET claim_id=$1, risk_score=$2, indicators=$3, ai_analysis=$4, status=$5, reviewed_by=$6 WHERE id=$7 RETURNING *',
      [claim_id, risk_score, indicators, ai_analysis, status, reviewed_by, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fraud alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating fraud alert:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fraud_alerts WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Fraud alert not found' });
    res.json({ message: 'Fraud alert deleted' });
  } catch (err) {
    console.error('Error deleting fraud alert:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
