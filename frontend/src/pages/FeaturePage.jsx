import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchItems, createItem, updateItem, deleteItem, runAI } from '../services/api.js'
import AIResultDisplay from '../components/AIResultDisplay.jsx'

function formatMoney(val) {
  if (val === null || val === undefined || val === '') return '-'
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(val) {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return val
  }
}

function formatDateFull(val) {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return val
  }
}

function getBadgeClass(val) {
  if (!val) return 'badge'
  const v = String(val).toLowerCase().replace(/\s+/g, '_')
  return `badge badge-${v}`
}

function renderCellValue(value, col) {
  const v = value[col.key] !== undefined ? value[col.key] : (col.fallback ? value[col.fallback] : '')
  if (v === null || v === undefined || v === '') return '-'
  if (col.render === 'money') return <span className="money">{formatMoney(v)}</span>
  if (col.render === 'badge') return <span className={getBadgeClass(v)}>{String(v).replace(/_/g, ' ')}</span>
  if (col.render === 'date') return formatDate(v)
  return String(v)
}

function FormModal({ title, fields, initialData, onSubmit, onClose, refData, samples }) {
  const [formData, setFormData] = useState(() => {
    const data = {}
    fields.forEach(f => {
      let val = initialData ? initialData[f.key] : ''
      if (f.type === 'date' && val) {
        val = val.substring(0, 10)
      }
      data[f.key] = val !== undefined && val !== null ? val : ''
    })
    return data
  })

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleaned = { ...formData }
    fields.forEach(f => {
      if (f.type === 'number' && cleaned[f.key] !== '') {
        cleaned[f.key] = Number(cleaned[f.key])
      }
    })
    onSubmit(cleaned)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {samples && samples.length > 0 && (
            <div className="ai-sample-buttons">
              <span className="ai-sample-label">Load Sample:</span>
              {samples.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-sample"
                  onClick={() => setFormData(prev => ({ ...prev, ...sample.data }))}
                >
                  {sample.name}
                </button>
              ))}
            </div>
          )}
          <div className="modal-body">
            {fields.map(field => (
              <div key={field.key} className="form-group">
                <label>{field.label}</label>
                {field.type === 'dynamic-select' ? (
                  <select
                    className="form-select"
                    value={formData[field.key] || ''}
                    onChange={e => {
                      const val = e.target.value
                      if (field.autoFill && val && refData) {
                        const item = refData[field.source]?.find(it => String(it.id) === String(val))
                        if (item) {
                          const filled = field.autoFill(item)
                          setFormData(prev => ({ ...prev, [field.key]: val, ...filled }))
                          return
                        }
                      }
                      handleChange(field.key, val)
                    }}
                  >
                    <option value="">Select {field.label}</option>
                    {(refData?.[field.source] || []).map(item => (
                      <option key={item.id} value={item.id}>{field.optionLabel ? field.optionLabel(item) : `#${item.id}`}</option>
                    ))}
                  </select>
                ) : field.type === 'select' ? (
                  <select
                    className="form-select"
                    value={formData[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="form-textarea"
                    value={formData[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    className="form-input"
                    value={formData[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    step={field.type === 'number' ? 'any' : undefined}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DetailModal({ item, config, onClose, onEdit, onDelete }) {
  if (!item) return null
  const allKeys = Object.keys(item)
  const longKeys = ['description', 'content', 'message', 'details', 'factors', 'recommendation', 'indicators', 'address', 'notes']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <h2>{config.title} Details</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-view">
            {allKeys.map(key => {
              let val = item[key]
              const isLong = longKeys.some(lk => key.includes(lk))
              // Format display
              let display = val
              if (val === null || val === undefined) display = '-'
              else if (key.includes('amount') || key.includes('cost') || key.includes('premium') || key.includes('coverage_limit') || key.includes('deductible')) {
                display = formatMoney(val)
              } else if (key.includes('date') || key === 'created_at' || key === 'updated_at') {
                display = formatDateFull(val)
              } else if (typeof val === 'object') {
                display = JSON.stringify(val, null, 2)
              } else {
                display = String(val)
              }

              return (
                <div key={key} className={`detail-row${isLong ? ' full-width' : ''}`}>
                  <label>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                  {(key === 'status' || key === 'priority' || key === 'severity' || key === 'risk_level' || key === 'sentiment')
                    ? <span className={getBadgeClass(val)}>{String(val || '-').replace(/_/g, ' ')}</span>
                    : <span>{display}</span>
                  }
                </div>
              )
            })}
          </div>
          {!config.readOnly && (
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => onEdit(item)}>Edit</button>
              <button className="btn btn-danger" onClick={() => onDelete(item)}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3>Confirm Action</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function FeaturePage({ config }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showAIForm, setShowAIForm] = useState(false)
  const [aiResult, setAIResult] = useState(null)
  const [aiLoading, setAILoading] = useState(false)
  const [aiError, setAIError] = useState('')
  const [rateLimitError, setRateLimitError] = useState(false)
  const [refData, setRefData] = useState({ claims: [], policies: [], customers: [], adjusters: [], documents: [] })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [workflowResult, setWorkflowResult] = useState(null)

  useEffect(() => {
    const extract = (d) => Array.isArray(d) ? d : (d?.data || [])
    Promise.all([
      fetchItems('claims?page=1&limit=100').catch(() => []),
      fetchItems('policies').catch(() => []),
      fetchItems('customers?page=1&limit=100').catch(() => []),
      fetchItems('adjusters').catch(() => []),
      fetchItems('documents').catch(() => []),
    ]).then(([claims, policies, customers, adjusters, documents]) => {
      setRefData({
        claims: extract(claims),
        policies: extract(policies),
        customers: extract(customers),
        adjusters: extract(adjusters),
        documents: extract(documents),
      })
    })
  }, [])

  const [auditFilters, setAuditFilters] = useState({ action: '', entity_type: '', date_from: '', date_to: '' })

  const loadItems = async (page = 1, filters = auditFilters) => {
    if (!config.endpoint) return
    setLoading(true)
    setError('')
    try {
      let url = `${config.endpoint}?page=${page}&limit=20`
      if (config.endpoint === 'audit-log') {
        if (filters.action) url += `&action=${encodeURIComponent(filters.action)}`
        if (filters.entity_type) url += `&entity_type=${encodeURIComponent(filters.entity_type)}`
        if (filters.date_from) url += `&date_from=${encodeURIComponent(filters.date_from)}`
        if (filters.date_to) url += `&date_to=${encodeURIComponent(filters.date_to)}`
      }
      const data = await fetchItems(url)
      if (data && data.data && data.pagination) {
        setItems(data.data)
        setPagination(data.pagination)
      } else {
        setItems(Array.isArray(data) ? data : (data.data || []))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // Reset state when config changes
    setDetailItem(null)
    setShowForm(false)
    setEditItem(null)
    setAIResult(null)
    setShowAIForm(false)
  }, [config.endpoint, config.title])

  const handleCreate = async (data) => {
    try {
      await createItem(config.endpoint, data)
      setShowForm(false)
      loadItems()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleUpdate = async (data) => {
    try {
      await updateItem(config.endpoint, editItem.id, data)
      setEditItem(null)
      setDetailItem(null)
      loadItems()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteItem(config.endpoint, confirmDelete.id)
      setConfirmDelete(null)
      setDetailItem(null)
      loadItems()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleAI = async (data) => {
    setShowAIForm(false)
    setAILoading(true)
    setAIError('')
    setAIResult(null)
    setRateLimitError(false)
    try {
      const result = await runAI(config.aiFeature, data)
      if (result?.error && result.error.includes('rate limit')) {
        setRateLimitError(true)
      } else {
        setAIResult(result)
      }
    } catch (err) {
      if (err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit')) {
        setRateLimitError(true)
      } else {
        setAIError(err.message)
      }
    } finally {
      setAILoading(false)
    }
  }

  const handleWorkflowAction = async (claimId, action) => {
    setWorkflowLoading(true)
    setWorkflowResult(null)
    try {
      const result = await fetch(`/api/claims/${claimId}/workflow-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ action }),
      }).then(r => r.json())
      setWorkflowResult(result)
      loadItems(pagination.page)
      if (detailItem) setDetailItem(prev => prev ? { ...prev, status: result.new_status } : prev)
    } catch (err) {
      alert('Workflow error: ' + err.message)
    } finally {
      setWorkflowLoading(false)
    }
  }

  const getNextWorkflowAction = (status) => {
    const map = { open: 'triage', under_review: 'assess', approved: 'settle', settled: 'close' }
    return map[status] || null
  }

  // AI-only page (like Claims Forecasting)
  if (config.aiOnly) {
    return (
      <div className="feature-page">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <div className="feature-header">
          <h1>{config.title}</h1>
        </div>
        <div className="ai-only-page">
          <p>Use AI to generate predictions and insights</p>
          <button className="btn btn-ai" onClick={() => setShowAIForm(true)}>
            {config.aiLabel || 'Run AI Analysis'}
          </button>
        </div>

        {aiLoading && (
          <div className="ai-loading">
            <div className="spinner" />
            <p>AI is analyzing your request...</p>
          </div>
        )}
        {aiError && <div className="error-message">{aiError}</div>}
        {aiResult && <AIResultDisplay result={aiResult} />}

        {showAIForm && (
          <FormModal
            title={config.aiLabel || 'AI Analysis'}
            fields={config.aiFields}
            onSubmit={handleAI}
            onClose={() => setShowAIForm(false)}
            refData={refData}
            samples={config.aiSamples}
          />
        )}
      </div>
    )
  }

  return (
    <div className="feature-page">
      <Link to="/" className="back-link">← Back to Dashboard</Link>
      <div className="feature-header">
        <h1>{config.title}</h1>
        <div className="feature-header-actions">
          {config.aiFeature && (
            <button className="btn btn-ai" onClick={() => setShowAIForm(true)}>
              {config.aiLabel || 'Run AI Analysis'}
            </button>
          )}
          {config.endpoint && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + New {config.title.replace(/s$/, '')}
            </button>
          )}
        </div>
      </div>

      {/* Audit log filters */}
      {config.endpoint === 'audit-log' && (
        <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Action Type</label>
            <input
              type="text"
              placeholder="e.g. POST, PUT"
              value={auditFilters.action}
              onChange={e => setAuditFilters(f => ({ ...f, action: e.target.value }))}
              style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Entity Type</label>
            <input
              type="text"
              placeholder="e.g. claims, customers"
              value={auditFilters.entity_type}
              onChange={e => setAuditFilters(f => ({ ...f, entity_type: e.target.value }))}
              style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>From Date</label>
            <input
              type="date"
              value={auditFilters.date_from}
              onChange={e => setAuditFilters(f => ({ ...f, date_from: e.target.value }))}
              style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>To Date</label>
            <input
              type="date"
              value={auditFilters.date_to}
              onChange={e => setAuditFilters(f => ({ ...f, date_to: e.target.value }))}
              style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={() => loadItems(1, auditFilters)}
          >
            Filter
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={() => { const f = { action: '', entity_type: '', date_from: '', date_to: '' }; setAuditFilters(f); loadItems(1, f) }}
          >
            Clear
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {rateLimitError && (
        <div className="error-message" style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
          AI rate limit exceeded (20/hour). Please wait before making another AI request.
        </div>
      )}

      {aiLoading && (
        <div className="ai-loading">
          <div className="spinner" />
          <p>AI is analyzing your request...</p>
        </div>
      )}
      {aiError && <div className="error-message">{aiError}</div>}
      {aiResult && <AIResultDisplay result={aiResult} />}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span className="loading-text">Loading {config.title.toLowerCase()}...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No {config.title.toLowerCase()} found</p>
          <p style={{ fontSize: '0.9rem' }}>Create one to get started</p>
        </div>
      ) : (
        <div className="feature-table-wrapper">
          <table className="feature-table">
            <thead>
              <tr>
                {config.columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} onClick={() => { setDetailItem(item); setWorkflowResult(null) }}>
                  {config.columns.map(col => (
                    <td key={col.key}>{renderCellValue(item, col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0' }}>
              <button className="btn btn-secondary" disabled={pagination.page <= 1} onClick={() => loadItems(pagination.page - 1)}>Prev</button>
              <span style={{ fontSize: 14, color: '#718096' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => loadItems(pagination.page + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <FormModal
          title={`New ${config.title.replace(/s$/, '')}`}
          fields={config.formFields}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {editItem && (
        <FormModal
          title={`Edit ${config.title.replace(/s$/, '')}`}
          fields={config.formFields}
          initialData={editItem}
          onSubmit={handleUpdate}
          onClose={() => setEditItem(null)}
        />
      )}

      {detailItem && !editItem && (
        <>
          <DetailModal
            item={detailItem}
            config={config}
            onClose={() => { setDetailItem(null); setWorkflowResult(null) }}
            onEdit={(item) => setEditItem(item)}
            onDelete={(item) => setConfirmDelete(item)}
          />
          {config.endpoint === 'claims' && (
            <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 24px', zIndex: 1100, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: 400 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <strong style={{ fontSize: 14 }}>Claim Workflow</strong>
                <span className={getBadgeClass(detailItem.status)}>{String(detailItem.status || '-').replace(/_/g, ' ')}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['triage', 'investigate', 'assess', 'settle', 'close'].map(action => (
                  <button
                    key={action}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '4px 12px', textTransform: 'capitalize' }}
                    disabled={workflowLoading}
                    onClick={() => handleWorkflowAction(detailItem.id, action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
              {workflowLoading && <div style={{ marginTop: 8, fontSize: 13, color: '#718096' }}>Processing workflow action...</div>}
              {workflowResult && (
                <div style={{ marginTop: 12, fontSize: 13 }}>
                  <div>Status updated to: <span className={getBadgeClass(workflowResult.new_status)}>{workflowResult.new_status?.replace(/_/g, ' ')}</span></div>
                  {workflowResult.ai_result && (
                    <div style={{ marginTop: 8, background: '#f0fff4', borderRadius: 6, padding: '8px 12px' }}>
                      <strong>AI Result:</strong>
                      {workflowResult.ai_result.risk_score !== undefined && <div>Risk Score: {workflowResult.ai_result.risk_score} ({workflowResult.ai_result.risk_level})</div>}
                      {workflowResult.ai_result.recommended_amount !== undefined && <div>Recommended Settlement: ${Number(workflowResult.ai_result.recommended_amount).toLocaleString()}</div>}
                      {workflowResult.ai_result.severity && <div>Damage Severity: {workflowResult.ai_result.severity}</div>}
                      {workflowResult.ai_result.estimated_cost !== undefined && <div>Estimated Cost: ${Number(workflowResult.ai_result.estimated_cost).toLocaleString()}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Are you sure you want to delete this ${config.title.replace(/s$/, '').toLowerCase()}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showAIForm && (
        <FormModal
          title={config.aiLabel || 'AI Analysis'}
          fields={config.aiFields}
          onSubmit={handleAI}
          onClose={() => setShowAIForm(false)}
          refData={refData}
          samples={config.aiSamples}
        />
      )}
    </div>
  )
}
