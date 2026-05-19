# Audit Apply Notes — AIInsuranceClaimsAdjuster

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 33.

## Original Recommendations (AI Counterparts)
- `/subrogation-optimizer`
- `/reserve-estimation`

## Implemented (this pass)
Two endpoints appended to `backend/routes/ai.js` using existing `callAI` helper and DB pool:

- `POST /api/ai/subrogation-optimizer` — pulls claim, settlements, document summaries; returns JSON list of recovery opportunities (type, target party, recovery range, statute of limitations, success probability, action steps), priority action, expected total recovery, risks. Disclaims as operational guidance, not legal advice.
- `POST /api/ai/reserve-estimation` — pulls claim, damage assessments, payments, policy; returns reserve low/central/high, confidence, drivers, missing info, recommended review cadence.

Syntax: `node --check` passes.

## Backlog (Custom Feature Suggestions)
- Agentic claims triage (autonomy bounds required).
- Computer-vision damage assessment (`/damage-assessment` already supports `image_base64` — could add mobile workflow).
- Fraud ring detection across claims/customers/adjusters/providers (cross-entity correlation).
- Predictive settlement optimization (compose with existing `/settlement-recommendation`).
- Adjuster workload balancing (extend existing `/auto-assign`).
- Customer LTV retention post-claim.

## Categorization
- MECHANICAL: 2 endpoints (done — exhausts the audit's missing list).
- NEEDS-PRODUCT-DECISION: fraud-ring detection scope, autonomy boundary for triage agent.
- NEEDS-CREDS: external policy management, reinsurance reporting integrations.

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS.
- **FE state:** `frontend/src/pages/AdvancedAITools.jsx` already exposes both pass-2 endpoints (`subrogation-optimizer`, `reserve-estimation`) with dynamic claim-selectors, optional textarea/number fields, loading state, and `AIResultDisplay` rendering. Route is registered as `/advanced-ai` in `App.jsx` and linked from the navbar.
- **Auth:** `services/api.js` `runAI(feature, data)` uses `getHeaders()` which attaches `Authorization: Bearer ${localStorage token}`; 401 responses redirect to `/login`.
- **503/no-key handling:** error JSON's `message` is surfaced to the user.
- **Files modified:** none.
