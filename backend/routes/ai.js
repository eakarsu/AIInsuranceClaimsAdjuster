const router = require('express').Router();
const { pool } = require('../db');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

async function callAI(systemPrompt, userPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Try to parse JSON from the response
  try {
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        return { analysis: content };
      }
    }
    return { analysis: content };
  }
}

// POST /fraud-detection
router.post('/fraud-detection', async (req, res) => {
  try {
    const { claim_id, claim_description, claim_amount, claim_type } = req.body;

    const systemPrompt = 'You are an insurance fraud detection AI. Analyze the claim and return a JSON object with: risk_score (0-100), risk_level (low/medium/high/critical), indicators (array of suspicious factors), recommendation (approve/investigate/deny), detailed_analysis (paragraph), and red_flags (array of specific concerns). Be thorough and professional.';
    const userPrompt = `Analyze this insurance claim for potential fraud:\nClaim Type: ${claim_type}\nClaim Amount: $${claim_amount}\nDescription: ${claim_description}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    // Save to fraud_alerts table
    await pool.query(
      'INSERT INTO fraud_alerts (claim_id, risk_score, indicators, ai_analysis, status) VALUES ($1, $2, $3, $4, $5)',
      [claim_id, analysis.risk_score || 0, JSON.stringify(analysis.indicators || []), JSON.stringify(analysis), 'pending']
    );

    res.json(analysis);
  } catch (err) {
    console.error('Fraud detection error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /damage-assessment
router.post('/damage-assessment', async (req, res) => {
  try {
    const { claim_id, description, damage_type, location } = req.body;

    const systemPrompt = 'You are an insurance damage assessment AI. Analyze the damage description and return JSON with: estimated_cost (number), severity (minor/moderate/severe/catastrophic), repair_timeline (string), damage_breakdown (array of {item, cost, priority}), recommendations (array), and detailed_analysis (paragraph).';
    const userPrompt = `Assess the following damage:\nDamage Type: ${damage_type}\nLocation: ${location}\nDescription: ${description}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    await pool.query(
      'INSERT INTO damage_assessments (claim_id, damage_type, severity, estimated_cost, ai_analysis, repair_timeline) VALUES ($1, $2, $3, $4, $5, $6)',
      [claim_id, damage_type, analysis.severity || 'moderate', analysis.estimated_cost || 0, JSON.stringify(analysis), analysis.repair_timeline || 'TBD']
    );

    res.json(analysis);
  } catch (err) {
    console.error('Damage assessment error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /risk-assessment
router.post('/risk-assessment', async (req, res) => {
  try {
    const { policy_id, customer_info, policy_type, coverage_amount } = req.body;

    const systemPrompt = 'You are an insurance risk assessment AI. Evaluate the policy risk and return JSON with: risk_score (0-100), risk_level (low/medium/high/critical), risk_factors (array of {factor, impact, score}), premium_recommendation (number), mitigation_suggestions (array), and detailed_analysis (paragraph).';
    const userPrompt = `Evaluate risk for this policy:\nPolicy Type: ${policy_type}\nCoverage Amount: $${coverage_amount}\nCustomer Info: ${JSON.stringify(customer_info)}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    await pool.query(
      'INSERT INTO risk_assessments (policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [policy_id, customer_info?.name || 'Unknown', analysis.risk_level || 'medium', analysis.risk_score || 0, JSON.stringify(analysis.risk_factors || []), JSON.stringify(analysis), analysis.detailed_analysis || '']
    );

    res.json(analysis);
  } catch (err) {
    console.error('Risk assessment error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /settlement-recommendation
router.post('/settlement-recommendation', async (req, res) => {
  try {
    const { claim_id, claim_description, claim_amount, policy_coverage, damage_assessment } = req.body;

    const systemPrompt = 'You are an insurance settlement recommendation AI. Analyze the claim and return JSON with: recommended_amount (number), confidence_level (percentage), justification (paragraph), comparable_settlements (array of {description, amount}), negotiation_range ({min, max}), and detailed_analysis (paragraph).';
    const userPrompt = `Recommend a settlement for this claim:\nClaim Amount: $${claim_amount}\nPolicy Coverage: $${policy_coverage}\nDamage Assessment: ${damage_assessment}\nDescription: ${claim_description}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    // Get claim number
    const claimResult = await pool.query('SELECT claim_number FROM claims WHERE id = $1', [claim_id]);
    const claimNumber = claimResult.rows[0]?.claim_number || '';

    await pool.query(
      'INSERT INTO settlements (claim_id, claim_number, recommended_amount, ai_analysis, status) VALUES ($1, $2, $3, $4, $5)',
      [claim_id, claimNumber, analysis.recommended_amount || 0, JSON.stringify(analysis), 'pending']
    );

    res.json(analysis);
  } catch (err) {
    console.error('Settlement recommendation error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /document-analysis
router.post('/document-analysis', async (req, res) => {
  try {
    const { document_id, document_text, document_type } = req.body;

    const systemPrompt = 'You are an insurance document analysis AI. Extract key information and return JSON with: document_summary (string), key_entities (array of {type, value}), important_dates (array), monetary_values (array), risk_indicators (array), missing_information (array), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze this insurance document:\nDocument Type: ${document_type}\nContent: ${document_text}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    if (document_id) {
      await pool.query(
        'UPDATE documents SET extracted_data = $1, ai_analysis = $2, status = $3 WHERE id = $4',
        [JSON.stringify(analysis.key_entities || []), JSON.stringify(analysis), 'analyzed', document_id]
      );
    }

    res.json(analysis);
  } catch (err) {
    console.error('Document analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /policy-coverage
router.post('/policy-coverage', async (req, res) => {
  try {
    const { policy_id, policy_type, coverage_details, claim_description } = req.body;

    const systemPrompt = 'You are an insurance policy coverage analysis AI. Analyze whether the claim is covered and return JSON with: is_covered (boolean), coverage_percentage (number), applicable_clauses (array), exclusions (array), deductible_applies (boolean), max_payout (number), coverage_gaps (array), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze policy coverage for this claim:\nPolicy Type: ${policy_type}\nCoverage Details: ${JSON.stringify(coverage_details)}\nClaim Description: ${claim_description}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Policy coverage error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /customer-sentiment
router.post('/customer-sentiment', async (req, res) => {
  try {
    const { customer_id, message, channel, customer_name } = req.body;

    const systemPrompt = 'You are a customer sentiment analysis AI for insurance. Analyze the message and return JSON with: sentiment (positive/neutral/negative/urgent), sentiment_score (-1 to 1), key_concerns (array), urgency_level (low/medium/high/critical), recommended_response (string), escalation_needed (boolean), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze the sentiment of this customer message:\nCustomer: ${customer_name}\nChannel: ${channel}\nMessage: ${message}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    await pool.query(
      'INSERT INTO communications (customer_id, customer_name, channel, message, sentiment, sentiment_score, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [customer_id, customer_name, channel, message, analysis.sentiment || 'neutral', analysis.sentiment_score || 0, JSON.stringify(analysis)]
    );

    res.json(analysis);
  } catch (err) {
    console.error('Customer sentiment error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /claims-forecasting
router.post('/claims-forecasting', async (req, res) => {
  try {
    const { claim_type, region, time_period, historical_context } = req.body;

    const systemPrompt = 'You are an insurance claims forecasting AI. Predict future trends and return JSON with: predicted_claims_count (number), predicted_total_amount (number), trend (increasing/stable/decreasing), seasonal_factors (array), risk_factors (array), confidence_interval ({low, high}), monthly_forecast (array of {month, count, amount}), and detailed_analysis (paragraph).';
    const userPrompt = `Forecast claims for:\nClaim Type: ${claim_type}\nRegion: ${region}\nTime Period: ${time_period}\nHistorical Context: ${historical_context}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Claims forecasting error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /claim-analysis
router.post('/claim-analysis', async (req, res) => {
  try {
    const { claim_id, claim_number, claim_type, description, estimated_amount, status } = req.body;

    const systemPrompt = 'You are an AI insurance claim analyst. Analyze this claim thoroughly and return JSON with: claim_assessment (string), recommended_actions (array of strings), priority_level (low/medium/high/urgent), estimated_resolution_days (number), similar_claims_insight (string), potential_issues (array of strings), next_steps (array of strings), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze this insurance claim:\nClaim ID: ${claim_id}\nClaim Number: ${claim_number}\nClaim Type: ${claim_type}\nDescription: ${description}\nEstimated Amount: $${estimated_amount}\nStatus: ${status}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Claim analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /policy-review
router.post('/policy-review', async (req, res) => {
  try {
    const { policy_id, policy_number, policy_type, premium, coverage_limit, deductible, customer_info } = req.body;

    const systemPrompt = 'You are an AI insurance policy reviewer. Review this policy and return JSON with: policy_rating (A/B/C/D/F), premium_assessment (string - overpriced/fair/underpriced), coverage_adequacy (percentage 0-100), recommended_adjustments (array of strings), risk_exposure (string), competitive_analysis (string), renewal_recommendation (renew/modify/cancel), and detailed_analysis (paragraph).';
    const userPrompt = `Review this insurance policy:\nPolicy ID: ${policy_id}\nPolicy Number: ${policy_number}\nPolicy Type: ${policy_type}\nPremium: $${premium}\nCoverage Limit: $${coverage_limit}\nDeductible: $${deductible}\nCustomer Info: ${JSON.stringify(customer_info)}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Policy review error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /customer-analysis
router.post('/customer-analysis', async (req, res) => {
  try {
    const { customer_id, customer_name, total_policies, total_claims, claim_history } = req.body;

    const systemPrompt = 'You are an AI customer analytics specialist for insurance. Analyze this customer profile and return JSON with: customer_risk_score (0-100), lifetime_value_estimate (number in dollars), retention_probability (percentage), cross_sell_opportunities (array of strings), risk_factors (array of strings), loyalty_tier (platinum/gold/silver/bronze), recommended_actions (array of strings), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze this insurance customer profile:\nCustomer ID: ${customer_id}\nCustomer Name: ${customer_name}\nTotal Policies: ${total_policies}\nTotal Claims: ${total_claims}\nClaim History: ${JSON.stringify(claim_history)}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Customer analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /adjuster-performance
router.post('/adjuster-performance', async (req, res) => {
  try {
    const { adjuster_id, adjuster_name, specialization, experience_years, total_claims_handled, average_resolution_time } = req.body;

    const systemPrompt = 'You are an AI performance analyst for insurance adjusters. Analyze this adjuster\'s performance and return JSON with: performance_score (0-100), efficiency_rating (excellent/good/average/below_average), strengths (array of strings), areas_for_improvement (array of strings), recommended_training (array of strings), workload_assessment (string - overloaded/optimal/underutilized), peer_comparison (string), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze this insurance adjuster's performance:\nAdjuster ID: ${adjuster_id}\nAdjuster Name: ${adjuster_name}\nSpecialization: ${specialization}\nExperience Years: ${experience_years}\nTotal Claims Handled: ${total_claims_handled}\nAverage Resolution Time: ${average_resolution_time}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Adjuster performance error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /payment-analysis
router.post('/payment-analysis', async (req, res) => {
  try {
    const { payment_details, total_amount, payment_method, claim_info } = req.body;

    const systemPrompt = 'You are an AI payment analysis specialist for insurance. Analyze this payment and return JSON with: anomaly_score (0-100), anomaly_detected (boolean), payment_risk_level (low/medium/high), verification_status (string), recommended_actions (array of strings), pattern_analysis (string), compliance_check (string - compliant/needs_review/non_compliant), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze this insurance payment:\nPayment Details: ${JSON.stringify(payment_details)}\nTotal Amount: $${total_amount}\nPayment Method: ${payment_method}\nClaim Info: ${JSON.stringify(claim_info)}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Payment analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /audit-analysis
router.post('/audit-analysis', async (req, res) => {
  try {
    const { audit_entries, time_period, entity_type } = req.body;

    const systemPrompt = 'You are an AI audit analyst for insurance systems. Analyze these audit log patterns and return JSON with: suspicious_activity_score (0-100), anomalies_detected (array of {description, severity, timestamp}), compliance_status (string), access_pattern_analysis (string), recommended_investigations (array of strings), security_concerns (array of strings), overall_risk_assessment (low/medium/high/critical), and detailed_analysis (paragraph).';
    const userPrompt = `Analyze these audit log entries:\nAudit Entries: ${JSON.stringify(audit_entries)}\nTime Period: ${time_period}\nEntity Type: ${entity_type}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Audit analysis error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /smart-summary
router.post('/smart-summary', async (req, res) => {
  try {
    const { data_type, data_summary, count, key_metrics } = req.body;

    const systemPrompt = 'You are an AI business intelligence analyst for insurance. Provide a smart summary and return JSON with: executive_summary (string), key_insights (array of strings), trends (array of {trend, direction, impact}), action_items (array of strings), performance_indicators (array of {metric, value, status}), forecast (string), and detailed_analysis (paragraph).';
    const userPrompt = `Provide a smart summary for this insurance data:\nData Type: ${data_type}\nData Summary: ${JSON.stringify(data_summary)}\nCount: ${count}\nKey Metrics: ${JSON.stringify(key_metrics)}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Smart summary error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /auto-assign
router.post('/auto-assign', async (req, res) => {
  try {
    const { claim_type, claim_description, severity, location, available_adjusters } = req.body;

    const systemPrompt = 'You are an AI claim routing specialist for insurance. Recommend the best adjuster assignment and return JSON with: recommended_adjuster (string), match_score (0-100), reasoning (string), alternative_adjusters (array of {name, score, reason}), estimated_workload_impact (string), priority_routing (boolean), and detailed_analysis (paragraph).';
    const userPrompt = `Recommend the best adjuster assignment for this claim:\nClaim Type: ${claim_type}\nClaim Description: ${claim_description}\nSeverity: ${severity}\nLocation: ${location}\nAvailable Adjusters: ${JSON.stringify(available_adjusters)}`;

    const analysis = await callAI(systemPrompt, userPrompt);

    res.json(analysis);
  } catch (err) {
    console.error('Auto assign error:', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

module.exports = router;
