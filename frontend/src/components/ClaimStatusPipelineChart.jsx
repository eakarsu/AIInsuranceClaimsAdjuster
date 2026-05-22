import React, { useEffect, useState } from 'react'

const STATUS_COLORS = {
  open: '#3498db',
  under_review: '#f39c12',
  approved: '#27ae60',
  denied: '#e74c3c',
  settled: '#16a085',
  unknown: '#95a5a6',
}

function token() { return localStorage.getItem('token') }

export default function ClaimStatusPipelineChart() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/custom-views/claim-status-pipeline', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false) })
      .catch(e => { setErr(String(e)); setLoading(false) })
  }, [])

  if (loading) return <div data-testid="pipeline-loading" style={{ padding: 16 }}>Loading pipeline...</div>
  if (err) return <div style={{ padding: 16, color: '#c00' }}>Error: {err}</div>
  if (!data?.pipeline) return <div style={{ padding: 16 }}>No data</div>

  const maxCount = Math.max(1, ...data.pipeline.map(p => p.count))
  return (
    <div data-testid="claim-pipeline-chart" style={{
      background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ marginBottom: 4, color: '#0f3460' }}>Claim Status Pipeline</h3>
      <p style={{ color: '#7f8c8d', fontSize: 13, marginBottom: 16 }}>
        Total: <strong>{data.total_claims}</strong> claims across {data.pipeline.length} statuses
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.pipeline.map(row => {
          const pct = (row.count / maxCount) * 100
          const color = STATUS_COLORS[row.status] || '#0f3460'
          return (
            <div key={row.status}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.status.replace(/_/g, ' ')}</span>
                <span style={{ color: '#555' }}>
                  {row.count} claims · ${Math.round(row.total_estimated).toLocaleString()} estimated
                </span>
              </div>
              <div style={{ background: '#eef2f7', borderRadius: 6, height: 22, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 8, color: '#fff', fontSize: 12, fontWeight: 700, transition: 'width 0.5s'
                }}>{pct > 12 ? `${row.count}` : ''}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
