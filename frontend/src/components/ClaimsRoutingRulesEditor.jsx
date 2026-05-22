import React, { useEffect, useState } from 'react'
import { fetchItems } from '../services/api.js'

function token() { return localStorage.getItem('token') }

const SEVERITIES = ['minor', 'moderate', 'severe', 'catastrophic']
const SEV_COLORS = {
  minor: '#27ae60', moderate: '#f39c12', severe: '#e67e22', catastrophic: '#e74c3c',
}

export default function ClaimsRoutingRulesEditor() {
  const [rules, setRules] = useState([])
  const [adjusters, setAdjusters] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [draft, setDraft] = useState({ severity: 'minor', adjuster_id: '', min_amount: 0, max_amount: 50000, priority: 1, active: true, notes: '' })
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/custom-views/routing-rules', { headers: { Authorization: `Bearer ${token()}` } })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load')
      setRules(j.data || [])
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    fetchItems('adjusters').then(d => setAdjusters(Array.isArray(d) ? d : (d?.data || []))).catch(() => setAdjusters([]))
  }, [])

  const create = async () => {
    setErr('')
    try {
      const r = await fetch('/api/custom-views/routing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          ...draft,
          adjuster_id: draft.adjuster_id ? Number(draft.adjuster_id) : null,
          min_amount: Number(draft.min_amount), max_amount: Number(draft.max_amount), priority: Number(draft.priority),
        })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Create failed')
      setDraft({ severity: 'minor', adjuster_id: '', min_amount: 0, max_amount: 50000, priority: 1, active: true, notes: '' })
      load()
    } catch (e) { setErr(e.message) }
  }

  const saveEdit = async (id) => {
    setErr('')
    try {
      const r = await fetch(`/api/custom-views/routing-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editDraft),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Update failed')
      setEditingId(null); setEditDraft({}); load()
    } catch (e) { setErr(e.message) }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return
    setErr('')
    try {
      const r = await fetch(`/api/custom-views/routing-rules/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || 'Delete failed')
      }
      load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div data-testid="routing-rules-editor" style={{
      background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ marginBottom: 4, color: '#0f3460' }}>Claims Routing Rules</h3>
      <p style={{ color: '#7f8c8d', fontSize: 13, marginBottom: 16 }}>
        Map claim severity to adjusters based on amount range and priority.
      </p>

      {err && <div style={{ background: '#fde2e2', color: '#a02020', padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{err}</div>}

      {/* Create form */}
      <div style={{ border: '1px dashed #cfd8dc', padding: 12, borderRadius: 8, marginBottom: 16, background: '#fafbfc' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#0f3460' }}>+ New Rule</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <select value={draft.severity} onChange={e => setDraft({ ...draft, severity: e.target.value })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #cfd8dc' }}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={draft.adjuster_id} onChange={e => setDraft({ ...draft, adjuster_id: e.target.value })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #cfd8dc' }}>
            <option value="">— adjuster —</option>
            {adjusters.map(a => <option key={a.id} value={a.id}>{a.name} ({a.specialization})</option>)}
          </select>
          <input type="number" placeholder="min $" value={draft.min_amount}
            onChange={e => setDraft({ ...draft, min_amount: e.target.value })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #cfd8dc' }} />
          <input type="number" placeholder="max $" value={draft.max_amount}
            onChange={e => setDraft({ ...draft, max_amount: e.target.value })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #cfd8dc' }} />
          <input type="number" placeholder="priority" value={draft.priority}
            onChange={e => setDraft({ ...draft, priority: e.target.value })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #cfd8dc' }} />
          <input placeholder="notes" value={draft.notes}
            onChange={e => setDraft({ ...draft, notes: e.target.value })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #cfd8dc', gridColumn: 'span 2' }} />
          <button onClick={create} data-testid="create-rule-btn"
            style={{ background: '#0f3460', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Add
          </button>
        </div>
      </div>

      {loading ? <div>Loading rules...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f7fa' }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Severity</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Adjuster</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Min $</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Max $</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Priority</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Active</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Notes</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => editingId === r.id ? (
              <tr key={r.id} style={{ borderBottom: '1px solid #eef2f7', background: '#fffbea' }}>
                <td style={{ padding: 6 }}>
                  <select value={editDraft.severity ?? r.severity} onChange={e => setEditDraft({ ...editDraft, severity: e.target.value })}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ padding: 6 }}>
                  <select value={editDraft.adjuster_id ?? r.adjuster_id ?? ''} onChange={e => setEditDraft({ ...editDraft, adjuster_id: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">— adjuster —</option>
                    {adjusters.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td style={{ padding: 6 }}>
                  <input type="number" defaultValue={r.min_amount} onChange={e => setEditDraft({ ...editDraft, min_amount: Number(e.target.value) })} style={{ width: 80 }} />
                </td>
                <td style={{ padding: 6 }}>
                  <input type="number" defaultValue={r.max_amount} onChange={e => setEditDraft({ ...editDraft, max_amount: Number(e.target.value) })} style={{ width: 80 }} />
                </td>
                <td style={{ padding: 6, textAlign: 'center' }}>
                  <input type="number" defaultValue={r.priority} onChange={e => setEditDraft({ ...editDraft, priority: Number(e.target.value) })} style={{ width: 50 }} />
                </td>
                <td style={{ padding: 6, textAlign: 'center' }}>
                  <input type="checkbox" defaultChecked={r.active} onChange={e => setEditDraft({ ...editDraft, active: e.target.checked })} />
                </td>
                <td style={{ padding: 6 }}>
                  <input defaultValue={r.notes || ''} onChange={e => setEditDraft({ ...editDraft, notes: e.target.value })} style={{ width: '100%' }} />
                </td>
                <td style={{ padding: 6, textAlign: 'center' }}>
                  <button onClick={() => saveEdit(r.id)} style={{ marginRight: 4, background: '#27ae60', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => { setEditingId(null); setEditDraft({}) }} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={r.id} style={{ borderBottom: '1px solid #eef2f7' }}>
                <td style={{ padding: 8 }}>
                  <span style={{
                    background: SEV_COLORS[r.severity] || '#888', color: '#fff',
                    padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700, textTransform: 'capitalize'
                  }}>{r.severity}</span>
                </td>
                <td style={{ padding: 8 }}>{r.adjuster_name || '—'}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>${Number(r.min_amount).toLocaleString()}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>${Number(r.max_amount).toLocaleString()}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>{r.priority}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>{r.active ? 'Yes' : 'No'}</td>
                <td style={{ padding: 8, color: '#666' }}>{r.notes || '—'}</td>
                <td style={{ padding: 8, textAlign: 'center' }}>
                  <button onClick={() => { setEditingId(r.id); setEditDraft({}) }}
                    style={{ marginRight: 4, background: '#3498db', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => remove(r.id)}
                    style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#888' }}>No rules yet — create one above</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
