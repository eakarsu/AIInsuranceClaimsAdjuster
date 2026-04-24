import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchReportsSummary } from '../services/api.js'

function formatMoney(val) {
  if (!val && val !== 0) return '$0.00'
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReportsSummary()
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading">
          <div className="spinner" />
          <span className="loading-text">Loading reports...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reports-page">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const totalClaims = data.total_claims || 0
  const totalPolicies = data.total_policies || 0
  const totalCustomers = data.total_customers || 0
  const totalPayments = data.total_payments || 0
  const claimsByStatus = Array.isArray(data.claims_by_status) ? data.claims_by_status : []
  const claimsByType = Array.isArray(data.claims_by_type) ? data.claims_by_type : []
  const avgClaimAmount = data.average_claim_amount || 0
  const approvedClaims = data.approved_claims || 0
  const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100) : 0
  const fraudAlertRate = totalClaims > 0 ? ((data.total_fraud_alerts || 0) / totalClaims * 100) : 0

  return (
    <div className="reports-page">
      <Link to="/" className="back-link">← Back to Dashboard</Link>
      <h1>Reports & Analytics</h1>
      <p className="reports-subtitle">Executive dashboard overview</p>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-value">{totalClaims}</div>
          <div className="stat-label">Total Claims</div>
        </div>
        <div className="stat-card stat-info">
          <span className="stat-icon">📄</span>
          <div className="stat-value">{totalPolicies}</div>
          <div className="stat-label">Total Policies</div>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-icon">👥</span>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-icon">💳</span>
          <div className="stat-value">{totalPayments}</div>
          <div className="stat-label">Total Payments</div>
        </div>
      </div>

      <div className="reports-section">
        <h2>Key Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-value">{formatMoney(avgClaimAmount)}</span>
            <span className="metric-label">Avg Claim Amount</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{typeof approvalRate === 'number' ? approvalRate.toFixed(1) + '%' : approvalRate || 'N/A'}</span>
            <span className="metric-label">Approval Rate</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{typeof fraudAlertRate === 'number' ? fraudAlertRate.toFixed(1) + '%' : fraudAlertRate || 'N/A'}</span>
            <span className="metric-label">Fraud Alert Rate</span>
          </div>
        </div>
      </div>

      {claimsByStatus.length > 0 && (
        <div className="reports-section">
          <h2>Claims by Status</h2>
          <div className="reports-badges">
            {claimsByStatus.map((item) => (
              <div key={item.status} className="report-badge">
                <span className="report-badge-count">{item.count}</span>
                <span className="report-badge-label">{item.status.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {claimsByType.length > 0 && (
        <div className="reports-section">
          <h2>Claims by Type</h2>
          <div className="reports-badges">
            {claimsByType.map((item) => (
              <div key={item.type} className="report-badge">
                <span className="report-badge-count">{item.count}</span>
                <span className="report-badge-label">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
