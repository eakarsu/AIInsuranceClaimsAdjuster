const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customer:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, city, state, zip, date_of_birth } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip, date_of_birth) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [first_name, last_name, email, phone, address, city, state, zip, date_of_birth]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating customer:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, city, state, zip, date_of_birth } = req.body;
    const result = await pool.query(
      'UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, address=$5, city=$6, state=$7, zip=$8, date_of_birth=$9 WHERE id=$10 RETURNING *',
      [first_name, last_name, email, phone, address, city, state, zip, date_of_birth, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating customer:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error('Error deleting customer:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
