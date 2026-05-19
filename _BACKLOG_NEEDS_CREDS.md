# Backlog — credentials required

503-stubbed in `backend/routes/integrations.js`:

| Endpoint | Required env var(s) |
|----------|---------------------|
| `POST /api/integrations/policy-mgmt/sync` | `POLICY_MGMT_API_URL`, `POLICY_MGMT_API_KEY` |
| `POST /api/integrations/iso-claimsearch/lookup` | `ISO_CLAIMSEARCH_API_KEY` |
| `POST /api/integrations/payments/disburse` | `STRIPE_SECRET_KEY` |

`GET /api/integrations/status` returns config booleans for the dashboard.
