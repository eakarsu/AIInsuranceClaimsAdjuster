require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./db');

async function seed() {
  const client = await pool.connect();

  try {
    // Initialize tables
    await initDB();

    // Truncate all tables in reverse dependency order
    await client.query(`
      TRUNCATE audit_log, payments, communications, documents, settlements,
        risk_assessments, damage_assessments, fraud_alerts, claims,
        adjusters, policies, customers, users RESTART IDENTITY CASCADE;
    `);

    console.log('Tables truncated');

    // 1. Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@insurance.com', $1, 'Admin User', 'admin'),
      ('adjuster@insurance.com', $1, 'John Smith', 'adjuster'),
      ('manager@insurance.com', $1, 'Sarah Johnson', 'manager')
    `, [hashedPassword]);
    console.log('Users seeded');

    // 2. Customers (15)
    await client.query(`
      INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip, date_of_birth) VALUES
      ('James', 'Wilson', 'james.wilson@email.com', '555-0101', '123 Oak Street', 'Austin', 'TX', '78701', '1985-03-15'),
      ('Maria', 'Garcia', 'maria.garcia@email.com', '555-0102', '456 Pine Ave', 'Miami', 'FL', '33101', '1990-07-22'),
      ('Robert', 'Chen', 'robert.chen@email.com', '555-0103', '789 Maple Dr', 'San Francisco', 'CA', '94102', '1978-11-08'),
      ('Sarah', 'Thompson', 'sarah.thompson@email.com', '555-0104', '321 Elm St', 'Chicago', 'IL', '60601', '1992-01-30'),
      ('Michael', 'Brown', 'michael.brown@email.com', '555-0105', '654 Cedar Ln', 'New York', 'NY', '10001', '1988-05-12'),
      ('Jennifer', 'Davis', 'jennifer.davis@email.com', '555-0106', '987 Birch Rd', 'Seattle', 'WA', '98101', '1995-09-18'),
      ('David', 'Martinez', 'david.martinez@email.com', '555-0107', '147 Walnut St', 'Denver', 'CO', '80201', '1982-12-03'),
      ('Emily', 'Anderson', 'emily.anderson@email.com', '555-0108', '258 Spruce Ave', 'Portland', 'OR', '97201', '1993-04-25'),
      ('William', 'Taylor', 'william.taylor@email.com', '555-0109', '369 Ash Blvd', 'Phoenix', 'AZ', '85001', '1975-08-14'),
      ('Jessica', 'Lee', 'jessica.lee@email.com', '555-0110', '471 Poplar Dr', 'Boston', 'MA', '02101', '1991-06-07'),
      ('Christopher', 'Harris', 'christopher.harris@email.com', '555-0111', '582 Willow Way', 'Nashville', 'TN', '37201', '1987-02-19'),
      ('Amanda', 'Clark', 'amanda.clark@email.com', '555-0112', '693 Hickory Ct', 'Atlanta', 'GA', '30301', '1994-10-28'),
      ('Daniel', 'Rodriguez', 'daniel.rodriguez@email.com', '555-0113', '804 Cypress Pl', 'Dallas', 'TX', '75201', '1980-07-11'),
      ('Ashley', 'Lewis', 'ashley.lewis@email.com', '555-0114', '915 Magnolia St', 'Charlotte', 'NC', '28201', '1996-03-09'),
      ('Matthew', 'Walker', 'matthew.walker@email.com', '555-0115', '126 Redwood Ave', 'Minneapolis', 'MN', '55401', '1983-11-22')
    `);
    console.log('Customers seeded');

    // 3. Adjusters (15)
    await client.query(`
      INSERT INTO adjusters (name, email, phone, specialization, license_number, experience_years, status, rating) VALUES
      ('Robert Miller', 'r.miller@insurance.com', '555-1001', 'Auto', 'ADJ-2024-001', 12, 'active', 4.8),
      ('Patricia White', 'p.white@insurance.com', '555-1002', 'Property', 'ADJ-2024-002', 8, 'active', 4.5),
      ('Thomas Jackson', 't.jackson@insurance.com', '555-1003', 'Health', 'ADJ-2024-003', 15, 'active', 4.9),
      ('Linda Martin', 'l.martin@insurance.com', '555-1004', 'Life', 'ADJ-2024-004', 20, 'active', 4.7),
      ('Charles Moore', 'c.moore@insurance.com', '555-1005', 'Commercial', 'ADJ-2024-005', 6, 'active', 4.2),
      ('Barbara Taylor', 'b.taylor@insurance.com', '555-1006', 'Marine', 'ADJ-2024-006', 10, 'active', 4.6),
      ('Joseph Anderson', 'j.anderson@insurance.com', '555-1007', 'Workers Comp', 'ADJ-2024-007', 25, 'active', 5.0),
      ('Susan Thomas', 's.thomas@insurance.com', '555-1008', 'Auto', 'ADJ-2024-008', 3, 'active', 3.8),
      ('Mark Hernandez', 'm.hernandez@insurance.com', '555-1009', 'Property', 'ADJ-2024-009', 7, 'active', 4.3),
      ('Nancy King', 'n.king@insurance.com', '555-1010', 'Health', 'ADJ-2024-010', 11, 'active', 4.4),
      ('Steven Wright', 's.wright@insurance.com', '555-1011', 'Commercial', 'ADJ-2024-011', 18, 'active', 4.8),
      ('Karen Lopez', 'k.lopez@insurance.com', '555-1012', 'Life', 'ADJ-2024-012', 5, 'active', 4.0),
      ('Paul Hill', 'p.hill@insurance.com', '555-1013', 'Auto', 'ADJ-2024-013', 9, 'inactive', 3.5),
      ('Donna Scott', 'd.scott@insurance.com', '555-1014', 'Property', 'ADJ-2024-014', 14, 'active', 4.6),
      ('George Adams', 'g.adams@insurance.com', '555-1015', 'Workers Comp', 'ADJ-2024-015', 2, 'active', 3.9)
    `);
    console.log('Adjusters seeded');

    // 4. Policies (15)
    await client.query(`
      INSERT INTO policies (policy_number, customer_id, type, premium, deductible, coverage_limit, start_date, end_date, status) VALUES
      ('POL-2024-001', 1, 'Auto', 1200.00, 500.00, 100000.00, '2024-01-01', '2025-01-01', 'active'),
      ('POL-2024-002', 2, 'Home', 2400.00, 1000.00, 500000.00, '2024-02-15', '2025-02-15', 'active'),
      ('POL-2024-003', 3, 'Health', 3600.00, 2000.00, 1000000.00, '2024-01-01', '2025-01-01', 'active'),
      ('POL-2024-004', 4, 'Life', 800.00, 0.00, 2000000.00, '2024-03-01', '2034-03-01', 'active'),
      ('POL-2024-005', 5, 'Commercial', 5000.00, 5000.00, 1500000.00, '2024-04-01', '2025-04-01', 'active'),
      ('POL-2024-006', 6, 'Auto', 950.00, 250.00, 75000.00, '2024-05-01', '2025-05-01', 'active'),
      ('POL-2024-007', 7, 'Home', 1800.00, 1500.00, 400000.00, '2024-06-01', '2025-06-01', 'active'),
      ('POL-2024-008', 8, 'Health', 2800.00, 3000.00, 750000.00, '2024-01-01', '2025-01-01', 'active'),
      ('POL-2024-009', 9, 'Auto', 1500.00, 750.00, 150000.00, '2024-07-01', '2025-07-01', 'active'),
      ('POL-2024-010', 10, 'Home', 3200.00, 2500.00, 800000.00, '2024-08-01', '2025-08-01', 'active'),
      ('POL-2024-011', 11, 'Commercial', 4500.00, 4000.00, 1200000.00, '2024-09-01', '2025-09-01', 'active'),
      ('POL-2024-012', 12, 'Life', 600.00, 0.00, 500000.00, '2024-10-01', '2034-10-01', 'active'),
      ('POL-2024-013', 13, 'Auto', 1100.00, 500.00, 100000.00, '2024-11-01', '2025-11-01', 'expired'),
      ('POL-2024-014', 14, 'Home', 2100.00, 1000.00, 350000.00, '2024-03-15', '2025-03-15', 'active'),
      ('POL-2024-015', 15, 'Health', 3000.00, 1500.00, 900000.00, '2024-01-01', '2025-01-01', 'cancelled')
    `);
    console.log('Policies seeded');

    // 5. Claims (15)
    await client.query(`
      INSERT INTO claims (claim_number, policy_id, customer_id, adjuster_id, type, description, incident_date, filed_date, status, estimated_amount, approved_amount, location, priority) VALUES
      ('CLM-2024-001', 1, 1, 1, 'Auto Collision', 'Rear-end collision at intersection of Main St and 5th Ave. Other driver ran a red light causing significant front-end damage to the insured vehicle.', '2024-06-15', '2024-06-16', 'open', 12500.00, NULL, 'Austin, TX', 'high'),
      ('CLM-2024-002', 2, 2, 2, 'Property Damage', 'Severe water damage to basement and first floor due to burst pipe during winter freeze. Affected drywall, flooring, and electrical systems.', '2024-07-01', '2024-07-02', 'under_review', 45000.00, NULL, 'Miami, FL', 'high'),
      ('CLM-2024-003', 3, 3, 3, 'Medical', 'Emergency room visit and subsequent surgery for appendicitis. Includes hospital stay of 3 days, surgical fees, and medication.', '2024-05-20', '2024-05-22', 'approved', 28000.00, 25000.00, 'San Francisco, CA', 'medium'),
      ('CLM-2024-004', 5, 5, 5, 'Commercial Liability', 'Customer slipped on wet floor in retail store, sustaining a broken wrist and contusions. Incident captured on security cameras.', '2024-08-10', '2024-08-11', 'under_review', 35000.00, NULL, 'New York, NY', 'high'),
      ('CLM-2024-005', 6, 6, 1, 'Auto Collision', 'Side-impact collision in parking lot. Minor damage to passenger door and side panel. No injuries reported.', '2024-09-05', '2024-09-06', 'approved', 3500.00, 3200.00, 'Seattle, WA', 'low'),
      ('CLM-2024-006', 7, 7, 2, 'Water Damage', 'Flooding from heavy rainstorm caused water intrusion through roof. Damaged attic insulation, ceiling drywall in two bedrooms, and personal belongings.', '2024-09-15', '2024-09-16', 'open', 22000.00, NULL, 'Denver, CO', 'medium'),
      ('CLM-2024-007', 9, 9, 8, 'Auto Theft', 'Vehicle stolen from apartment complex parking garage overnight. 2022 Honda Accord, all factory equipment. Police report filed.', '2024-10-01', '2024-10-02', 'under_review', 28000.00, NULL, 'Phoenix, AZ', 'high'),
      ('CLM-2024-008', 10, 10, 9, 'Fire Damage', 'Kitchen fire caused by faulty electrical wiring spread to dining room. Significant damage to kitchen cabinets, appliances, and structural elements.', '2024-10-10', '2024-10-11', 'open', 85000.00, NULL, 'Boston, MA', 'critical'),
      ('CLM-2024-009', 11, 11, 11, 'Commercial Property', 'Storm damage to commercial warehouse roof. Multiple leaks causing inventory damage. Estimated 2000 sq ft of roofing needs replacement.', '2024-10-20', '2024-10-21', 'approved', 120000.00, 110000.00, 'Nashville, TN', 'critical'),
      ('CLM-2024-010', 14, 14, 14, 'Property Damage', 'Hailstorm caused extensive damage to roof shingles, siding, and two skylights. Vehicle in driveway also sustained windshield damage.', '2024-11-01', '2024-11-02', 'open', 18000.00, NULL, 'Charlotte, NC', 'medium'),
      ('CLM-2024-011', 1, 1, 1, 'Auto Glass', 'Windshield cracked by road debris on highway I-35. Full windshield replacement needed including recalibration of ADAS sensors.', '2024-11-10', '2024-11-11', 'approved', 1200.00, 1100.00, 'Austin, TX', 'low'),
      ('CLM-2024-012', 8, 8, 3, 'Medical', 'Outpatient surgery for torn ACL sustained during recreational activity. Includes MRI, surgery, physical therapy sessions.', '2024-11-15', '2024-11-16', 'under_review', 42000.00, NULL, 'Portland, OR', 'medium'),
      ('CLM-2024-013', 13, 13, 8, 'Auto Collision', 'Multi-vehicle accident on highway during rainstorm. Extensive front and rear damage. Two passengers with minor injuries requiring ER visit.', '2024-11-20', '2024-11-21', 'denied', 55000.00, 0.00, 'Dallas, TX', 'high'),
      ('CLM-2024-014', 2, 2, 2, 'Theft', 'Break-in through rear window. Electronics, jewelry, and personal items stolen. Total value of stolen items estimated with receipts and appraisals.', '2024-12-01', '2024-12-02', 'open', 15000.00, NULL, 'Miami, FL', 'medium'),
      ('CLM-2024-015', 4, 4, 4, 'Life Insurance', 'Death benefit claim for policyholder. All required documentation including death certificate and beneficiary verification submitted.', '2024-12-05', '2024-12-06', 'under_review', 150000.00, NULL, 'Chicago, IL', 'critical')
    `);
    console.log('Claims seeded');

    // 6. Fraud Alerts (15)
    await client.query(`
      INSERT INTO fraud_alerts (claim_id, risk_score, indicators, ai_analysis, status, reviewed_by) VALUES
      (1, 25.00, 'First claim on policy, consistent documentation', 'Low risk. Claim appears legitimate with police report and witness statements supporting the incident description. No prior claims history raises no concerns.', 'reviewed', 'Admin User'),
      (2, 45.00, 'High claim amount relative to property value, filed during extreme weather event', 'Moderate risk. While the weather event is verified, the estimated damage amount is higher than typical for similar incidents. Recommend field inspection.', 'pending', NULL),
      (3, 15.00, 'Medical records consistent, established patient history', 'Low risk. Medical records from hospital confirm diagnosis and treatment. Insurance history shows no pattern of medical claims abuse.', 'reviewed', 'John Smith'),
      (4, 60.00, 'Liability claim with limited witness corroboration, high amount for described injuries', 'Elevated risk. Security camera footage should be reviewed. The claimed injury severity seems disproportionate to the described incident. Recommend investigation.', 'under_review', NULL),
      (5, 18.00, 'Minor claim, consistent with described incident', 'Low risk. Damage consistent with parking lot collision. Repair estimate from certified body shop is reasonable.', 'reviewed', 'Admin User'),
      (6, 35.00, 'Claim filed during known severe weather period, reasonable amount', 'Moderate risk. Weather records confirm heavy rainfall in the area. However, pre-existing roof condition should be verified to determine if maintenance neglect contributed.', 'pending', NULL),
      (7, 72.00, 'Vehicle theft with limited evidence, no forced entry signs, policy recently increased', 'High risk. Policy coverage was increased just 2 months before the theft. No signs of forced entry to the parking garage. GPS tracking data should be requested.', 'under_review', NULL),
      (8, 30.00, 'Fire cause under investigation, consistent with electrical fault claim', 'Moderate risk. Fire department report indicates electrical origin consistent with claim. No accelerants detected. Property was not recently insured.', 'pending', NULL),
      (9, 20.00, 'Commercial claim with documented storm damage, multiple businesses affected', 'Low risk. NWS confirms severe storm in the area. Multiple businesses in the same industrial park filed similar claims. Damage is consistent with storm patterns.', 'reviewed', 'Sarah Johnson'),
      (10, 28.00, 'Weather-related claim with regional verification', 'Low-moderate risk. Hailstorm confirmed by weather service. Damage pattern consistent with hail. Multiple claims from the same neighborhood support legitimacy.', 'reviewed', 'John Smith'),
      (11, 12.00, 'Minor glass claim, common occurrence', 'Very low risk. Windshield damage from road debris is extremely common. Repair estimate is within normal range. No concerns identified.', 'reviewed', 'Admin User'),
      (12, 40.00, 'Medical claim with delayed filing, recreational injury', 'Moderate risk. There was a 1-day delay in filing. Recreational injuries are sometimes difficult to verify. MRI results should be reviewed for pre-existing conditions.', 'pending', NULL),
      (13, 85.00, 'Multiple claims in short period, inconsistent damage descriptions, policy expired', 'Critical risk. This is the second claim on the same policy within 6 months. Damage descriptions from witnesses conflict with claimant statement. Policy had lapsed at time of incident.', 'under_review', NULL),
      (14, 55.00, 'Theft claim with high-value items, limited proof of ownership', 'Elevated risk. Some claimed items lack receipts or appraisals. The break-in method seems inconsistent with the security system in place. Recommend detailed inventory verification.', 'pending', NULL),
      (15, 22.00, 'Life claim with complete documentation, natural cause of death', 'Low risk. Death certificate from accredited hospital confirms natural cause. Policy has been active for appropriate period. Beneficiary designation is clear and uncontested.', 'pending', NULL)
    `);
    console.log('Fraud alerts seeded');

    // 7. Damage Assessments (15)
    await client.query(`
      INSERT INTO damage_assessments (claim_id, damage_type, severity, estimated_cost, ai_analysis, photos_reviewed, repair_timeline) VALUES
      (1, 'Vehicle', 'moderate', 12500.00, 'Front-end damage assessment shows bumper, hood, and radiator damage. Frame appears intact. Airbags not deployed. Repair is economically viable at approximately 45% of vehicle value.', 8, '2-3 weeks'),
      (2, 'Water', 'severe', 45000.00, 'Extensive water damage to basement level and first floor. Affected areas include drywall (approx 800 sq ft), hardwood flooring (600 sq ft), electrical panel, and HVAC ductwork. Mold remediation will be necessary.', 15, '6-8 weeks'),
      (3, 'Medical', 'moderate', 28000.00, 'Surgical intervention for acute appendicitis with 3-day hospital stay. Costs include emergency room ($3,500), surgery ($15,000), anesthesia ($2,500), hospital room ($4,500), and medications ($2,500).', 0, 'Recovery: 4-6 weeks'),
      (4, 'Structural', 'minor', 35000.00, 'Assessment of liability claim shows wet floor conditions at retail location. Medical review of claimant injury indicates wrist fracture consistent with fall mechanism described.', 3, '3-4 months (legal)'),
      (5, 'Vehicle', 'minor', 3500.00, 'Minor dent and paint damage to passenger side door and rear quarter panel. No structural damage. Paintless dent repair possible for smaller dents. Door panel requires repaint.', 5, '3-5 days'),
      (6, 'Water', 'moderate', 22000.00, 'Roof leak caused water damage to attic insulation (complete replacement needed), two bedroom ceilings (drywall and paint), and personal property. No structural damage to roof trusses.', 10, '3-4 weeks'),
      (7, 'Vehicle', 'catastrophic', 28000.00, 'Total loss - vehicle stolen and not recovered. 2022 Honda Accord with 25,000 miles. Fair market value assessed based on condition, mileage, and local market comparables.', 0, 'N/A - Total loss'),
      (8, 'Fire', 'severe', 85000.00, 'Kitchen fire caused significant damage. Complete kitchen demolition and rebuild required. Dining room requires drywall, flooring, and paint. Smoke damage throughout first floor. Structural assessment of load-bearing wall needed.', 20, '10-14 weeks'),
      (9, 'Structural', 'severe', 120000.00, 'Commercial warehouse roof sustained 2000 sq ft of damage from storm. Multiple active leaks damaged stored inventory. Emergency tarping completed. Full roof section replacement required with commercial-grade materials.', 12, '4-6 weeks'),
      (10, 'Structural', 'moderate', 18000.00, 'Hail damage assessment: roof shingles (60% replacement needed), vinyl siding (north and west facing, 30% replacement), two skylights shattered, vehicle windshield cracked. All consistent with 1.5-inch hail.', 14, '2-3 weeks'),
      (11, 'Vehicle', 'minor', 1200.00, 'Windshield replacement required. Single impact point with spider-web cracking pattern consistent with road debris strike. ADAS camera recalibration necessary after replacement.', 3, '1 day'),
      (12, 'Medical', 'moderate', 42000.00, 'Complete ACL tear confirmed by MRI. Surgical reconstruction recommended. Cost breakdown: MRI ($2,000), surgery ($22,000), anesthesia ($3,000), facility fees ($5,000), physical therapy 12 sessions ($10,000).', 0, 'Recovery: 6-9 months'),
      (13, 'Vehicle', 'severe', 55000.00, 'Multi-vehicle collision resulted in extensive front and rear damage. Frame damage detected. Vehicle likely total loss. Two passenger injuries: minor lacerations and cervical strain. ER costs included.', 11, 'Total loss determination pending'),
      (14, 'Property', 'minor', 15000.00, 'Break-in through rear window caused glass replacement need ($800). Stolen items inventory reviewed: electronics ($5,200), jewelry ($7,000), miscellaneous ($2,000). Security system was not armed at time of incident.', 6, '1-2 weeks (property repair)'),
      (15, 'Medical', 'catastrophic', 150000.00, 'Life insurance death benefit claim. Cause of death: natural causes as documented in death certificate. No contested circumstances. Full policy benefit applicable pending standard verification.', 0, 'N/A')
    `);
    console.log('Damage assessments seeded');

    // 8. Risk Assessments (15)
    await client.query(`
      INSERT INTO risk_assessments (policy_id, customer_name, risk_level, risk_score, factors, ai_analysis, recommendation) VALUES
      (1, 'James Wilson', 'medium', 42.00, 'Urban area driving, moderate traffic density, standard vehicle', 'Moderate risk profile. Driver is 39 years old with clean driving record in urban Austin area. Recommend standard premium with safe driver monitoring discount eligibility.', 'Maintain current premium'),
      (2, 'Maria Garcia', 'low', 28.00, 'Newer construction home, flood zone proximity, hurricane region', 'Low-moderate risk. Home is newer construction (2018) with modern building codes. Located in Miami but not in direct flood zone. Hurricane shutters installed.', 'Consider 5% premium reduction'),
      (3, 'Robert Chen', 'low', 20.00, 'No pre-existing conditions, healthy BMI, non-smoker', 'Low risk health profile. Patient is 46 with no chronic conditions, maintains healthy lifestyle. Family history unremarkable. Recommend preferred rate tier.', 'Qualify for preferred rates'),
      (4, 'Sarah Thompson', 'low', 15.00, 'Young age, no health issues, standard life policy', 'Very low risk. Policyholder is 32, non-smoker, no hazardous occupations or hobbies. Standard term life policy with appropriate coverage amount for income level.', 'Approve at standard rates'),
      (5, 'Michael Brown', 'high', 68.00, 'Commercial retail space, high foot traffic, liability history', 'High risk commercial profile. Retail location in high-traffic Manhattan area. Previous liability claim on record. Recommend enhanced safety protocols and quarterly inspections.', 'Increase premium 15%, require safety audit'),
      (6, 'Jennifer Davis', 'low', 22.00, 'New driver, suburban area, economy vehicle', 'Low risk auto profile. Driver is 29, drives economy vehicle in low-traffic suburban Seattle. Short commute distance. Eligible for low-mileage discount.', 'Apply low-mileage discount'),
      (7, 'David Martinez', 'medium', 45.00, 'Older home, mountain region, wildfire risk area', 'Moderate risk. Home built in 1985 in foothills west of Denver. Moderate wildfire risk zone. Home has been updated with fire-resistant roofing. Defensible space maintained.', 'Maintain premium, verify fire mitigation annually'),
      (8, 'Emily Anderson', 'medium', 38.00, 'Moderate health risk, family history of diabetes', 'Moderate risk. Patient is 31 with family history of Type 2 diabetes. Current health markers are normal. Recommend wellness program enrollment for premium discount.', 'Standard rates with wellness incentive'),
      (9, 'William Taylor', 'high', 62.00, 'Multiple vehicles, older driver, urban commute', 'Elevated risk. Driver is 49 with two vehicles insured, commuting in Phoenix metro. One minor accident 3 years ago. Consider telematics program for accurate risk assessment.', 'Recommend telematics enrollment'),
      (10, 'Jessica Lee', 'low', 25.00, 'Historic home, well-maintained, comprehensive coverage', 'Low risk. Historic home in Boston is well-maintained with modern systems. High coverage limit is appropriate for property value. Comprehensive coverage provides good protection.', 'Approve at current rates'),
      (11, 'Christopher Harris', 'medium', 50.00, 'Commercial warehouse, industrial area, inventory risk', 'Moderate risk. Commercial warehouse in Nashville industrial district. Standard construction, sprinkler system installed. Inventory value fluctuates seasonally. Recommend quarterly valuation updates.', 'Maintain premium, require inventory audits'),
      (12, 'Amanda Clark', 'low', 18.00, 'Young age, non-smoker, basic life coverage', 'Very low risk. Policyholder is 30, excellent health, non-smoker, no hazardous activities. Basic life coverage amount is appropriate. No concerns identified.', 'Approve preferred rates'),
      (13, 'Daniel Rodriguez', 'high', 70.00, 'Multiple claims history, urban area, older vehicle', 'High risk. Driver has filed multiple claims in recent years. Driving in congested Dallas area with older vehicle. Policy recently expired and was renewed. Close monitoring recommended.', 'Surcharge 20%, mandatory safe driving course'),
      (14, 'Ashley Lewis', 'medium', 40.00, 'Suburban home, moderate weather risk, standard construction', 'Moderate risk. Home in Charlotte suburb with standard construction. Area has moderate severe weather exposure including occasional hail and wind events. Roof is 8 years old.', 'Standard rates, recommend roof inspection'),
      (15, 'Matthew Walker', 'medium', 48.00, 'Northern climate, chronic condition management, high deductible', 'Moderate risk. Patient is 41 with managed hypertension. High-deductible plan appropriate for overall health profile. Regular monitoring and medication adherence noted.', 'Maintain current rates')
    `);
    console.log('Risk assessments seeded');

    // 9. Settlements (15)
    await client.query(`
      INSERT INTO settlements (claim_id, claim_number, recommended_amount, final_amount, ai_analysis, status, approved_by) VALUES
      (1, 'CLM-2024-001', 11800.00, NULL, 'Based on damage assessment and comparable repair costs in the Austin TX market, recommended settlement of $11,800 covers parts, labor, and rental car during repair period. Below deductible threshold not applicable.', 'pending', NULL),
      (2, 'CLM-2024-002', 42000.00, NULL, 'Water damage restoration costs benchmarked against regional contractors. Recommended $42,000 includes emergency mitigation ($5,000), structural repair ($20,000), flooring ($8,000), electrical ($6,000), and mold remediation ($3,000).', 'pending', NULL),
      (3, 'CLM-2024-003', 25000.00, 25000.00, 'Medical claim settlement approved at $25,000 after review of itemized hospital bills, surgical fees, and post-operative care. Amount reflects negotiated rates with in-network providers.', 'approved', 'Sarah Johnson'),
      (4, 'CLM-2024-004', 30000.00, NULL, 'Liability settlement recommendation of $30,000 includes medical expenses ($8,000), lost wages ($7,000), pain and suffering ($12,000), and legal fees ($3,000). Comparable settlements in NY range $25,000-$40,000.', 'pending', NULL),
      (5, 'CLM-2024-005', 3200.00, 3200.00, 'Minor auto repair settlement of $3,200 approved. Includes body work ($2,200), paint ($700), and parts ($300). Consistent with market rates for described repairs.', 'paid', 'Admin User'),
      (6, 'CLM-2024-006', 20000.00, NULL, 'Recommended settlement of $20,000 for water damage repair. Includes roof repair ($4,000), insulation replacement ($3,000), drywall and paint ($6,000), personal property ($5,000), temporary housing ($2,000).', 'pending', NULL),
      (7, 'CLM-2024-007', 26500.00, NULL, 'Total loss settlement recommendation of $26,500 based on fair market value analysis. Comparable 2022 Honda Accords with similar mileage in Phoenix market sell for $25,000-$28,000.', 'pending', NULL),
      (8, 'CLM-2024-008', 78000.00, NULL, 'Fire damage settlement recommendation of $78,000. Kitchen rebuild ($45,000), dining room restoration ($12,000), smoke damage remediation ($8,000), temporary housing ($8,000), personal property ($5,000).', 'pending', NULL),
      (9, 'CLM-2024-009', 110000.00, 110000.00, 'Commercial claim settlement approved at $110,000. Roof replacement ($75,000), inventory damage ($25,000), business interruption ($10,000). Amount within policy limits and supported by contractor estimates.', 'approved', 'Sarah Johnson'),
      (10, 'CLM-2024-010', 16500.00, NULL, 'Hail damage settlement recommendation of $16,500. Roof repair ($10,000), siding replacement ($3,500), skylight replacement ($2,000), vehicle windshield ($1,000). Based on three contractor estimates.', 'pending', NULL),
      (11, 'CLM-2024-011', 1100.00, 1100.00, 'Auto glass settlement of $1,100 approved. Windshield replacement ($800), ADAS recalibration ($300). Standard pricing for make and model. Below deductible waiver applies for glass claims.', 'paid', 'Admin User'),
      (12, 'CLM-2024-012', 38000.00, NULL, 'Medical settlement recommendation of $38,000. Surgery ($22,000), facility fees ($5,000), anesthesia ($3,000), MRI ($2,000), physical therapy ($6,000). In-network rates applied where applicable.', 'pending', NULL),
      (13, 'CLM-2024-013', 0.00, 0.00, 'Claim denied. Policy had expired at the time of incident. Additionally, inconsistencies in damage descriptions and witness statements raise concerns about claim validity. No settlement recommended.', 'rejected', 'Sarah Johnson'),
      (14, 'CLM-2024-014', 13000.00, NULL, 'Theft claim settlement recommendation of $13,000. Documented items with receipts total $9,200. Items claimed without receipts valued at estimated $3,800 based on depreciated replacement cost.', 'pending', NULL),
      (15, 'CLM-2024-015', 150000.00, NULL, 'Life insurance benefit recommendation of $150,000 (full policy amount). Death certificate and beneficiary documentation verified. Standard 30-day review period applies. No contestable issues identified.', 'pending', NULL)
    `);
    console.log('Settlements seeded');

    // 10. Documents (15)
    await client.query(`
      INSERT INTO documents (claim_id, document_type, file_name, content, extracted_data, ai_analysis, status) VALUES
      (1, 'Police Report', 'police_report_CLM001.pdf', 'Austin PD Report #2024-06789. Date: June 15, 2024. Rear-end collision at Main St and 5th Ave. Driver B cited for running red light. No injuries. Estimated damage: $12,000.', 'Report number: 2024-06789, Date: 2024-06-15, Location: Main St and 5th Ave, Fault: Driver B', 'Police report confirms claimant account. Other driver cited. Damage estimate aligns with claim amount.', 'analyzed'),
      (2, 'Repair Estimate', 'estimate_CLM002.pdf', 'ABC Restoration Services. Estimate for water damage repair at 456 Pine Ave, Miami FL. Total: $43,500. Includes demolition, drying, mold remediation, drywall, flooring, electrical, and painting.', 'Contractor: ABC Restoration, Total: $43,500, Scope: Water damage restoration', 'Estimate from licensed contractor is within expected range for described damage scope. Three estimates recommended for amounts over $25,000.', 'analyzed'),
      (3, 'Medical Report', 'medical_records_CLM003.pdf', 'SF General Hospital. Patient: Robert Chen. Diagnosis: Acute appendicitis. Procedure: Laparoscopic appendectomy. Admission: May 20, 2024. Discharge: May 23, 2024. Total charges: $28,450.', 'Hospital: SF General, Diagnosis: Appendicitis, Procedure: Laparoscopic appendectomy, Stay: 3 days', 'Medical records are consistent and complete. Procedure and hospital stay duration are appropriate for diagnosis. Charges are within typical range.', 'analyzed'),
      (4, 'Witness Statement', 'witness_CLM004.pdf', 'Statement from store employee Jane Martinez. Date: Aug 10, 2024. Confirms customer fell in aisle 3 near frozen foods section. Floor had been mopped 20 minutes prior. Wet floor sign was posted.', 'Witness: Jane Martinez, Location: Aisle 3, Condition: Recently mopped, Sign: Posted', 'Witness statement partially supports defense - wet floor sign was posted. However, sign placement effectiveness may be challenged. Security footage should be reviewed.', 'analyzed'),
      (5, 'Photos', 'damage_photos_CLM005.zip', 'Collection of 5 photos showing passenger side door dent, paint scratches on quarter panel, and close-up of impact point. Photos timestamped September 5, 2024.', 'Photo count: 5, Damage location: Passenger side, Timestamp: 2024-09-05', 'Photos clearly show minor dent and paint damage consistent with low-speed parking lot collision. No prior damage visible in affected area.', 'analyzed'),
      (6, 'Insurance Form', 'claim_form_CLM006.pdf', 'Standard property damage claim form. Policyholder: David Martinez. Date of loss: Sep 15, 2024. Cause: Storm/rainfall. Areas affected: Attic, Bedroom 1, Bedroom 2. Emergency measures taken: Tarping.', 'Policyholder: David Martinez, Date: 2024-09-15, Cause: Storm, Areas: Attic, 2 bedrooms', 'Claim form properly completed with all required fields. Emergency mitigation measures were appropriately taken. Supports timely filing of claim.', 'analyzed'),
      (7, 'Police Report', 'theft_report_CLM007.pdf', 'Phoenix PD Report #2024-10234. Vehicle theft report. 2022 Honda Accord, VIN: 1HGCV2F34NA123456. Stolen from Sunset Apartments parking garage. No surveillance footage available from garage cameras.', 'Report: 2024-10234, Vehicle: 2022 Honda Accord, VIN: 1HGCV2F34NA123456, Location: Sunset Apartments', 'Police report filed but notes lack of surveillance footage is concerning. Garage access records should be subpoenaed. VIN should be flagged in national databases.', 'analyzed'),
      (8, 'Fire Report', 'fire_report_CLM008.pdf', 'Boston Fire Department Investigation Report. Cause: Electrical fault in kitchen outlet. Origin: Behind refrigerator. Spread: Kitchen to dining room via ceiling. No accelerants detected. Occupants evacuated safely.', 'Cause: Electrical fault, Origin: Kitchen outlet, Spread: To dining room, Accelerants: None', 'Fire department investigation confirms accidental electrical cause. No evidence of arson. Damage pattern consistent with described origin point.', 'analyzed'),
      (9, 'Repair Estimate', 'roof_estimate_CLM009.pdf', 'Commercial Roofing Solutions Inc. Proposal for warehouse roof repair. Remove and replace 2,000 sq ft commercial membrane roofing. Including materials, labor, disposal, and warranty. Total: $72,000.', 'Contractor: Commercial Roofing Solutions, Area: 2000 sq ft, Material: Commercial membrane, Total: $72,000', 'Roof replacement estimate is reasonable for commercial membrane roofing at current material prices. Contractor is licensed and bonded. Warranty terms are standard.', 'analyzed'),
      (10, 'Photos', 'hail_damage_CLM010.zip', '14 photos documenting hail damage to roof, siding, skylights, and vehicle. Photos show characteristic circular impact patterns on shingles and fractured skylight glass.', 'Photo count: 14, Damage types: Roof, siding, skylights, vehicle', 'Photos clearly document hail damage patterns. Circular impact marks on shingles are consistent with 1.5-inch diameter hailstones reported by NWS for the area.', 'analyzed'),
      (11, 'Repair Estimate', 'windshield_quote_CLM011.pdf', 'AutoGlass Pro quote for 2021 Toyota Camry windshield replacement. OEM glass with ADAS camera recalibration. Parts: $650, Labor: $150, Calibration: $300. Total: $1,100.', 'Vehicle: 2021 Toyota Camry, Service: Windshield + ADAS calibration, Total: $1,100', 'Quote is competitive for OEM windshield replacement with ADAS recalibration. Pricing is within market range for this vehicle make and model.', 'analyzed'),
      (12, 'Medical Report', 'mri_results_CLM012.pdf', 'Oregon Health Sciences. MRI Report. Patient: Emily Anderson. Finding: Complete tear of anterior cruciate ligament (ACL) of left knee. Associated bone bruise on lateral femoral condyle. Meniscus intact.', 'Facility: OHSU, Finding: Complete ACL tear left knee, Associated: Bone bruise, Meniscus: Intact', 'MRI confirms complete ACL tear requiring surgical reconstruction. Finding is consistent with reported mechanism of injury. No pre-existing degenerative changes noted.', 'analyzed'),
      (13, 'Police Report', 'accident_report_CLM013.pdf', 'Dallas PD Multi-Vehicle Accident Report #2024-11567. Three vehicles involved. Rainy conditions. Claimant vehicle struck from behind, pushed into vehicle ahead. Two passengers transported to ER.', 'Report: 2024-11567, Vehicles: 3, Conditions: Rain, Injuries: 2 passengers', 'Police report documents multi-vehicle collision. However, policy was expired at time of accident. Claim eligibility in question. Witness statements show some inconsistencies with claimant account.', 'analyzed'),
      (14, 'Insurance Form', 'theft_claim_CLM014.pdf', 'Property theft claim form. Stolen items list: MacBook Pro ($2,400), iPad ($800), gold necklace ($3,500), diamond earrings ($3,500), vintage watch ($2,000), cash ($500), designer handbag ($1,300).', 'Total claimed: $14,000, Items: 7 categories, Highest value: Jewelry ($7,000)', 'Claim form lists high-value items. Receipts provided for electronics. Jewelry items have partial documentation - appraisal for necklace only. Recommend verification of remaining jewelry values.', 'analyzed'),
      (15, 'Medical Report', 'death_certificate_CLM015.pdf', 'State of Illinois Death Certificate. Deceased: Sarah Thompson. Date of death: December 3, 2024. Cause: Acute myocardial infarction. Manner: Natural. Certifying physician: Dr. Robert Patel, MD.', 'Deceased: Sarah Thompson, Date: 2024-12-03, Cause: Acute MI, Manner: Natural', 'Death certificate is properly executed by licensed physician. Cause of death is natural - no investigation required. Policy contestability period has passed. Beneficiary claim is straightforward.', 'analyzed')
    `);
    console.log('Documents seeded');

    // 11. Communications (15)
    await client.query(`
      INSERT INTO communications (claim_id, customer_id, customer_name, channel, subject, message, sentiment, sentiment_score, ai_analysis) VALUES
      (1, 1, 'James Wilson', 'email', 'Claim Status Update Request', 'Hello, I submitted my auto collision claim last week and haven''t received any updates. Could you please let me know the current status? Thank you.', 'neutral', 0.10, 'Customer is inquiring about claim status with polite tone. No urgency indicators. Standard follow-up communication. Recommend providing status update within 24 hours.'),
      (2, 2, 'Maria Garcia', 'phone', 'Urgent Water Damage Follow-up', 'I''m extremely frustrated! The water damage to my home is getting worse and I haven''t heard from anyone about when repairs can start. My family is displaced and staying in a hotel. We need help NOW!', 'urgent', -0.85, 'Customer is highly distressed and frustrated. Family displacement creates urgency. Immediate response required. Recommend expediting adjuster visit and authorizing emergency mitigation and temporary housing.'),
      (3, 3, 'Robert Chen', 'email', 'Thank You for Quick Processing', 'I wanted to express my gratitude for the quick processing of my medical claim. The settlement was fair and the communication throughout was excellent. Great service!', 'positive', 0.92, 'Very positive feedback from satisfied customer. Claim was processed efficiently. This is an opportunity to reinforce customer loyalty and request satisfaction survey completion.'),
      (4, 5, 'Michael Brown', 'email', 'Liability Claim Documentation', 'Please find attached the additional documentation you requested for the liability claim including the security camera footage and updated medical records from the injured customer.', 'neutral', 0.15, 'Customer is cooperating with documentation requests. Professional tone. No sentiment concerns. Acknowledge receipt and provide timeline for review.'),
      (5, 6, 'Jennifer Davis', 'chat', 'Quick Question About Repair', 'Hi! Just checking if I can take my car to any body shop or do I need to use one from your approved list? The damage is pretty minor so I want to get it fixed ASAP.', 'positive', 0.45, 'Customer is proactive about repairs with positive attitude. Minor claim with straightforward resolution path. Provide approved shop list and explain direct repair program benefits.'),
      (6, 7, 'David Martinez', 'phone', 'Concerned About Mold Risk', 'I''m worried about mold developing from the water damage. It''s been over a week since the flooding and the insurance adjuster hasn''t come out yet. Can this be expedited?', 'negative', -0.55, 'Customer has legitimate health concern about mold development. Timeliness is critical for water damage claims. Recommend immediate adjuster scheduling and emergency mitigation authorization.'),
      (7, 9, 'William Taylor', 'email', 'Vehicle Theft Claim Update', 'It has been three weeks since my car was stolen and I have not received any update on my claim. I need a vehicle for work and this delay is causing significant financial hardship. Please advise on next steps.', 'negative', -0.65, 'Customer experiencing financial hardship due to claim processing delay. Theft claims require investigation but customer needs interim solution. Recommend rental car authorization and case escalation.'),
      (8, 10, 'Jessica Lee', 'phone', 'Fire Damage Emergency', 'Our house had a kitchen fire and we''re completely devastated. We have two young children and don''t know where to start. Can someone please help us understand what to do next?', 'urgent', -0.90, 'Customer is in crisis following fire. Family with children needs immediate support. Highest priority case. Recommend emergency services coordinator contact, temporary housing arrangement, and expedited adjuster assignment.'),
      (9, 11, 'Christopher Harris', 'email', 'Commercial Claim Appreciation', 'Thank you for the efficient handling of our warehouse claim. The settlement was approved quickly and our contractor has already started repairs. Your team was professional throughout.', 'positive', 0.88, 'Very positive commercial client feedback. Quick claim resolution strengthened business relationship. Recommend account manager follow-up and retention strategies for commercial renewal.'),
      (10, 14, 'Ashley Lewis', 'chat', 'Hail Damage Claim Filed', 'Just filed my claim for hail damage online. The adjuster can come anytime this week - I work from home. Looking forward to getting this resolved. Thanks!', 'positive', 0.55, 'New claim filed with flexible scheduling availability. Customer is cooperative and patient. Schedule adjuster visit promptly to maintain positive customer experience.'),
      (11, 1, 'James Wilson', 'email', 'Windshield Claim - Quick Resolution', 'Thanks for the fast turnaround on my windshield claim. The approved amount covers the replacement perfectly. Scheduling the repair for next week.', 'positive', 0.80, 'Customer satisfied with quick glass claim resolution. Positive experience reinforces loyalty. Simple claim handled efficiently. No further action needed.'),
      (12, 8, 'Emily Anderson', 'phone', 'Surgery Authorization Question', 'My doctor says I need ACL surgery but I want to make sure my insurance will cover it before scheduling. Can someone review my policy and confirm coverage and any out-of-pocket costs?', 'neutral', -0.10, 'Customer seeking pre-authorization information. Reasonable request that should be addressed promptly to avoid treatment delays. Recommend benefits verification and pre-authorization submission.'),
      (13, 13, 'Daniel Rodriguez', 'email', 'Claim Denial Appeal', 'I am writing to formally appeal the denial of my auto collision claim. I believe there are extenuating circumstances regarding the policy lapse that should be considered. I am consulting with my attorney.', 'negative', -0.70, 'Customer is disputing claim denial and has engaged legal counsel. High-risk communication requiring legal department involvement. Recommend immediate escalation to claims supervisor and legal team.'),
      (14, 2, 'Maria Garcia', 'phone', 'Second Claim in Same Year', 'I know I already had a water damage claim this year, but now I''ve had a break-in. This has been the worst year. I just need to know my policy covers theft. Is my premium going to go up?', 'negative', -0.50, 'Customer filing second claim in policy period. Emotional distress from multiple incidents. Premium impact concern is valid. Provide empathetic response and clear coverage information.'),
      (15, 4, 'Sarah Thompson', 'email', 'Life Insurance Beneficiary Claim', 'I am the designated beneficiary on my mother''s life insurance policy. She passed away on December 3rd. I have the death certificate and all required documents. Please advise on the claims process.', 'neutral', -0.20, 'Beneficiary filing life insurance claim. Sensitive communication requiring empathetic and clear guidance. Provide step-by-step claims process and assign dedicated representative for support.')
    `);
    console.log('Communications seeded');

    // 12. Payments (15)
    await client.query(`
      INSERT INTO payments (claim_id, claim_number, amount, payment_method, payment_date, status, reference_number, payee_name) VALUES
      (3, 'CLM-2024-003', 25000.00, 'ACH', '2024-06-15', 'completed', 'PAY-2024-001', 'SF General Hospital'),
      (5, 'CLM-2024-005', 3200.00, 'Check', '2024-09-20', 'completed', 'PAY-2024-002', 'Jennifer Davis'),
      (9, 'CLM-2024-009', 50000.00, 'Wire', '2024-11-01', 'completed', 'PAY-2024-003', 'Commercial Roofing Solutions Inc'),
      (9, 'CLM-2024-009', 60000.00, 'Wire', '2024-11-15', 'completed', 'PAY-2024-004', 'Commercial Roofing Solutions Inc'),
      (11, 'CLM-2024-011', 1100.00, 'ACH', '2024-11-15', 'completed', 'PAY-2024-005', 'AutoGlass Pro'),
      (1, 'CLM-2024-001', 11800.00, 'Check', '2024-12-01', 'pending', 'PAY-2024-006', 'James Wilson'),
      (2, 'CLM-2024-002', 42000.00, 'ACH', '2024-12-05', 'pending', 'PAY-2024-007', 'ABC Restoration Services'),
      (4, 'CLM-2024-004', 15000.00, 'Check', '2024-12-10', 'pending', 'PAY-2024-008', 'Michael Brown'),
      (6, 'CLM-2024-006', 20000.00, 'ACH', '2024-12-15', 'pending', 'PAY-2024-009', 'David Martinez'),
      (7, 'CLM-2024-007', 26500.00, 'Check', '2024-12-20', 'pending', 'PAY-2024-010', 'William Taylor'),
      (8, 'CLM-2024-008', 40000.00, 'Wire', '2024-12-22', 'pending', 'PAY-2024-011', 'Jessica Lee'),
      (10, 'CLM-2024-010', 16500.00, 'ACH', '2024-12-28', 'pending', 'PAY-2024-012', 'Ashley Lewis'),
      (12, 'CLM-2024-012', 38000.00, 'ACH', '2025-01-05', 'pending', 'PAY-2024-013', 'Emily Anderson'),
      (14, 'CLM-2024-014', 13000.00, 'Check', '2025-01-10', 'pending', 'PAY-2024-014', 'Maria Garcia'),
      (15, 'CLM-2024-015', 150000.00, 'Wire', '2025-01-15', 'pending', 'PAY-2024-015', 'Sarah Thompson Estate')
    `);
    console.log('Payments seeded');

    // 13. Audit Log (15)
    await client.query(`
      INSERT INTO audit_log (user_name, action, entity_type, entity_id, details, ip_address) VALUES
      ('Admin User', 'Claim Created', 'claim', 1, 'New auto collision claim CLM-2024-001 created for customer James Wilson', '192.168.1.100'),
      ('John Smith', 'Claim Updated', 'claim', 2, 'Claim CLM-2024-002 status changed from open to under_review', '192.168.1.101'),
      ('Sarah Johnson', 'Claim Approved', 'claim', 3, 'Claim CLM-2024-003 approved with settlement amount $25,000', '192.168.1.102'),
      ('Admin User', 'Policy Created', 'policy', 5, 'New commercial policy POL-2024-005 created for Michael Brown', '192.168.1.100'),
      ('John Smith', 'Fraud Alert Generated', 'fraud_alert', 7, 'High-risk fraud alert generated for claim CLM-2024-007 (vehicle theft)', '192.168.1.101'),
      ('Admin User', 'Payment Processed', 'payment', 1, 'Payment of $25,000 processed via ACH for claim CLM-2024-003', '192.168.1.100'),
      ('Sarah Johnson', 'Document Uploaded', 'document', 1, 'Police report uploaded for claim CLM-2024-001', '192.168.1.102'),
      ('John Smith', 'Adjuster Assigned', 'claim', 8, 'Adjuster Mark Hernandez assigned to fire damage claim CLM-2024-008', '192.168.1.101'),
      ('Admin User', 'Policy Renewed', 'policy', 2, 'Home insurance policy POL-2024-002 renewed for Maria Garcia', '192.168.1.100'),
      ('Sarah Johnson', 'Settlement Approved', 'settlement', 9, 'Settlement of $110,000 approved for commercial claim CLM-2024-009', '192.168.1.102'),
      ('Admin User', 'Customer Created', 'customer', 15, 'New customer Matthew Walker added to the system', '192.168.1.100'),
      ('John Smith', 'Claim Denied', 'claim', 13, 'Claim CLM-2024-013 denied due to expired policy and inconsistent statements', '192.168.1.101'),
      ('Sarah Johnson', 'Risk Assessment Completed', 'risk_assessment', 5, 'High-risk assessment completed for commercial policy POL-2024-005', '192.168.1.102'),
      ('Admin User', 'Damage Assessment Created', 'damage_assessment', 8, 'Fire damage assessment created for claim CLM-2024-008 - estimated $85,000', '192.168.1.100'),
      ('John Smith', 'Communication Logged', 'communication', 2, 'Urgent customer communication logged from Maria Garcia regarding water damage claim', '192.168.1.101')
    `);
    console.log('Audit log seeded');

    // Verify counts
    const tables = [
      'users', 'customers', 'adjusters', 'policies', 'claims',
      'fraud_alerts', 'damage_assessments', 'risk_assessments', 'settlements',
      'documents', 'communications', 'payments', 'audit_log'
    ];

    console.log('\n--- Seed Summary ---');
    for (const table of tables) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table}: ${count.rows[0].count} rows`);
    }

    console.log('\nSeeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
