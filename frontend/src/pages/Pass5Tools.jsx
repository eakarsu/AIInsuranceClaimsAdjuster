import React, { useEffect, useState } from 'react'

/* Apply pass 5: 4-tab page covering customer portal, adjuster field workflow,
   reinsurance reporting, and integration status. */
const API = '/api'
function headers() {
  const h = { 'Content-Type': 'application/json' }
  const t = localStorage.getItem('token')
  if (t) h['Authorization'] = `Bearer ${t}`
  return h
}

async function call(method, path, body) {
  const opts = { method, headers: headers() }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${API}${path}`, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) throw Object.assign(new Error(data?.error || res.statusText), { status: res.status, body: data })
  return data
}

export default function Pass5Tools() {
  const [tab, setTab] = useState('portal')
  return (
    <div style={{ padding: 16 }}>
      <h2>Pass 5 Tools</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['portal', 'field', 'reinsurance', 'integrations'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 12px', background: tab === t ? '#222' : '#fff', color: tab === t ? '#fff' : '#222', border: '1px solid #ccc' }}>{t}</button>
        ))}
      </div>
      {tab === 'portal' && <Portal />}
      {tab === 'field' && <Field />}
      {tab === 'reinsurance' && <Reinsurance />}
      {tab === 'integrations' && <Integrations />}
    </div>
  )
}

function Portal() {
  const [claimId, setClaimId] = useState('')
  const [status, setStatus] = useState(null)
  const [docs, setDocs] = useState([])
  const [error, setError] = useState(null)
  async function load() {
    setError(null)
    try {
      const s = await call('GET', `/customer-portal/claims/${claimId}/status`)
      setStatus(s)
      const d = await call('GET', `/customer-portal/documents?claim_id=${claimId}`)
      setDocs(d.documents || [])
    } catch (e) { setError(e.message) }
  }
  return (
    <div>
      <h3>Customer Portal</h3>
      <input value={claimId} onChange={e => setClaimId(e.target.value)} placeholder="Claim ID" />
      <button onClick={load}>Load</button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {status && <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(status, null, 2)}</pre>}
      <h4>Documents ({docs.length})</h4>
      <ul>{docs.map(d => <li key={d.id}>{d.title || d.external_url}</li>)}</ul>
    </div>
  )
}

function Field() {
  const [adjusterId, setAdjusterId] = useState('')
  const [queue, setQueue] = useState([])
  const [error, setError] = useState(null)
  async function load() {
    setError(null)
    try { const r = await call('GET', `/adjuster-field/queue?adjuster_id=${adjusterId}`); setQueue(r.queue || []) }
    catch (e) { setError(e.message) }
  }
  return (
    <div>
      <h3>Adjuster Field Queue</h3>
      <input value={adjusterId} onChange={e => setAdjusterId(e.target.value)} placeholder="Adjuster ID" />
      <button onClick={load}>Load Queue</button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>{queue.map(c => <li key={c.id}>#{c.id} {c.claim_number} — {c.status} — {c.claim_type}</li>)}</ul>
    </div>
  )
}

function Reinsurance() {
  const [ym, setYm] = useState('2025-01')
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  async function run() {
    setError(null)
    try { const r = await call('GET', `/reinsurance/cession-report?year_month=${ym}`); setReport(r) }
    catch (e) { setError(e.message) }
  }
  return (
    <div>
      <h3>Reinsurance Cession Report</h3>
      <input value={ym} onChange={e => setYm(e.target.value)} placeholder="YYYY-MM" />
      <button onClick={run}>Run</button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {report && <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(report.summary, null, 2)}</pre>}
    </div>
  )
}

function Integrations() {
  const [status, setStatus] = useState(null)
  useEffect(() => { call('GET', '/integrations/status').then(setStatus).catch(() => {}) }, [])
  if (!status) return <div>Loading...</div>
  return (
    <div>
      <h3>Integration Status</h3>
      <ul>{Object.entries(status).map(([k, v]) => <li key={k}>{k}: {v ? 'configured' : 'NOT configured (returns 503)'}</li>)}</ul>
      <p>See <code>_BACKLOG_NEEDS_CREDS.md</code>.</p>
    </div>
  )
}
