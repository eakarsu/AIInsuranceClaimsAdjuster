# Governed claims workflow

`/api/governed-claims` provides tenant-isolated FNOL, versioned coverage review, immutable evidence provenance, estimates/reserves, decision evidence, approvals, payment separation, recovery/dispute state, and audit history. Amounts cannot be negative or exceed governed reserve/coverage bounds. Decisions require coverage version, evidence, explanation, extraction/fraud/fairness review; the system cannot autonomously approve, deny, or pay.

Policy/claims cores, document/image capture, fraud/vendor data, payments, communications, and repair/provider networks are not bundled. `CLAIMS_PROVIDER_ALLOWLIST` gates status recording for separately approved adapters and fails closed when empty. Payment receipts and provider references are external evidence fields, not proof of an integration.

Apply `backend/migrations/` in numeric order, then assign tenant IDs through an authorized identity-admin process. Install locked dependencies with `npm ci`, create an untracked `.env`, migrate, then run `./start.sh`. Startup is non-destructive. Demo seed is disabled unless explicitly opted into outside production with a caller-provided password.

No carrier rules, policy data, fraud feed, repair estimate, payment account, fairness validation, licensed adjuster review, legal/regulatory review, or production infrastructure is supplied or claimed. Database integration, end-to-end provider contracts, professional review, security, and load testing remain blockers.
