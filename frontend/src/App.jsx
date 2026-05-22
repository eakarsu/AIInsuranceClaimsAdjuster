import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FeaturePage from './pages/FeaturePage.jsx'
import Reports from './pages/Reports.jsx'
import AdvancedAITools from './pages/AdvancedAITools.jsx'
import Pass5Tools from './pages/Pass5Tools.jsx'
import AISidebar from './components/AISidebar.jsx'
import { features } from './pages/features.js'
import CustomViewsPage from './pages/CustomViewsPage.jsx'
import ClaimSeverityLeakageAudit from './pages/ClaimSeverityLeakageAudit.jsx'

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticClaimsTriageAutoRoutingBy from './pages/CfAgenticClaimsTriageAutoRoutingBy';
import CfComputerVisionDamageAssessmentFromM from './pages/CfComputerVisionDamageAssessmentFromM';
import CfFraudRingDetectionCorrelatingClaims from './pages/CfFraudRingDetectionCorrelatingClaims';
import CfPredictiveSettlementOptimizationModel from './pages/CfPredictiveSettlementOptimizationModel';
import CfAdjusterWorkloadBalancingUsingCapaci from './pages/CfAdjusterWorkloadBalancingUsingCapaci';
import CfCustomerLtvRetentionPredictingPostC from './pages/CfCustomerLtvRetentionPredictingPostC';
import GapNoSubrogationRecoveryOptimizer from './pages/GapNoSubrogationRecoveryOptimizer';
import GapNoReserveEstimationAi from './pages/GapNoReserveEstimationAi';
import GapNoLitigationOutcomePredictor from './pages/GapNoLitigationOutcomePredictor';
import GapNoImageBasedVehicleDamageEstimator from './pages/GapNoImageBasedVehicleDamageEstimator';
import GapNoWebhookSurfaceForFnolIngestion from './pages/GapNoWebhookSurfaceForFnolIngestion';
import GapNoMobilePushNotificationsForField from './pages/GapNoMobilePushNotificationsForField';
import GapNoESignatureForSettlements from './pages/GapNoESignatureForSettlements';
import GapNoNotificationsModule0References from './pages/GapNoNotificationsModule0References';
import GapNoWebsocketRealTimeClaimFeed from './pages/GapNoWebsocketRealTimeClaimFeed';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function Navbar({ onToggleAI }) {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  if (!token || location.pathname === '/login') return null

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-icon">🛡️</span>
        AI Insurance Claims Adjuster
      </Link>
      <div className="navbar-links">
        <Link to="/" className="navbar-link">Dashboard</Link>
        <Link to="/claims" className="navbar-link">Claims</Link>
        <Link to="/policies" className="navbar-link">Policies</Link>
        <Link to="/reports" className="navbar-link">Reports</Link>
        <Link to="/custom-views" className="navbar-link" data-testid="nav-claims-views">Claims Views</Link>
        <Link to="/advanced-ai" className="navbar-link">Advanced AI</Link>
        <button onClick={onToggleAI} className="btn btn-ai-nav">🤖 AI Assistant</button>
        <button onClick={handleLogout} className="btn btn-logout">Logout</button>
      </div>
    </nav>
  )
}

