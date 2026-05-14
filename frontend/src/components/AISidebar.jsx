import React, { useState, useEffect } from 'react'
import AIResultDisplay from './AIResultDisplay.jsx'
import { runAI, fetchItems } from '../services/api.js'

const aiTools = [
  {
    id: 'fraud-detection',
    name: 'Fraud Detection',
    icon: '🔍',
    description: 'Detect fraudulent claims',
    fields: [
      { key: 'claim_id', label: 'Select Claim', type: 'dynamic-select', source: 'claims', optionLabel: (c) => `CLM #${c.claim_number} - ${c.type} ($${Number(c.estimated_amount || 0).toLocaleString()})`, autoFill: (claim) => ({ claim_description: claim.description || '', claim_amount: claim.estimated_amount || '', claim_type: claim.type || '' }) },
      { key: 'claim_description', label: 'Claim Description', type: 'textarea' },
      { key: 'claim_amount', label: 'Claim Amount ($)', type: 'number' },
      { key: 'claim_type', label: 'Claim Type', type: 'select', options: ['Auto', 'Property', 'Health', 'Life', 'Commercial'] },
    ],
    samples: [
      { name: 'Suspicious Auto Claim', data: { claim_description: 'Driver claims vehicle was stolen from locked garage overnight. No signs of forced entry. Vehicle was found burned 50 miles away the next day. Insurance policy was increased 2 weeks prior to incident. Driver has 3 previous theft claims in last 5 years.', claim_amount: 75000, claim_type: 'Auto' } },
      { name: 'Water Damage Claim', data: { claim_description: 'Homeowner reports burst pipe causing flooding in basement. Damage to flooring, drywall, and personal belongings. Plumber confirms pipe was corroded. Home is 25 years old with original plumbing.', claim_amount: 18500, claim_type: 'Property' } },
      { name: 'Medical Claim Review', data: { claim_description: 'Patient claims injury from workplace accident. Multiple specialist visits and physical therapy sessions. Treatment duration of 8 months for a minor sprain seems excessive. Total bills exceed typical costs by 300%.', claim_amount: 45000, claim_type: 'Health' } },
    ]
  },
  {
    id: 'damage-assessment',
    name: 'Damage Assessment',
    icon: '💥',
    description: 'Estimate damage costs',
    fields: [
      { key: 'claim_id', label: 'Select Claim', type: 'dynamic-select', source: 'claims', optionLabel: (c) => `CLM #${c.claim_number} - ${c.type}`, autoFill: (claim) => ({ description: claim.description || '', location: claim.location || '' }) },
      { key: 'description', label: 'Damage Description', type: 'textarea' },
      { key: 'damage_type', label: 'Damage Type', type: 'select', options: ['Structural', 'Vehicle', 'Water', 'Fire', 'Electrical', 'Roof', 'Foundation', 'Interior'] },
      { key: 'location', label: 'Location', type: 'text' },
    ],
    samples: [
      { name: 'House Fire Damage', data: { description: 'Kitchen fire spread to dining room and living area. Cabinets, appliances, flooring destroyed. Smoke damage throughout entire first floor. Roof above kitchen partially collapsed. Electrical wiring compromised in affected areas.', damage_type: 'Fire', location: '456 Oak Drive, Denver, CO' } },
      { name: 'Vehicle Collision', data: { description: 'Front-end collision at 45mph. Hood crumpled, radiator destroyed, both headlights broken. Airbags deployed. Frame appears bent. Engine pushed back into firewall. Passenger door jammed shut.', damage_type: 'Vehicle', location: 'Interstate 95, Exit 42, Hartford, CT' } },
      { name: 'Storm Roof Damage', data: { description: 'Hailstorm caused significant damage to asphalt shingle roof. Multiple areas of missing and cracked shingles. Gutters dented and detached in 3 sections. Two skylights cracked. Water infiltration into attic space detected.', damage_type: 'Roof', location: '789 Maple Street, Oklahoma City, OK' } },
    ]
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    icon: '⚠️',
    description: 'Evaluate risk levels',
    fields: [
      { key: 'policy_id', label: 'Select Policy', type: 'dynamic-select', source: 'policies', optionLabel: (p) => `POL #${p.policy_number} - ${p.type} (Limit: $${Number(p.coverage_limit || 0).toLocaleString()})`, autoFill: (policy) => ({ policy_type: policy.type || '', coverage_amount: policy.coverage_limit || '' }) },
      { key: 'customer_info', label: 'Customer Info', type: 'textarea' },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['Auto', 'Home', 'Health', 'Life', 'Commercial'] },
      { key: 'coverage_amount', label: 'Coverage Amount ($)', type: 'number' },
    ],
    samples: [
      { name: 'High-Value Home Policy', data: { customer_info: 'Homeowner, age 55, owns $2.5M waterfront property in hurricane zone. Previous claims: 2 water damage claims in 3 years. Home built in 1998, partial roof replacement in 2020. No security system.', policy_type: 'Home', coverage_amount: 2500000 } },
      { name: 'Young Driver Auto', data: { customer_info: 'New driver, age 19, male. Sports car (2024 Mustang GT). No prior driving history. Lives in urban area with high theft rate. Commutes 45 miles daily. No defensive driving course completed.', policy_type: 'Auto', coverage_amount: 100000 } },
      { name: 'Small Business Commercial', data: { customer_info: 'Restaurant business, 3 years operating. Located in flood-prone area. 15 employees. Previous claim for kitchen fire. Annual revenue $800K. Building leased, not owned. Basic fire suppression system installed.', policy_type: 'Commercial', coverage_amount: 500000 } },
    ]
  },
  {
    id: 'settlement-recommendation',
    name: 'Settlement Recommendation',
    icon: '💰',
    description: 'Get AI settlement suggestions',
    fields: [
      { key: 'claim_id', label: 'Select Claim', type: 'dynamic-select', source: 'claims', optionLabel: (c) => `CLM #${c.claim_number} - ${c.type} ($${Number(c.estimated_amount || 0).toLocaleString()})`, autoFill: (claim) => ({ claim_description: claim.description || '', claim_amount: claim.estimated_amount || '' }) },
      { key: 'claim_description', label: 'Claim Description', type: 'textarea' },
      { key: 'claim_amount', label: 'Claim Amount ($)', type: 'number' },
      { key: 'policy_coverage', label: 'Policy Coverage ($)', type: 'number' },
      { key: 'damage_assessment', label: 'Damage Assessment Notes', type: 'textarea' },
    ],
    samples: [
      { name: 'Auto Total Loss', data: { claim_description: '2021 Toyota Camry totaled in intersection collision. Other driver found at fault. Vehicle fair market value $28,000. Owner has gap insurance. Rental car costs $1,200 so far. Minor whiplash injury, $3,500 in medical bills.', claim_amount: 32700, policy_coverage: 100000, damage_assessment: 'Vehicle is a total loss. Frame damage beyond repair. Fair market value confirmed at $28,000. Medical expenses documented and reasonable.' } },
      { name: 'Property Water Damage', data: { claim_description: 'Burst pipe flooded finished basement. Hardwood flooring warped in 800 sq ft area. Drywall damaged in 3 rooms. Home theater system destroyed. Personal belongings damaged including furniture and electronics.', claim_amount: 45000, policy_coverage: 500000, damage_assessment: 'Water damage confirmed. Flooring replacement needed: $12,000. Drywall repair: $5,000. Electronics replacement: $8,000. Furniture: $6,000. Labor and remediation: $14,000.' } },
    ]
  },
  {
    id: 'document-analysis',
    name: 'Document Analysis',
    icon: '📑',
    description: 'Extract info from documents',
    fields: [
      { key: 'document_id', label: 'Select Document', type: 'dynamic-select', source: 'documents', optionLabel: (d) => `DOC #${d.id} - ${d.document_type} (${d.file_name})`, autoFill: (doc) => ({ document_text: doc.content || '', document_type: doc.document_type || '' }) },
      { key: 'document_text', label: 'Document Text', type: 'textarea' },
      { key: 'document_type', label: 'Document Type', type: 'select', options: ['Police Report', 'Medical Report', 'Repair Estimate', 'Photos', 'Insurance Form', 'Witness Statement'] },
    ],
    samples: [
      { name: 'Police Report', data: { document_text: 'INCIDENT REPORT #2024-5678\nDate: March 15, 2024\nLocation: Intersection of Main St and 5th Ave\nOfficer: Sgt. Johnson, Badge #442\n\nAt approximately 2:35 PM, Vehicle 1 (2021 Honda Accord, driven by John Smith, DOB 05/12/1985) was traveling eastbound on Main St. Vehicle 2 (2019 Ford F-150, driven by Jane Doe, DOB 08/23/1990) ran a red light while heading northbound on 5th Ave, striking Vehicle 1 on the driver side. Both drivers were wearing seatbelts. Mr. Smith complained of neck pain and was transported to Memorial Hospital. Ms. Doe admitted to being distracted by her phone. Two witnesses confirmed Vehicle 2 ran the red light. Estimated damage to Vehicle 1: $15,000. Vehicle 2: $8,000.', document_type: 'Police Report' } },
      { name: 'Medical Report', data: { document_text: 'MEDICAL REPORT\nPatient: John Smith, Age 39\nDate of Service: March 15-20, 2024\nProvider: Dr. Sarah Chen, MD - Orthopedics\n\nChief Complaint: Neck and shoulder pain following motor vehicle accident.\n\nFindings: MRI reveals mild cervical disc herniation at C5-C6. Moderate soft tissue inflammation. Range of motion restricted 40% in cervical spine.\n\nTreatment Plan: Physical therapy 3x/week for 8 weeks. Prescribed muscle relaxants and anti-inflammatory medication. Follow-up in 6 weeks.\n\nPrognosis: Expected full recovery within 3-4 months with treatment compliance. No surgical intervention recommended at this time.\n\nTotal Charges: Initial visit $450, MRI $2,800, Medications $180, PT estimated $4,800.', document_type: 'Medical Report' } },
      { name: 'Repair Estimate', data: { document_text: 'AUTO REPAIR ESTIMATE\nShop: Premier Auto Body\nDate: March 18, 2024\nVehicle: 2021 Honda Accord EX-L\nVIN: 1HGCV1F34MA123456\n\nDamage Assessment:\n- Driver side door: Replace - $1,850\n- Driver side fender: Replace - $680\n- Side mirror assembly: Replace - $420\n- Door trim panel: Replace - $310\n- Paint and blend (3 panels): $1,200\n- Frame straightening: $2,400\n- Wheel alignment: $150\n- Labor (32 hours @ $85/hr): $2,720\n- Parts subtotal: $3,260\n- Miscellaneous hardware: $180\n\nSubtotal: $10,110\nTax: $525\nTOTAL ESTIMATE: $10,635\n\nEstimated completion: 12-15 business days\nRental car recommendation: Yes', document_type: 'Repair Estimate' } },
    ]
  },
  {
    id: 'policy-coverage',
    name: 'Policy Coverage Analysis',
    icon: '🛡️',
    description: 'Check policy coverage',
    fields: [
      { key: 'policy_id', label: 'Select Policy', type: 'dynamic-select', source: 'policies', optionLabel: (p) => `POL #${p.policy_number} - ${p.type} ($${Number(p.coverage_limit || 0).toLocaleString()})`, autoFill: (policy) => ({ policy_type: policy.type || '', coverage_details: `Type: ${policy.type}, Premium: $${policy.premium}, Deductible: $${policy.deductible}, Coverage Limit: $${policy.coverage_limit}, Status: ${policy.status}` }) },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['Auto', 'Home', 'Health', 'Life', 'Commercial'] },
      { key: 'coverage_details', label: 'Coverage Details', type: 'textarea' },
      { key: 'claim_description', label: 'Claim Description', type: 'textarea' },
    ],
    samples: [
      { name: 'Flood Damage (Home Policy)', data: { policy_type: 'Home', coverage_details: 'Standard homeowner policy HO-3. Coverage A (Dwelling): $350,000. Coverage B (Other Structures): $35,000. Coverage C (Personal Property): $175,000. Coverage D (Loss of Use): $70,000. Deductible: $1,000. No flood rider or endorsement.', claim_description: 'Heavy rainfall caused nearby river to overflow, flooding the first floor of the insured property. 6 inches of standing water for 48 hours. Damage to flooring, walls, appliances, and furniture. Estimated loss: $85,000.' } },
      { name: 'Rental Car Coverage (Auto)', data: { policy_type: 'Auto', coverage_details: 'Full coverage auto policy. Liability: 100/300/100. Collision: $500 deductible. Comprehensive: $250 deductible. Uninsured motorist: Yes. Medical payments: $5,000. NO rental reimbursement endorsement. NO gap coverage.', claim_description: 'Insured vehicle was rear-ended and needs 3 weeks of repair. Driver requesting rental car coverage at $45/day for the repair duration. Also claiming lost wages of $2,000 due to inability to commute.' } },
    ]
  },
  {
    id: 'customer-sentiment',
    name: 'Customer Sentiment',
    icon: '💬',
    description: 'Analyze customer communications',
    fields: [
      { key: 'customer_id', label: 'Select Customer', type: 'dynamic-select', source: 'customers', optionLabel: (c) => `${c.first_name} ${c.last_name} (${c.email || 'No email'})`, autoFill: (cust) => ({ customer_name: `${cust.first_name} ${cust.last_name}` }) },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'message', label: 'Message', type: 'textarea' },
      { key: 'channel', label: 'Channel', type: 'select', options: ['email', 'phone', 'chat', 'letter'] },
    ],
    samples: [
      { name: 'Angry Customer Email', data: { customer_name: 'Robert Thompson', message: 'This is absolutely unacceptable! I filed my claim THREE WEEKS ago and nobody has even bothered to call me back. My car is sitting in the shop and I am paying out of pocket for a rental. I have been a loyal customer for 12 years and this is how you treat me? I want to speak to a supervisor immediately or I am switching to another insurance company. This is the worst customer service I have ever experienced!', channel: 'email' } },
      { name: 'Satisfied Customer', data: { customer_name: 'Lisa Park', message: 'I just wanted to take a moment to thank your team, especially my adjuster Michael. He was incredibly professional and kept me informed throughout the entire claims process. The settlement was fair and processed within 10 days. After hearing horror stories from friends about their insurance companies, I am so glad I chose your company. I will definitely be recommending you to others.', channel: 'email' } },
      { name: 'Confused Customer Chat', data: { customer_name: 'David Martinez', message: "Hi, I'm not sure I understand my policy. I thought I had full coverage but when I filed a claim for my windshield crack, they said it wasn't covered? My deductible is $500 but the repair is only $350. Does that mean I have to pay the whole thing myself? Also, will filing this claim raise my rates? Maybe I should just pay out of pocket. I'm really confused about how all this works.", channel: 'chat' } },
    ]
  },
  {
    id: 'claims-forecasting',
    name: 'Claims Forecasting',
    icon: '📊',
    description: 'Predict future claims trends',
    fields: [
      { key: 'claim_type', label: 'Claim Type', type: 'select', options: ['Auto', 'Property', 'Health', 'Life', 'Commercial', 'All'] },
      { key: 'region', label: 'Region', type: 'select', options: ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'National'] },
      { key: 'time_period', label: 'Time Period', type: 'select', options: ['Next Month', 'Next Quarter', 'Next 6 Months', 'Next Year'] },
      { key: 'historical_context', label: 'Historical Context', type: 'textarea' },
    ],
    samples: [
      { name: 'Hurricane Season Forecast', data: { claim_type: 'Property', region: 'Southeast', time_period: 'Next 6 Months', historical_context: 'Last year saw 12 named hurricanes with 3 major ones hitting Florida and Louisiana. Property claims increased 340% during Aug-Oct. Average claim was $45,000. Currently 15,000 active policies in affected zones. NOAA predicts above-average hurricane season this year.' } },
      { name: 'Auto Claims National', data: { claim_type: 'Auto', region: 'National', time_period: 'Next Quarter', historical_context: 'Q1 saw 12,500 auto claims averaging $8,200 each. Distracted driving claims up 15% year-over-year. Winter weather claims declining as spring approaches. New teen driver policies up 8%. EV-related claims growing at 25% annually due to higher repair costs.' } },
      { name: 'Health Claims Annual', data: { claim_type: 'Health', region: 'National', time_period: 'Next Year', historical_context: 'Current year health claims total $45M across 8,000 claims. Average claim $5,625. Mental health claims increased 22% this year. Telehealth visits now account for 30% of primary care claims. Prescription drug costs rising 8% annually. New gene therapy treatments adding $50K+ per claim for rare conditions.' } },
    ]
  },
  {
    id: 'claim-analysis',
    name: 'Claim Analysis',
    icon: '📋',
    description: 'Deep analysis of any claim',
    fields: [
      { key: 'claim_id', label: 'Select Claim', type: 'dynamic-select', source: 'claims', optionLabel: (c) => `CLM #${c.claim_number} - ${c.type} (${c.status})`, autoFill: (claim) => ({ claim_number: claim.claim_number || '', claim_type: claim.type || '', description: claim.description || '', estimated_amount: claim.estimated_amount || '', status: claim.status || '' }) },
      { key: 'claim_number', label: 'Claim Number', type: 'text' },
      { key: 'claim_type', label: 'Claim Type', type: 'select', options: ['Auto Collision', 'Property Damage', 'Water Damage', 'Theft', 'Fire', 'Medical', 'Liability', 'Natural Disaster'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'estimated_amount', label: 'Estimated Amount ($)', type: 'number' },
      { key: 'status', label: 'Current Status', type: 'select', options: ['open', 'under_review', 'approved', 'denied', 'settled'] },
    ],
    samples: [
      { name: 'Complex Liability Claim', data: { claim_number: 'CLM-SAMPLE-001', claim_type: 'Liability', description: 'Slip and fall at insured commercial property. Customer claims wet floor without warning signs caused fall resulting in broken hip. Security camera footage is unclear. Witness statements are contradictory. Claimant is 72 years old with pre-existing osteoporosis. Medical bills total $67,000 and claimant is demanding $200,000 including pain and suffering.', estimated_amount: 200000, status: 'under_review' } },
      { name: 'Multi-Vehicle Accident', data: { claim_number: 'CLM-SAMPLE-002', claim_type: 'Auto Collision', description: '5-car pileup on highway during foggy conditions. Our insured was the 3rd vehicle. Police report indicates 1st vehicle braked suddenly. Damage to front and rear of insured vehicle. Three other drivers claiming against our insured. One driver hospitalized with serious injuries. Total exposure across all claims could exceed $500,000.', estimated_amount: 125000, status: 'open' } },
    ]
  },
  {
    id: 'policy-review',
    name: 'Policy Review',
    icon: '📄',
    description: 'AI policy evaluation & rating',
    fields: [
      { key: 'policy_id', label: 'Select Policy', type: 'dynamic-select', source: 'policies', optionLabel: (p) => `POL #${p.policy_number} - ${p.type} ($${Number(p.premium || 0).toLocaleString()}/yr)`, autoFill: (policy) => ({ policy_number: policy.policy_number || '', policy_type: policy.type || '', premium: policy.premium || '', coverage_limit: policy.coverage_limit || '', deductible: policy.deductible || '' }) },
      { key: 'policy_number', label: 'Policy Number', type: 'text' },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['Auto', 'Home', 'Health', 'Life', 'Commercial'] },
      { key: 'premium', label: 'Premium ($)', type: 'number' },
      { key: 'coverage_limit', label: 'Coverage Limit ($)', type: 'number' },
      { key: 'deductible', label: 'Deductible ($)', type: 'number' },
      { key: 'customer_info', label: 'Customer Info', type: 'textarea' },
    ],
    samples: [
      { name: 'Underinsured Home', data: { policy_number: 'POL-SAMPLE-001', policy_type: 'Home', premium: 1800, coverage_limit: 200000, deductible: 2500, customer_info: 'Property value: $450,000. Home built in 1985. Located in tornado alley. No recent renovations. Current coverage hasn\'t been updated in 8 years. Homeowner age 62, retired, fixed income. No umbrella policy.' } },
      { name: 'Commercial Fleet Policy', data: { policy_number: 'POL-SAMPLE-002', policy_type: 'Commercial', premium: 24000, coverage_limit: 1000000, deductible: 5000, customer_info: 'Delivery company with 12 vehicles. Drivers age 21-55. 3 at-fault accidents in past year. Operating in urban areas. Vehicles range from 2019-2024 models. No dash cameras installed. Basic driver training program only.' } },
    ]
  },
  {
    id: 'customer-analysis',
    name: 'Customer Analysis',
    icon: '👥',
    description: 'Customer risk & value analysis',
    fields: [
      { key: 'customer_id', label: 'Select Customer', type: 'dynamic-select', source: 'customers', optionLabel: (c) => `${c.first_name} ${c.last_name} - ${c.city || ''}, ${c.state || ''}`, autoFill: (cust) => ({ customer_name: `${cust.first_name} ${cust.last_name}` }) },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'total_policies', label: 'Total Policies', type: 'number' },
      { key: 'total_claims', label: 'Total Claims', type: 'number' },
      { key: 'claim_history', label: 'Claim History Summary', type: 'textarea' },
    ],
    samples: [
      { name: 'High-Value Customer', data: { customer_name: 'Patricia Wellington', total_policies: 5, total_claims: 1, claim_history: 'Customer since 2010. Holds auto, home, umbrella, jewelry rider, and boat policies. Total annual premiums: $18,500. Only 1 minor auto claim in 14 years ($2,300, not at fault). Credit score: 810. Referred 4 new customers. Always pays on time. Recently inquired about life insurance.' } },
      { name: 'Frequent Claimant', data: { customer_name: 'Marcus Johnson', total_policies: 2, total_claims: 7, claim_history: 'Customer since 2019. Holds auto and renters policies. Total annual premiums: $3,200. 7 claims in 5 years: 3 auto (2 at-fault), 2 theft, 1 water damage, 1 liability. Total claims paid: $89,000. Loss ratio: 556%. Last claim filed 2 months ago. Has been late on payments 4 times.' } },
      { name: 'New Customer Evaluation', data: { customer_name: 'Aisha Rahman', total_policies: 1, total_claims: 0, claim_history: 'Brand new customer, just purchased first auto policy. Age 28, clean driving record. Works as software engineer. Relocated from another state. Previous insurer for 6 years with zero claims. Credit score: 740. Interested in bundling with home insurance after upcoming house purchase.' } },
    ]
  },
  {
    id: 'adjuster-performance',
    name: 'Adjuster Performance',
    icon: '🔧',
    description: 'Evaluate adjuster performance',
    fields: [
      { key: 'adjuster_id', label: 'Select Adjuster', type: 'dynamic-select', source: 'adjusters', optionLabel: (a) => `${a.name} - ${a.specialization} (${a.experience_years}yr exp)`, autoFill: (adj) => ({ adjuster_name: adj.name || '', specialization: adj.specialization || '', experience_years: adj.experience_years || '' }) },
      { key: 'adjuster_name', label: 'Adjuster Name', type: 'text' },
      { key: 'specialization', label: 'Specialization', type: 'select', options: ['Auto', 'Property', 'Health', 'Life', 'Commercial', 'Marine', 'Workers Comp', 'General'] },
      { key: 'experience_years', label: 'Experience (Years)', type: 'number' },
      { key: 'total_claims_handled', label: 'Total Claims Handled', type: 'number' },
      { key: 'average_resolution_time', label: 'Avg Resolution (Days)', type: 'number' },
    ],
    samples: [
      { name: 'Top Performer', data: { adjuster_name: 'Sarah Mitchell', specialization: 'Auto', experience_years: 12, total_claims_handled: 847, average_resolution_time: 14 } },
      { name: 'New Adjuster Review', data: { adjuster_name: 'Kevin Park', specialization: 'Property', experience_years: 2, total_claims_handled: 45, average_resolution_time: 32 } },
      { name: 'Veteran Adjuster', data: { adjuster_name: 'Margaret O\'Brien', specialization: 'Commercial', experience_years: 22, total_claims_handled: 2100, average_resolution_time: 21 } },
    ]
  },
  {
    id: 'payment-analysis',
    name: 'Payment Analysis',
    icon: '💳',
    description: 'Detect payment anomalies',
    fields: [
      { key: 'claim_id', label: 'Select Related Claim', type: 'dynamic-select', source: 'claims', optionLabel: (c) => `CLM #${c.claim_number} - ${c.type}`, autoFill: (claim) => ({ claim_info: `Claim #${claim.claim_number}, Type: ${claim.type}, Amount: $${claim.estimated_amount}, Status: ${claim.status}` }) },
      { key: 'payment_details', label: 'Payment Details', type: 'textarea' },
      { key: 'total_amount', label: 'Total Amount ($)', type: 'number' },
      { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['Check', 'ACH', 'Wire Transfer', 'Direct Deposit'] },
      { key: 'claim_info', label: 'Related Claim Info', type: 'textarea' },
    ],
    samples: [
      { name: 'Suspicious Wire Transfer', data: { payment_details: 'Wire transfer of $95,000 to overseas bank account. Payee name does not match claimant. Payment requested to be expedited and processed before end of business day. Claim was filed only 5 days ago and investigation is still pending.', total_amount: 95000, payment_method: 'Wire Transfer', claim_info: 'Commercial property claim filed 5 days ago. Investigation ongoing. No adjuster assigned yet. Claimant demanding immediate payment.' } },
      { name: 'Normal Settlement Payment', data: { payment_details: 'Standard ACH payment for settled auto claim. Payee matches policyholder. Settlement amount within approved range. All documentation complete and verified. Adjuster approved.', total_amount: 12500, payment_method: 'ACH', claim_info: 'Auto collision claim CLM-2024-008. Filed 45 days ago. Investigation complete. Adjuster approved settlement. All repair receipts verified.' } },
    ]
  },
  {
    id: 'audit-analysis',
    name: 'Audit Analysis',
    icon: '📝',
    description: 'Analyze audit log patterns',
    fields: [
      { key: 'audit_entries', label: 'Audit Entries Summary', type: 'textarea' },
      { key: 'time_period', label: 'Time Period', type: 'select', options: ['Last 24 Hours', 'Last Week', 'Last Month', 'Last Quarter'] },
      { key: 'entity_type', label: 'Entity Type', type: 'select', options: ['All', 'Claims', 'Policies', 'Customers', 'Payments', 'Users'] },
    ],
    samples: [
      { name: 'Suspicious After-Hours Activity', data: { audit_entries: 'User john.smith accessed 47 customer records between 11PM-3AM. Modified 12 claim amounts. Exported customer list with SSNs. Changed 3 payment destinations. Accessed admin panel 8 times. Normal daily activity for this user is 15-20 records during business hours.', time_period: 'Last 24 Hours', entity_type: 'All' } },
      { name: 'Monthly Compliance Review', data: { audit_entries: 'Total actions: 15,234. Claims modified: 892. Policies updated: 456. Payments processed: 334. User logins: 1,245. Failed login attempts: 23. Admin actions: 89. Data exports: 12. Password resets: 34. New user accounts created: 5. Permission changes: 8.', time_period: 'Last Month', entity_type: 'All' } },
    ]
  },
  {
    id: 'smart-summary',
    name: 'Smart Summary',
    icon: '🧠',
    description: 'AI business intelligence summary',
    fields: [
      { key: 'data_type', label: 'Data Category', type: 'select', options: ['Claims', 'Policies', 'Customers', 'Payments', 'Fraud Alerts', 'Overall'] },
      { key: 'data_summary', label: 'Data Summary', type: 'textarea' },
      { key: 'count', label: 'Total Records', type: 'number' },
      { key: 'key_metrics', label: 'Key Metrics', type: 'textarea' },
    ],
    samples: [
      { name: 'Q1 Claims Summary', data: { data_type: 'Claims', data_summary: 'Q1 2024 claims data. 342 new claims filed (up 12% from Q1 2023). Auto claims: 45%, Property: 30%, Health: 15%, Other: 10%. Average processing time: 23 days. 78% resolved within SLA. Top regions: Southeast (28%), Northeast (24%), West (22%).', count: 342, key_metrics: 'Avg claim amount: $18,500. Total payout: $6.3M. Denial rate: 8%. Customer satisfaction: 4.2/5. Reopened claims: 3%. Litigation rate: 2%.' } },
      { name: 'Overall Business Health', data: { data_type: 'Overall', data_summary: 'Insurance portfolio overview. 12,500 active policies. 850 open claims. 45 adjusters on staff. Net premium income: $28M annually. Loss ratio: 62%. Combined ratio: 94%. Customer retention: 87%.', count: 12500, key_metrics: 'Policies growth: +8% YoY. Claims frequency: 6.8%. Average premium: $2,240. Customer lifetime value: $12,400. NPS score: 45. Fraud detection rate: 4.2%. Digital adoption: 65%.' } },
    ]
  },
  {
    id: 'auto-assign',
    name: 'Auto-Assign Adjuster',
    icon: '🎯',
    description: 'AI adjuster recommendation',
    fields: [
      { key: 'claim_type', label: 'Claim Type', type: 'select', options: ['Auto Collision', 'Property Damage', 'Water Damage', 'Theft', 'Fire', 'Medical', 'Liability', 'Natural Disaster'] },
      { key: 'claim_description', label: 'Claim Description', type: 'textarea' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['minor', 'moderate', 'severe', 'catastrophic'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'available_adjusters', label: 'Available Adjusters', type: 'dynamic-textarea-adjusters' },
    ],
    samples: [
      { name: 'Major Fire Claim', data: { claim_type: 'Fire', claim_description: 'Commercial warehouse fire causing total loss. Estimated damage $2.5M. Arson investigation pending. Multiple tenants affected. Business interruption claims expected from 3 businesses.', severity: 'catastrophic', location: 'Industrial District, Houston, TX' } },
      { name: 'Minor Auto Claim', data: { claim_type: 'Auto Collision', claim_description: 'Low-speed parking lot fender bender. Minor dent and paint scratch on rear bumper. No injuries. Both parties present and exchanged info. Clear liability on other driver.', severity: 'minor', location: 'Shopping Mall Parking Lot, Scottsdale, AZ' } },
    ]
  },
]

