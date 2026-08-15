'use strict';

const express = require('express');
const authModule = require('../middleware/auth');

const router = express.Router();
const authenticate = typeof authModule === 'function'
  ? authModule
  : (authModule.authenticateToken || authModule.authMiddleware);

if (typeof authenticate !== 'function') {
  throw new Error('Generated AI features require authentication middleware');
}

const FEATURES = Object.freeze({
  "cf-adjuster-workload-balancing-using-capaci": "Adjuster Workload Balancing Using Capaci",
  "cf-agentic-claims-triage-auto-routing-by": "Agentic Claims Triage Auto Routing By",
  "cf-computer-vision-damage-assessment-from-m": "Computer Vision Damage Assessment From M",
  "cf-customer-ltv-retention-predicting-post-c": "Customer Ltv Retention Predicting Post C",
  "cf-fraud-ring-detection-correlating-claims-": "Fraud Ring Detection Correlating Claims ",
  "cf-predictive-settlement-optimization-model": "Predictive Settlement Optimization Model",
  "gap-no-e-signature-for-settlements": "No E Signature For Settlements",
  "gap-no-image-based-vehicle-damage-estimator": "No Image Based Vehicle Damage Estimator",
  "gap-no-litigation-outcome-predictor": "No Litigation Outcome Predictor",
  "gap-no-mobile-push-notifications-for-field": "No Mobile Push Notifications For Field",
  "gap-no-notifications-module-0-references": "No Notifications Module 0 References",
  "gap-no-reserve-estimation-ai": "No Reserve Estimation Ai",
  "gap-no-subrogation-recovery-optimizer": "No Subrogation Recovery Optimizer",
  "gap-no-webhook-surface-for-fnol-ingestion": "No Webhook Surface For Fnol Ingestion",
  "gap-no-websocket-real-time-claim-feed": "No Websocket Real Time Claim Feed",
});

const SYSTEM_PROMPT = `You are a senior domain analyst providing decision support. Return only valid JSON:
{
  "summary": "concise executive finding",
  "confidence": 0,
  "key_findings": [{"finding":"string","evidence":"string","severity":"low|medium|high|critical"}],
  "risks": [{"risk":"string","mitigation":"string"}],
  "prioritized_actions": [{"priority":1,"action":"string","owner":"string","deadline":"string"}],
  "assumptions": ["string"],
  "missing_information": ["string"],
  "follow_up_questions": ["string"]
}
Use only facts supplied by the user. Clearly label assumptions and missing evidence. Do not claim an external integration, notification, approval, transaction, or operational action was executed. A qualified human remains responsible for consequential decisions.`;

function parseContent(content) {
  if (typeof content !== 'string') return content;
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { return content; }
}

for (const [endpoint, title] of Object.entries(FEATURES)) {
  router.post(`/${endpoint}`, authenticate, async (req, res) => {
    const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
    if (input.length < 10) {
      return res.status(400).json({ error: 'ValidationError', message: 'Input must contain at least 10 characters.' });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AIServiceNotConfigured', message: 'OPENROUTER_API_KEY is required for AI analysis.' });
    }

    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    try {
      const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost',
          'X-Title': process.env.APP_NAME || 'AI Operations Suite',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 1200,
          messages: [
            { role: 'system', content: `${SYSTEM_PROMPT}\n\nFeature: ${title}` },
            { role: 'user', content: input.slice(0, 12000) },
          ],
        }),
        signal: AbortSignal.timeout(45000),
      });
      const provider = await providerResponse.json();
      const content = provider?.choices?.[0]?.message?.content;
      if (!providerResponse.ok || provider?.error || typeof content !== 'string' || !content.trim()) {
        throw new Error(provider?.error?.message || `OpenRouter HTTP ${providerResponse.status}`);
      }
      return res.json({
        feature: endpoint.replace(/\/run$/, ''),
        title,
        result: parseContent(content),
        model: provider.model || model,
        usage: provider.usage || null,
        disclaimer: 'Decision support only. Verify source evidence and obtain qualified human approval before consequential action.',
      });
    } catch (error) {
      console.error(`[generated-ai:${endpoint}]`, error.message);
      return res.status(502).json({
        error: 'AIServiceError',
        message: 'The AI provider could not complete this analysis. Please retry or escalate for manual review.',
      });
    }
  });
}

module.exports = { router, FEATURES };

