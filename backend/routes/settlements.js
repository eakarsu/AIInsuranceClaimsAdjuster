const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settlements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching settlements:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settlements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Settlement not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settlement:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_id, claim_number, recommended_amount, final_amount, ai_analysis, status, approved_by } = req.body;
    const result = await pool.query(
      'INSERT INTO settlements (claim_id, claim_number, recommended_amount, final_amount, ai_analysis, status, approved_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [claim_id, claim_number, recommended_amount, final_amount, ai_analysis, status || 'pending', approved_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating settlement:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_id, claim_number, recommended_amount, final_amount, ai_analysis, status, approved_by } = req.body;
    const result = await pool.query(
      'UPDATE settlements SET claim_id=$1, claim_number=$2, recommended_amount=$3, final_amount=$4, ai_analysis=$5, status=$6, approved_by=$7 WHERE id=$8 RETURNING *',
      [claim_id, claim_number, recommended_amount, final_amount, ai_analysis, status, approved_by, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Settlement not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating settlement:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM settlements WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Settlement not found' });
    res.json({ message: 'Settlement deleted' });
  } catch (err) {
    console.error('Error deleting settlement:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
