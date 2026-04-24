const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM adjusters ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching adjusters:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM adjusters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Adjuster not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching adjuster:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, specialization, license_number, experience_years, status, rating } = req.body;
    const result = await pool.query(
      'INSERT INTO adjusters (name, email, phone, specialization, license_number, experience_years, status, rating) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, email, phone, specialization, license_number, experience_years, status || 'active', rating || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating adjuster:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, specialization, license_number, experience_years, status, rating } = req.body;
    const result = await pool.query(
      'UPDATE adjusters SET name=$1, email=$2, phone=$3, specialization=$4, license_number=$5, experience_years=$6, status=$7, rating=$8 WHERE id=$9 RETURNING *',
      [name, email, phone, specialization, license_number, experience_years, status, rating, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Adjuster not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating adjuster:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM adjusters WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Adjuster not found' });
    res.json({ message: 'Adjuster deleted' });
  } catch (err) {
    console.error('Error deleting adjuster:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