function AppContent() {
  const [aiSidebarOpen, setAISidebarOpen] = useState(false)

  return (
    <>
      <Navbar onToggleAI={() => setAISidebarOpen(true)} />
      <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/claims" element={<ProtectedRoute><FeaturePage config={features.claims} /></ProtectedRoute>} />
        <Route path="/policies" element={<ProtectedRoute><FeaturePage config={features.policies} /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><FeaturePage config={features.customers} /></ProtectedRoute>} />
        <Route path="/adjusters" element={<ProtectedRoute><FeaturePage config={features.adjusters} /></ProtectedRoute>} />
        <Route path="/fraud-detection" element={<ProtectedRoute><FeaturePage config={features.fraudDetection} /></ProtectedRoute>} />
        <Route path="/damage-assessment" element={<ProtectedRoute><FeaturePage config={features.damageAssessment} /></ProtectedRoute>} />
        <Route path="/risk-assessment" element={<ProtectedRoute><FeaturePage config={features.riskAssessment} /></ProtectedRoute>} />
        <Route path="/settlement-recommendation" element={<ProtectedRoute><FeaturePage config={features.settlementRecommendation} /></ProtectedRoute>} />
        <Route path="/document-analysis" element={<ProtectedRoute><FeaturePage config={features.documentAnalysis} /></ProtectedRoute>} />
        <Route path="/policy-coverage" element={<ProtectedRoute><FeaturePage config={features.policyCoverage} /></ProtectedRoute>} />
        <Route path="/customer-sentiment" element={<ProtectedRoute><FeaturePage config={features.customerSentiment} /></ProtectedRoute>} />
        <Route path="/claims-forecasting" element={<ProtectedRoute><FeaturePage config={features.claimsForecasting} /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><FeaturePage config={features.payments} /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute><FeaturePage config={features.auditLog} /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/advanced-ai" element={<ProtectedRoute><AdvancedAITools /></ProtectedRoute>} />
        <Route path="/pass5-tools" element={<ProtectedRoute><Pass5Tools /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
        <Route path="/claim-severity-leakage-audit" element={<ProtectedRoute><ClaimSeverityLeakageAudit /></ProtectedRoute>} />
      
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-claims-triage-auto-routing-by" element={<CfAgenticClaimsTriageAutoRoutingBy />} />
          <Route path="/cf-computer-vision-damage-assessment-from-m" element={<CfComputerVisionDamageAssessmentFromM />} />
          <Route path="/cf-fraud-ring-detection-correlating-claims-" element={<CfFraudRingDetectionCorrelatingClaims />} />
          <Route path="/cf-predictive-settlement-optimization-model" element={<CfPredictiveSettlementOptimizationModel />} />
          <Route path="/cf-adjuster-workload-balancing-using-capaci" element={<CfAdjusterWorkloadBalancingUsingCapaci />} />
          <Route path="/cf-customer-ltv-retention-predicting-post-c" element={<CfCustomerLtvRetentionPredictingPostC />} />
          <Route path="/gap-no-subrogation-recovery-optimizer" element={<GapNoSubrogationRecoveryOptimizer />} />
          <Route path="/gap-no-reserve-estimation-ai" element={<GapNoReserveEstimationAi />} />
          <Route path="/gap-no-litigation-outcome-predictor" element={<GapNoLitigationOutcomePredictor />} />
          <Route path="/gap-no-image-based-vehicle-damage-estimator" element={<GapNoImageBasedVehicleDamageEstimator />} />
          <Route path="/gap-no-webhook-surface-for-fnol-ingestion" element={<GapNoWebhookSurfaceForFnolIngestion />} />
          <Route path="/gap-no-mobile-push-notifications-for-field" element={<GapNoMobilePushNotificationsForField />} />
          <Route path="/gap-no-e-signature-for-settlements" element={<GapNoESignatureForSettlements />} />
          <Route path="/gap-no-notifications-module-0-references" element={<GapNoNotificationsModule0References />} />
          <Route path="/gap-no-websocket-real-time-claim-feed" element={<GapNoWebsocketRealTimeClaimFeed />} />
</Routes>

      <AISidebar isOpen={aiSidebarOpen} onClose={() => setAISidebarOpen(false)} />

      {/* Floating AI button - visible on all pages when logged in */}
      <AIFloatingButton onClick={() => setAISidebarOpen(true)} />
    </>
  )
}

function AIFloatingButton({ onClick }) {
  const location = useLocation()
  const token = localStorage.getItem('token')
  if (!token || location.pathname === '/login') return null

  return (
    <button className="ai-floating-btn" onClick={onClick} title="Open AI Assistant">
      🤖
    </button>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
