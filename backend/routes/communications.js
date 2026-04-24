const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM communications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching communications:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM communications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching communication:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_id, customer_id, customer_name, channel, subject, message, sentiment, sentiment_score, ai_analysis } = req.body;
    const result = await pool.query(
      'INSERT INTO communications (claim_id, customer_id, customer_name, channel, subject, message, sentiment, sentiment_score, ai_analysis) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [claim_id, customer_id, customer_name, channel, subject, message, sentiment, sentiment_score, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating communication:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_id, customer_id, customer_name, channel, subject, message, sentiment, sentiment_score, ai_analysis } = req.body;
    const result = await pool.query(
      'UPDATE communications SET claim_id=$1, customer_id=$2, customer_name=$3, channel=$4, subject=$5, message=$6, sentiment=$7, sentiment_score=$8, ai_analysis=$9 WHERE id=$10 RETURNING *',
      [claim_id, customer_id, customer_name, channel, subject, message, sentiment, sentiment_score, ai_analysis, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating communication:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM communications WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Communication not found' });
    res.json({ message: 'Communication deleted' });
  } catch (err) {
    console.error('Error deleting communication:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
