const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching document:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { claim_id, document_type, file_name, content, extracted_data, ai_analysis, status } = req.body;
    const result = await pool.query(
      'INSERT INTO documents (claim_id, document_type, file_name, content, extracted_data, ai_analysis, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [claim_id, document_type, file_name, content, extracted_data, ai_analysis, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating document:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_id, document_type, file_name, content, extracted_data, ai_analysis, status } = req.body;
    const result = await pool.query(
      'UPDATE documents SET claim_id=$1, document_type=$2, file_name=$3, content=$4, extracted_data=$5, ai_analysis=$6, status=$7 WHERE id=$8 RETURNING *',
      [claim_id, document_type, file_name, content, extracted_data, ai_analysis, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating document:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error('Error deleting document:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
