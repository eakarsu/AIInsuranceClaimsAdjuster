const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.first_name || ' ' || c.last_name AS customer_name
      FROM policies p
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching policies:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching policy:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { policy_number, customer_id, type, premium, deductible, coverage_limit, start_date, end_date, status } = req.body;
    const result = await pool.query(
      'INSERT INTO policies (policy_number, customer_id, type, premium, deductible, coverage_limit, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [policy_number, customer_id, type, premium, deductible, coverage_limit, start_date, end_date, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating policy:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { policy_number, customer_id, type, premium, deductible, coverage_limit, start_date, end_date, status } = req.body;
    const result = await pool.query(
      'UPDATE policies SET policy_number=$1, customer_id=$2, type=$3, premium=$4, deductible=$5, coverage_limit=$6, start_date=$7, end_date=$8, status=$9 WHERE id=$10 RETURNING *',
      [policy_number, customer_id, type, premium, deductible, coverage_limit, start_date, end_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating policy:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Policy not found' });
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    console.error('Error deleting policy:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
