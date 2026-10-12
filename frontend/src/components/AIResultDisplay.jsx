import React from 'react'
import AIReport from './AIReport.jsx'

// Use one structured renderer for immediate results and saved reports.
export default function AIResultDisplay({ result }) {
  if (result === null || result === undefined) return null
  return <AIReport response={result} title="AI analysis result" />
}
