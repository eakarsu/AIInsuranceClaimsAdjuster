const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payments:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching payment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_id, claim_number, amount, payment_method, payment_date, status, reference_number, payee_name } = req.body;
    const result = await pool.query(
      'INSERT INTO payments (claim_id, claim_number, amount, payment_method, payment_date, status, reference_number, payee_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [claim_id, claim_number, amount, payment_method, payment_date, status || 'pending', reference_number, payee_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating payment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_id, claim_number, amount, payment_method, payment_date, status, reference_number, payee_name } = req.body;
    const result = await pool.query(
      'UPDATE payments SET claim_id=$1, claim_number=$2, amount=$3, payment_method=$4, payment_date=$5, status=$6, reference_number=$7, payee_name=$8 WHERE id=$9 RETURNING *',
      [claim_id, claim_number, amount, payment_method, payment_date, status, reference_number, payee_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating payment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error('Error deleting payment:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
