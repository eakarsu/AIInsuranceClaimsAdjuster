const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching audit log:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_log WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit log entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching audit log entry:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_name, action, entity_type, entity_id, details, ip_address } = req.body;
    const result = await pool.query(
      'INSERT INTO audit_log (user_name, action, entity_type, entity_id, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [user_name, action, entity_type, entity_id, details, ip_address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating audit log entry:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { user_name, action, entity_type, entity_id, details, ip_address } = req.body;
    const result = await pool.query(
      'UPDATE audit_log SET user_name=$1, action=$2, entity_type=$3, entity_id=$4, details=$5, ip_address=$6 WHERE id=$7 RETURNING *',
      [user_name, action, entity_type, entity_id, details, ip_address, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit log entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating audit log entry:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM audit_log WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Audit log entry not found' });
    res.json({ message: 'Audit log entry deleted' });
  } catch (err) {
    console.error('Error deleting audit log entry:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
