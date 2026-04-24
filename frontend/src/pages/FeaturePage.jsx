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
  const [refData, setRefData] = useState({ claims: [], policies: [], customers: [], adjusters: [], documents: [] })

  useEffect(() => {
    Promise.all([
      fetchItems('claims').catch(() => []),
      fetchItems('policies').catch(() => []),
      fetchItems('customers').catch(() => []),
      fetchItems('adjusters').catch(() => []),
      fetchItems('documents').catch(() => []),
    ]).then(([claims, policies, customers, adjusters, documents]) => {
      setRefData({
        claims: Array.isArray(claims) ? claims : [],
        policies: Array.isArray(policies) ? policies : [],
        customers: Array.isArray(customers) ? customers : [],
        adjusters: Array.isArray(adjusters) ? adjusters : [],
        documents: Array.isArray(documents) ? documents : [],
      })
    })
  }, [])

  const loadItems = async () => {
    if (!config.endpoint) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchItems(config.endpoint)
      setItems(Array.isArray(data) ? data : (data.data || data.items || []))
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
    try {
      const result = await runAI(config.aiFeature, data)
      setAIResult(result)
    } catch (err) {
      setAIError(err.message)
    } finally {
      setAILoading(false)
    }
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

      {error && <div className="error-message">{error}</div>}

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
                <tr key={item.id || idx} onClick={() => setDetailItem(item)}>
                  {config.columns.map(col => (
                    <td key={col.key}>{renderCellValue(item, col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        <DetailModal
          item={detailItem}
          config={config}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => setEditItem(item)}
          onDelete={(item) => setConfirmDelete(item)}
        />
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
