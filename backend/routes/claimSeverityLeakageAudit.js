const express = require('express');
const router = express.Router();

function audit(input = {}) {
  const claims = input.claims || [
    { claim: 'CLM-1042', severity: 'moderate', reserve: 8200, paid: 11900, supplements: 3 },
    { claim: 'CLM-1088', severity: 'minor', reserve: 2400, paid: 2100, supplements: 0 },
  ];
  return { claims: claims.map((c) => {
    const leakage = Math.max(0, Number(c.paid) - Number(c.reserve));
    const score = Math.min(100, Math.round(leakage / 150 + Number(c.supplements) * 18));
    return { ...c, leakage, leakage_score: score, action: score >= 60 ? 'manager_review' : score >= 30 ? 'adjust_reserve' : 'normal' };
  }) };
}

router.get('/', (req, res) => res.json(audit()));
router.post('/audit', (req, res) => res.json(audit(req.body || {})));
module.exports = router;