export default function AISidebar({ isOpen, onClose }) {
  const [selectedTool, setSelectedTool] = useState(null)
  const [formData, setFormData] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rateLimited, setRateLimited] = useState(false)
  const [uploadedPhoto, setUploadedPhoto] = useState(null) // { base64, mime_type, name }
  const [refData, setRefData] = useState({ claims: [], policies: [], customers: [], adjusters: [], documents: [] })

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen])

  const handleSelectTool = (tool) => {
    setSelectedTool(tool)
    setFormData({})
    setResult(null)
    setError('')
    setRateLimited(false)
    setUploadedPhoto(null)
  }

  const handleBack = () => {
    setSelectedTool(null)
    setResult(null)
    setError('')
    setRateLimited(false)
    setUploadedPhoto(null)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      const base64 = dataUrl.split(',')[1]
      setUploadedPhoto({ base64, mime_type: file.type, name: file.name })
    }
    reader.readAsDataURL(file)
  }

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setRateLimited(false)
    try {
      const cleaned = { ...formData }
      selectedTool.fields.forEach(f => {
        if (f.type === 'number' && cleaned[f.key] !== '' && cleaned[f.key] !== undefined) {
          cleaned[f.key] = Number(cleaned[f.key])
        }
      })
      // Attach photo for damage-assessment
      if (selectedTool.id === 'damage-assessment' && uploadedPhoto) {
        cleaned.image_base64 = uploadedPhoto.base64
        cleaned.mime_type = uploadedPhoto.mime_type
      }
      const res = await runAI(selectedTool.id, cleaned)
      if (res?.error && (res.error.includes('rate limit') || res.error.includes('429'))) {
        setRateLimited(true)
      } else {
        setResult(res)
      }
    } catch (err) {
      if (err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit')) {
        setRateLimited(true)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="ai-sidebar-overlay" onClick={onClose} />
      <div className="ai-sidebar">
        <div className="ai-sidebar-header">
          <div className="ai-sidebar-title">
            <span>🤖</span>
            <h2>AI Assistant</h2>
          </div>
          <button className="ai-sidebar-close" onClick={onClose}>&times;</button>
        </div>

        <div className="ai-sidebar-body">
          {!selectedTool ? (
            /* Tool selection list */
            <div className="ai-tools-list">
              <p className="ai-tools-subtitle">Select an AI tool to get started</p>
              {aiTools.map(tool => (
                <div key={tool.id} className="ai-tool-card" onClick={() => handleSelectTool(tool)}>
                  <span className="ai-tool-icon">{tool.icon}</span>
                  <div className="ai-tool-info">
                    <h4>{tool.name}</h4>
                    <p>{tool.description}</p>
                  </div>
                  <span className="ai-tool-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            /* Selected tool form & results */
            <div className="ai-tool-detail">
              <button className="ai-back-btn" onClick={handleBack}>← All AI Tools</button>
              <div className="ai-tool-header">
                <span className="ai-tool-icon-lg">{selectedTool.icon}</span>
                <div>
                  <h3>{selectedTool.name}</h3>
                  <p>{selectedTool.description}</p>
                </div>
              </div>

              {selectedTool.samples && selectedTool.samples.length > 0 && (
                <div className="ai-sample-buttons">
                  <span className="ai-sample-label">Load Sample:</span>
                  {selectedTool.samples.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-sample"
                      onClick={() => setFormData({ ...sample.data })}
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="ai-sidebar-form">
                {selectedTool.id === 'damage-assessment' && (
                  <div className="form-group">
                    <label>Photo Upload (optional — enables vision AI)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      style={{ padding: '6px' }}
                      onChange={handlePhotoUpload}
                    />
                    {uploadedPhoto && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#38a169', fontWeight: 600 }}>
                        Photo ready: {uploadedPhoto.name} — Vision AI will be used
                      </div>
                    )}
                  </div>
                )}
                {selectedTool.fields.map(field => (
                  <div key={field.key} className="form-group">
                    <label>{field.label}</label>
                    {field.type === 'dynamic-select' ? (
                      <select
                        className="form-select"
                        value={formData[field.key] || ''}
                        onChange={e => {
                          const val = e.target.value
                          if (field.autoFill && val) {
                            const item = refData[field.source]?.find(item => String(item.id) === String(val))
                            if (item) {
                              const filled = field.autoFill(item)
                              setFormData(prev => ({ ...prev, [field.key]: val, ...filled }))
                            } else {
                              setFormData(prev => ({ ...prev, [field.key]: val }))
                            }
                          } else {
                            setFormData(prev => ({ ...prev, [field.key]: val }))
                          }
                        }}
                      >
                        <option value="">Select {field.label}</option>
                        {(refData[field.source] || []).map(item => (
                          <option key={item.id} value={item.id}>{field.optionLabel(item)}</option>
                        ))}
                      </select>
                    ) : field.type === 'dynamic-textarea-adjusters' ? (
                      <textarea
                        className="form-textarea"
                        value={formData[field.key] || (refData.adjusters || []).map(a => `${a.name} (${a.specialization}, ${a.experience_years}yr exp, Rating: ${a.rating})`).join('\n')}
                        onChange={e => handleChange(field.key, e.target.value)}
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="form-select"
                        value={formData[field.key] || ''}
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
                        value={formData[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        className="form-input"
                        value={formData[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        step={field.type === 'number' ? 'any' : undefined}
                      />
                    )}
                  </div>
                ))}
                <button type="submit" className="btn btn-ai btn-full" disabled={loading}>
                  {loading ? 'Analyzing...' : `Run ${selectedTool.name}`}
                </button>
              </form>

              {loading && (
                <div className="ai-loading">
                  <div className="spinner" />
                  <p>AI is analyzing...</p>
                </div>
              )}

              {rateLimited && (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', padding: '12px 16px', borderRadius: 8, marginTop: 12, fontSize: 13 }}>
                  AI rate limit exceeded (20 requests/hour). Please wait before making another request.
                </div>
              )}
              {error && <div className="error-message">{error}</div>}

              {/* Structured damage assessment display */}
              {result && selectedTool.id === 'damage-assessment' && (result.damage_severity || result.severity || result.estimated_repair_cost || result.estimated_cost) ? (
                <div style={{ marginTop: 16 }}>
                  <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                    <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Damage Assessment Results</h4>
                    {(result.damage_severity || result.severity) && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Severity: </span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                          background: { minor: '#c6f6d5', moderate: '#fefcbf', severe: '#fed7d7', total_loss: '#feb2b2', catastrophic: '#fed7d7' }[result.damage_severity || result.severity] || '#e2e8f0',
                          color: { minor: '#276749', moderate: '#744210', severe: '#9b2c2c', total_loss: '#742a2a', catastrophic: '#9b2c2c' }[result.damage_severity || result.severity] || '#4a5568',
                        }}>
                          {(result.damage_severity || result.severity || '').replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                    {(result.estimated_repair_cost || result.estimated_cost) !== undefined && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>Estimated Cost: </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#2d3748' }}>${Number(result.estimated_repair_cost || result.estimated_cost || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {(result.damaged_components || result.damage_breakdown) && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Damaged Components:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {(result.damaged_components || (result.damage_breakdown || []).map(d => d.item || d)).map((item, i) => (
                            <li key={i} style={{ fontSize: 13 }}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.confidence_score !== undefined && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Confidence Score: {result.confidence_score}%</div>
                        <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${result.confidence_score}%`, background: result.confidence_score >= 70 ? '#38a169' : '#d69e2e', height: '100%' }} />
                        </div>
                      </div>
                    )}
                    {result.photos_needed && result.photos_needed.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Photos Needed:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {result.photos_needed.map((p, i) => <li key={i} style={{ fontSize: 13 }}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {(result.adjuster_notes || result.detailed_analysis) && (
                      <div style={{ marginTop: 8, padding: '10px 12px', background: '#ebf8ff', borderRadius: 6 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Adjuster Notes:</div>
                        <p style={{ fontSize: 13, margin: 0, color: '#2c5282' }}>{result.adjuster_notes || result.detailed_analysis}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : result ? (
                <AIResultDisplay result={result} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
