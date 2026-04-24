const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM damage_assessments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching damage assessments:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM damage_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Damage assessment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching damage assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_id, damage_type, severity, estimated_cost, ai_analysis, photos_reviewed, repair_timeline } = req.body;
    const result = await pool.query(
      'INSERT INTO damage_assessments (claim_id, damage_type, severity, estimated_cost, ai_analysis, photos_reviewed, repair_timeline) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [claim_id, damage_type, severity, estimated_cost, ai_analysis, photos_reviewed || 0, repair_timeline]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating damage assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_id, damage_type, severity, estimated_cost, ai_analysis, photos_reviewed, repair_timeline } = req.body;
    const result = await pool.query(
      'UPDATE damage_assessments SET claim_id=$1, damage_type=$2, severity=$3, estimated_cost=$4, ai_analysis=$5, photos_reviewed=$6, repair_timeline=$7 WHERE id=$8 RETURNING *',
      [claim_id, damage_type, severity, estimated_cost, ai_analysis, photos_reviewed, repair_timeline, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Damage assessment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating damage assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM damage_assessments WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Damage assessment not found' });
    res.json({ message: 'Damage assessment deleted' });
  } catch (err) {
    console.error('Error deleting damage assessment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
