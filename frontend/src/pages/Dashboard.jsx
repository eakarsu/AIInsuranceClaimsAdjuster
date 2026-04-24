import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchReportsSummary } from '../services/api.js'

const cards = [
  { title: 'Claims Management', desc: 'Track and manage insurance claims', icon: '📋', route: '/claims', key: 'claims' },
  { title: 'Policy Management', desc: 'Manage insurance policies', icon: '📄', route: '/policies', key: 'policies' },
  { title: 'Customer Management', desc: 'Manage policyholders', icon: '👥', route: '/customers', key: 'customers' },
  { title: 'Adjuster Management', desc: 'Manage claims adjusters', icon: '🔧', route: '/adjusters', key: 'adjusters' },
  { title: 'AI Fraud Detection', desc: 'AI-powered fraud analysis', icon: '🔍', route: '/fraud-detection', key: 'fraudAlerts', ai: true },
  { title: 'AI Damage Assessment', desc: 'AI damage cost estimation', icon: '💥', route: '/damage-assessment', key: 'damageAssessments', ai: true },
  { title: 'AI Risk Assessment', desc: 'AI risk evaluation', icon: '⚠️', route: '/risk-assessment', key: 'riskAssessments', ai: true },
  { title: 'AI Settlement Recommendation', desc: 'AI settlement suggestions', icon: '💰', route: '/settlement-recommendation', key: 'settlements', ai: true },
  { title: 'AI Document Analysis', desc: 'AI document extraction', icon: '📑', route: '/document-analysis', key: 'documents', ai: true },
  { title: 'AI Policy Coverage', desc: 'AI coverage analysis', icon: '🛡️', route: '/policy-coverage', key: 'policies', ai: true },
  { title: 'AI Customer Sentiment', desc: 'AI sentiment analysis', icon: '💬', route: '/customer-sentiment', key: 'communications', ai: true },
  { title: 'AI Claims Forecasting', desc: 'AI predictive analytics', icon: '📊', route: '/claims-forecasting', ai: true },
  { title: 'Payments & Settlements', desc: 'Track payments', icon: '💳', route: '/payments', key: 'payments' },
  { title: 'Audit Log', desc: 'System activity log', icon: '📝', route: '/audit-log', key: 'auditLog' },
  { title: 'Reports & Analytics', desc: 'Dashboard analytics', icon: '📈', route: '/reports' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({})

  useEffect(() => {
    fetchReportsSummary()
      .then(data => setSummary(data))
      .catch(() => {})
  }, [])

  const getCount = (key) => {
    if (!key || !summary) return null
    // Try various key formats
    const val = summary[key] || summary[key + 'Count'] || summary['total_' + key]
    if (typeof val === 'number') return val
    if (summary.counts && typeof summary.counts[key] === 'number') return summary.counts[key]
    return null
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="dashboard-subtitle">Welcome to the AI Insurance Claims Adjuster platform</p>
      <div className="dashboard-grid">
        {cards.map((card) => (
          <div
            key={card.route}
            className={`dashboard-card${card.ai ? ' ai-card' : ''}`}
            onClick={() => navigate(card.route)}
          >
            <span className="card-icon">{card.icon}</span>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            {getCount(card.key) !== null && (
              <span className="card-count">{getCount(card.key)} records</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
