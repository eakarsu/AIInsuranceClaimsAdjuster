const router = require('express').Router();
const { pool } = require('../db');

router.get('/summary', async (req, res) => {
  try {
    const [
      claimsStats,
      customerCount,
      policyStats,
      paymentTotal,
      fraudStats,
      avgClaim,
      claimsByStatus,
      claimsByType,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_claims,
          COUNT(*) FILTER (WHERE status = 'open') AS open_claims,
          COUNT(*) FILTER (WHERE status = 'approved') AS approved_claims,
          COUNT(*) FILTER (WHERE status = 'denied') AS denied_claims
        FROM claims
      `),
      pool.query('SELECT COUNT(*) AS total_customers FROM customers'),
      pool.query(`
        SELECT
          COUNT(*) AS total_policies,
          COUNT(*) FILTER (WHERE status = 'active') AS active_policies
        FROM policies
      `),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total_payments FROM payments WHERE status = 'completed' OR status = 'paid'"),
      pool.query(`
        SELECT
          COUNT(*) AS total_fraud_alerts,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_fraud_alerts
        FROM fraud_alerts
      `),
      pool.query('SELECT COALESCE(AVG(estimated_amount), 0) AS average_claim_amount FROM claims'),
      pool.query('SELECT status, COUNT(*) AS count FROM claims GROUP BY status ORDER BY count DESC'),
      pool.query('SELECT type, COUNT(*) AS count FROM claims GROUP BY type ORDER BY count DESC'),
    ]);

    res.json({
      total_claims: parseInt(claimsStats.rows[0].total_claims),
      open_claims: parseInt(claimsStats.rows[0].open_claims),
      approved_claims: parseInt(claimsStats.rows[0].approved_claims),
      denied_claims: parseInt(claimsStats.rows[0].denied_claims),
      total_customers: parseInt(customerCount.rows[0].total_customers),
      total_policies: parseInt(policyStats.rows[0].total_policies),
      active_policies: parseInt(policyStats.rows[0].active_policies),
      total_payments: parseFloat(paymentTotal.rows[0].total_payments),
      total_fraud_alerts: parseInt(fraudStats.rows[0].total_fraud_alerts),
      pending_fraud_alerts: parseInt(fraudStats.rows[0].pending_fraud_alerts),
      average_claim_amount: parseFloat(avgClaim.rows[0].average_claim_amount),
      claims_by_status: claimsByStatus.rows,
      claims_by_type: claimsByType.rows,
    });
  } catch (err) {
    console.error('Error fetching report summary:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
