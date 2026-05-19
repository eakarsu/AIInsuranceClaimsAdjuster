const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM customers');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
    const name = (first_name || '') + ' ' + (last_name || '');
    if (!name.trim() || !email) {
      return res.status(400).json({ error: 'name (first_name + last_name) and email are required' });
    }
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
