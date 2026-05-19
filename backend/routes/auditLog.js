const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (req.query.action) {
      conditions.push(`action ILIKE $${paramIdx++}`);
      params.push(`%${req.query.action}%`);
    }
    if (req.query.entity_type) {
      conditions.push(`(entity_type ILIKE $${paramIdx++} OR table_name ILIKE $${paramIdx - 1})`);
      params.push(`%${req.query.entity_type}%`);
    }
    if (req.query.date_from) {
      conditions.push(`created_at >= $${paramIdx++}`);
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      conditions.push(`created_at <= $${paramIdx++}`);
      params.push(req.query.date_to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*) FROM audit_log ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
