const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_assessments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching risk assessments:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching risk assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO risk_assessments (policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating risk assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation } = req.body;
    const result = await pool.query(
      'UPDATE risk_assessments SET policy_id=$1, customer_name=$2, risk_level=$3, risk_score=$4, factors=$5, ai_analysis=$6, recommendation=$7 WHERE id=$8 RETURNING *',
      [policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating risk assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM risk_assessments WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json({ message: 'Risk assessment deleted' });
  } catch (err) {
    console.error('Error deleting risk assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
