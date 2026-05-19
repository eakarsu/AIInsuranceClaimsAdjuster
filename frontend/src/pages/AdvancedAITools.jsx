import React, { useEffect, useState } from 'react'
import AIResultDisplay from '../components/AIResultDisplay.jsx'
import { runAI, fetchItems } from '../services/api.js'

const TOOLS = [
  {
    id: 'subrogation-optimizer',
    title: 'Subrogation Optimizer',
    icon: '⚖️',
    desc: 'Recovery opportunities (type, target party, recovery range, success probability) and prioritized actions. Operational guidance only — not legal advice.',
    fields: [
      { name: 'claim_id', label: 'Claim', type: 'claim', required: true },
      { name: 'notes', label: 'Adjuster Notes (optional)', type: 'textarea', placeholder: 'Liability impressions, party communications so far, ongoing investigations' },
    ],
  },
  {
    id: 'reserve-estimation',
    title: 'Reserve Estimation',
    icon: '📊',
    desc: 'Reserve low/central/high with confidence, drivers, missing info, and recommended review cadence.',
    fields: [
      { name: 'claim_id', label: 'Claim', type: 'claim', required: true },
      { name: 'horizon_months', label: 'Horizon (months)', type: 'number', placeholder: '12' },
    ],
  },
  {
    id: 'predictive-settlement-optimization',
    title: 'Predictive Settlement Optimization',
    icon: '🎯',
    desc: 'Multi-scenario settlement strategy with probabilities, expected value, and litigation risk.',
    fields: [
      { name: 'claim_id', label: 'Claim', type: 'claim', required: true },
      { name: 'target_outcome', label: 'Target outcome (optional)', type: 'textarea', placeholder: 'e.g., minimize cost while preserving customer satisfaction' },
    ],
  },
  {
    id: 'adjuster-workload-balancing',
    title: 'Adjuster Workload Balancing',
    icon: '⚖️',
    desc: 'Rebalance open claims across adjusters honoring specialization, severity, and capacity.',
    fields: [
      { name: 'balancing_goal', label: 'Balancing goal (optional)', type: 'textarea', placeholder: 'e.g., even distribution while honoring specialization & SLA' },
    ],
  },
  {
    id: 'customer-ltv-retention',
    title: 'Customer LTV & Retention',
    icon: '💎',
    desc: 'Post-claim LTV estimate, churn risk, retention strategy, and upsell opportunities.',
    fields: [
      { name: 'customer_id', label: 'Customer ID', type: 'number', required: true, placeholder: 'e.g., 1' },
    ],
  },
]

export default function AdvancedAITools() {
  const [tab, setTab] = useState(TOOLS[0].id)
  const [forms, setForms] = useState({})
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const tool = TOOLS.find((t) => t.id === tab)
  const formData = forms[tab] || {}

  useEffect(() => {
    fetchItems('claims').then((data) => setClaims(Array.isArray(data) ? data : data?.data || [])).catch(() => setClaims([]))
  }, [])

  const setField = (name, value) => {
    setForms((p) => ({ ...p, [tab]: { ...(p[tab] || {}), [name]: value } }))
  }

  const submit = async (e) => {
    e.preventDefault()
    for (const f of tool.fields) {
      if (f.required && !formData[f.name]) {
        setError(`${f.label} is required`)
        return
      }
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const body = {}
      tool.fields.forEach((f) => {
        const v = formData[f.name]
        if (v === '' || v === undefined || v === null) return
        if (f.type === 'number' || f.type === 'claim') body[f.name] = Number(v)
        else body[f.name] = v
      })
      const data = await runAI(tool.id, body)
      setResult(data)
    } catch (err) {
      setError(err.message || 'AI analysis failed')
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🤖 Advanced AI Tools</h1>
        <p>Subrogation optimization and reserve estimation</p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setError(null); setResult(null); }}
            className={tab === t.id ? 'btn btn-primary' : 'btn'}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
              background: tab === t.id ? '#3b82f6' : 'white',
              color: tab === t.id ? 'white' : '#0f172a',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
          </button>
        ))}
      </div>

      <div className="card" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0 }}>{tool.icon} {tool.title}</h3>
        <p style={{ color: '#64748b' }}>{tool.desc}</p>

        <form onSubmit={submit}>
          {tool.fields.map((f) => (
            <div key={f.name} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              {f.type === 'claim' ? (
                <select
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Select Claim --</option>
                  {claims.map((c) => (
                    <option key={c.id} value={c.id}>
                      CLM #{c.claim_number || c.id} - {c.type || ''} {c.estimated_amount ? `($${Number(c.estimated_amount).toLocaleString()})` : ''}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: loading ? '#94a3b8' : '#3b82f6', color: 'white',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, border: '1px solid #fecaca' }}>{error}</div>
        )}

        {loading && (
          <div style={{ marginTop: 20, padding: 20, background: '#f8fafc', borderRadius: 8, color: '#64748b' }}>
            AI is analyzing... please wait.
          </div>
        )}
        {!loading && result && (
          <div style={{ marginTop: 20 }}>
            <AIResultDisplay result={result} />
          </div>
        )}
      </div>
    </div>
  )
}
