import React, { useEffect, useState } from 'react'
import { fetchItems } from '../services/api.js'

function token() { return localStorage.getItem('token') }

export default function SettlementLetterPDF() {
  const [claims, setClaims] = useState([])
  const [claimId, setClaimId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [sender, setSender] = useState('')
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchItems('claims?page=1&limit=100')
      .then(d => setClaims(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setClaims([]))
  }, [])

  const generate = async () => {
    setErr(''); setResult(null); setLoading(true)
    try {
      const r = await fetch('/api/custom-views/settlement-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          claim_id: Number(claimId),
          settlement_amount: amount === '' ? undefined : Number(amount),
          notes,
          sender_name: sender,
        })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed')
      setResult(j)
    } catch (e) {
      setErr(e.message)
    } finally { setLoading(false) }
  }

  const openInNewWindow = () => {
    if (!result?.html) return
    const w = window.open('', '_blank')
    if (w) { w.document.write(result.html); w.document.close() }
  }

  return (
    <div data-testid="settlement-letter-pdf" style={{
      background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ marginBottom: 4, color: '#0f3460' }}>Settlement Letter PDF Generator</h3>
      <p style={{ color: '#7f8c8d', fontSize: 13, marginBottom: 16 }}>
        Generate a print-ready settlement letter for any claim.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Claim</label>
          <select value={claimId} onChange={e => setClaimId(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginTop: 4 }}>
            <option value="">— Select a claim —</option>
            {claims.map(c => (
              <option key={c.id} value={c.id}>
                CLM #{c.claim_number} — {c.type} (${Number(c.estimated_amount || 0).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Settlement Amount (optional override)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Defaults to approved/estimated amount"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginTop: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Sender Name (optional)</label>
          <input value={sender} onChange={e => setSender(e.target.value)} placeholder="Defaults to assigned adjuster"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginTop: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Adjuster Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes for the letter"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cfd8dc', marginTop: 4 }} />
        </div>
      </div>
      <button onClick={generate} disabled={!claimId || loading}
        data-testid="generate-letter-btn"
        style={{
          background: '#0f3460', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 6, cursor: claimId ? 'pointer' : 'not-allowed',
          opacity: claimId ? 1 : 0.5, fontWeight: 600,
        }}>
        {loading ? 'Generating...' : 'Generate Letter'}
      </button>
      {err && <div style={{ color: '#c00', marginTop: 12, fontSize: 13 }}>Error: {err}</div>}
      {result && (
        <div style={{ marginTop: 16, padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <strong>Letter generated</strong> for claim {result.claim_number} —
            recipient: {result.summary?.recipient}, amount: ${Number(result.settlement_amount).toLocaleString()}
          </div>
          <button onClick={openInNewWindow}
            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Open in new tab (printable)
          </button>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13 }}>Preview HTML inline</summary>
            <iframe title="letter" srcDoc={result.html} style={{ width: '100%', height: 600, border: '1px solid #cfd8dc', marginTop: 8 }} />
          </details>
        </div>
      )}
    </div>
  )
}
