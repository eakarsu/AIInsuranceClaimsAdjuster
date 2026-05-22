import React, { useEffect, useState } from 'react'

const BUCKET_LABELS = {
  low: 'Low (<30)',
  medium: 'Medium (30–60)',
  high: 'High (60–85)',
  critical: 'Critical (85+)',
  unscored: 'Unscored',
}

function token() { return localStorage.getItem('token') }

function cellColor(count, max) {
  if (!count) return '#f5f7fa'
  const intensity = Math.min(1, count / Math.max(1, max))
  // red gradient
  const r = 255
  const g = Math.round(200 - 160 * intensity)
  const b = Math.round(200 - 160 * intensity)
  return `rgb(${r},${g},${b})`
}

export default function FraudRiskHeatmap() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/custom-views/fraud-risk-heatmap', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false) })
      .catch(e => { setErr(String(e)); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 16 }}>Loading heatmap...</div>
  if (err) return <div style={{ padding: 16, color: '#c00' }}>Error: {err}</div>
  if (!data?.matrix) return <div style={{ padding: 16 }}>No data</div>

  const buckets = data.buckets
  const maxCell = Math.max(1, ...data.matrix.flatMap(row => buckets.map(b => row.cells[b]?.count || 0)))

  return (
    <div data-testid="fraud-risk-heatmap" style={{
      background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ marginBottom: 4, color: '#0f3460' }}>Fraud Risk Heatmap</h3>
      <p style={{ color: '#7f8c8d', fontSize: 13, marginBottom: 16 }}>
        Claim type × risk indicator bucket. Cell color = density.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 13, color: '#555', borderBottom: '2px solid #e1e8ed' }}>Claim Type</th>
              {buckets.map(b => (
                <th key={b} style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, color: '#555', borderBottom: '2px solid #e1e8ed' }}>
                  {BUCKET_LABELS[b]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map(row => (
              <tr key={row.claim_type}>
                <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #eef2f7' }}>
                  {row.claim_type}
                </td>
                {buckets.map(b => {
                  const cell = row.cells[b] || { count: 0, avg_risk_score: 0 }
                  return (
                    <td key={b} style={{
                      background: cellColor(cell.count, maxCell),
                      padding: '12px 10px', textAlign: 'center', fontSize: 13,
                      fontWeight: cell.count > 0 ? 700 : 400, color: cell.count > maxCell * 0.5 ? '#fff' : '#2c3e50',
                      borderBottom: '1px solid #eef2f7', minWidth: 70,
                    }} title={`avg risk: ${cell.avg_risk_score}`}>
                      {cell.count || '·'}
                    </td>
                  )
                })}
              </tr>
            ))}
            {data.matrix.length === 0 && (
              <tr><td colSpan={buckets.length + 1} style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                No claim data
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
