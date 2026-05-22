import React, { useEffect, useState } from 'react'

export default function ClaimSeverityLeakageAudit() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/api/claim-severity-leakage-audit').then(r => r.json()).then(setData).catch(() => {}) }, [])
  return <div className="page"><h1>Claim Severity Leakage Audit</h1><p>Finds reserve leakage by severity band and supplement pattern.</p>{data?.claims?.map(c => <section className="card" key={c.claim}><h2>{c.claim}</h2><p>{c.action} - leakage ${c.leakage} - score {c.leakage_score}</p></section>)}</div>
}
