/*
 * routes/integrations.js — Apply pass 5 (NEEDS-CREDS stubs)
 *
 * 503-on-no-key stubs for external policy / rating / payments providers.
 */
const router = require('express').Router();

function noKey(res, provider, vars) {
  return res.status(503).json({
    error: `${provider} integration unavailable: credentials not configured`,
    required_env: vars,
    provider_status: 'not_configured',
  });
}

router.post('/policy-mgmt/sync', (_req, res) => {
  if (!process.env.POLICY_MGMT_API_URL || !process.env.POLICY_MGMT_API_KEY) {
    return noKey(res, 'Policy management', ['POLICY_MGMT_API_URL', 'POLICY_MGMT_API_KEY']);
  }
  // TODO: GET ${POLICY_MGMT_API_URL}/policies
  res.status(501).json({ error: 'Policy management sync scaffolded but not implemented' });
});

router.post('/iso-claimsearch/lookup', (_req, res) => {
  if (!process.env.ISO_CLAIMSEARCH_API_KEY) {
    return noKey(res, 'ISO ClaimSearch', ['ISO_CLAIMSEARCH_API_KEY']);
  }
  res.status(501).json({ error: 'ISO ClaimSearch scaffolded but not implemented' });
});

router.post('/payments/disburse', (_req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return noKey(res, 'Payments', ['STRIPE_SECRET_KEY']);
  }
  res.status(501).json({ error: 'Payments scaffolded but not implemented' });
});

router.get('/status', (_req, res) => {
  res.json({
    policy_management: !!(process.env.POLICY_MGMT_API_URL && process.env.POLICY_MGMT_API_KEY),
    iso_claimsearch: !!process.env.ISO_CLAIMSEARCH_API_KEY,
    payments: !!process.env.STRIPE_SECRET_KEY,
  });
});

module.exports = router;
