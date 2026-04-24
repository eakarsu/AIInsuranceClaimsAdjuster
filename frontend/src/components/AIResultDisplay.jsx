import React from 'react'

function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatCurrency(val) {
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isCurrencyField(key) {
  const currencyKeys = ['amount', 'cost', 'premium', 'price', 'value', 'total', 'estimate', 'settlement', 'coverage', 'deductible', 'limit']
  const k = key.toLowerCase()
  return currencyKeys.some(ck => k.includes(ck))
}

function isScoreField(key) {
  const k = key.toLowerCase()
  return k.includes('score') || k.includes('confidence') || k.includes('probability') || k.includes('likelihood')
}

function isRiskLevelField(key) {
  const k = key.toLowerCase()
  return k.includes('risk_level') || k.includes('severity') || k.includes('priority') || k.includes('risk level') || k === 'level' || k.includes('sentiment')
}

function getScoreClass(val) {
  const n = Number(val)
  if (n <= 25) return 'score-low'
  if (n <= 50) return 'score-medium'
  if (n <= 75) return 'score-high'
  return 'score-critical'
}

function getRiskClass(val) {
  const v = String(val).toLowerCase()
  if (['low', 'minor', 'positive'].includes(v)) return 'risk-low'
  if (['medium', 'moderate', 'neutral'].includes(v)) return 'risk-medium'
  if (['high', 'severe', 'negative'].includes(v)) return 'risk-high'
  if (['critical', 'catastrophic', 'urgent', 'extreme'].includes(v)) return 'risk-critical'
  return 'risk-medium'
}

function getRiskIcon(val) {
  const v = String(val).toLowerCase()
  if (['low', 'minor', 'positive'].includes(v)) return '✅'
  if (['medium', 'moderate', 'neutral'].includes(v)) return '⚠️'
  if (['high', 'severe', 'negative'].includes(v)) return '🔶'
  if (['critical', 'catastrophic', 'urgent', 'extreme'].includes(v)) return '🔴'
  return '📊'
}

function ScoreBar({ label, value }) {
  const numVal = Math.min(100, Math.max(0, Number(value)))
  const scoreClass = getScoreClass(numVal)
  return (
    <div className="score-bar-container">
      <div className="score-label">
        <span>{formatKey(label)}</span>
        <span>{numVal}%</span>
      </div>
      <div className="score-bar">
        <div className={`score-bar-fill ${scoreClass}`} style={{ width: `${numVal}%` }} />
      </div>
    </div>
  )
}

function RenderValue({ keyName, value, depth = 0 }) {
  if (value === null || value === undefined) {
    return <span className="ai-section-value">N/A</span>
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value
      ? <span className="ai-boolean-true">✓ Yes</span>
      : <span className="ai-boolean-false">✗ No</span>
  }

  // Score fields
  if (isScoreField(keyName) && typeof value === 'number') {
    return <ScoreBar label={keyName} value={value} />
  }

  // Risk/severity level
  if (isRiskLevelField(keyName) && typeof value === 'string') {
    return (
      <span className={`risk-badge ${getRiskClass(value)}`}>
        {getRiskIcon(value)} {value}
      </span>
    )
  }

  // Currency
  if (isCurrencyField(keyName) && typeof value === 'number') {
    return <span className="ai-section-value currency">{formatCurrency(value)}</span>
  }

  // Number
  if (typeof value === 'number') {
    return <span className="ai-section-value">{value.toLocaleString()}</span>
  }

  // String
  if (typeof value === 'string') {
    if (value.length > 200) {
      return <p className="ai-section-value" style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
    }
    return <span className="ai-section-value">{value}</span>
  }

  // Array of strings
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return (
      <ul className="ai-list">
        {value.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    )
  }

  // Array of objects
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
    return (
      <div>
        {value.map((item, i) => (
          <div key={i} className="ai-subsection">
            {Object.entries(item).map(([k, v]) => (
              <div key={k} style={{ marginBottom: '0.3rem' }}>
                <span className="ai-subsection-title">{formatKey(k)}: </span>
                <RenderValue keyName={k} value={v} depth={depth + 1} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Array of numbers
  if (Array.isArray(value)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {value.map((item, i) => <span key={i} className="ai-tag">{String(item)}</span>)}
      </div>
    )
  }

  // Object
  if (typeof value === 'object' && depth < 3) {
    return (
      <div>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="ai-subsection">
            <span className="ai-subsection-title">{formatKey(k)}</span>
            <div><RenderValue keyName={k} value={v} depth={depth + 1} /></div>
          </div>
        ))}
      </div>
    )
  }

  return <span className="ai-section-value">{JSON.stringify(value)}</span>
}

export default function AIResultDisplay({ result }) {
  if (!result) return null

  // If result has a nested data/result property, unwrap it
  const data = result.result || result.data || result.analysis || result

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <span style={{ fontSize: '1.5rem' }}>🤖</span>
        <h3>AI Analysis Result</h3>
      </div>
      {Object.entries(data).map(([key, value]) => {
        // Skip internal fields
        if (key === 'id' || key === 'created_at' || key === 'updated_at') return null
        return (
          <div key={key} className="ai-section">
            <div className="ai-section-title">{formatKey(key)}</div>
            <RenderValue keyName={key} value={value} />
          </div>
        )
      })}
    </div>
  )
}
