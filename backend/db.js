const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'insurance_claims_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'adjuster',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        policy_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        premium DECIMAL(10,2),
        deductible DECIMAL(10,2),
        coverage_limit DECIMAL(12,2),
        start_date DATE,
        end_date DATE,
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS adjusters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        specialization VARCHAR(100),
        license_number VARCHAR(50),
        experience_years INTEGER,
        status VARCHAR(30) DEFAULT 'active',
        rating DECIMAL(3,1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        claim_number VARCHAR(50) UNIQUE NOT NULL,
        policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        adjuster_id INTEGER REFERENCES adjusters(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        incident_date DATE,
        filed_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(30) DEFAULT 'open',
        estimated_amount DECIMAL(12,2),
        approved_amount DECIMAL(12,2),
        location TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fraud_alerts (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
        risk_score DECIMAL(5,2),
        indicators TEXT,
        ai_analysis TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        reviewed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS damage_assessments (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
        damage_type VARCHAR(100),
        severity VARCHAR(30),
        estimated_cost DECIMAL(12,2),
        ai_analysis TEXT,
        photos_reviewed INTEGER DEFAULT 0,
        repair_timeline VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS risk_assessments (
        id SERIAL PRIMARY KEY,
        policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
        customer_name VARCHAR(255),
        risk_level VARCHAR(30),
        risk_score DECIMAL(5,2),
        factors TEXT,
        ai_analysis TEXT,
        recommendation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
        claim_number VARCHAR(50),
        recommended_amount DECIMAL(12,2),
        final_amount DECIMAL(12,2),
        ai_analysis TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        approved_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
        document_type VARCHAR(100),
        file_name VARCHAR(255),
        content TEXT,
        extracted_data TEXT,
        ai_analysis TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        customer_name VARCHAR(255),
        channel VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        sentiment VARCHAR(30),
        sentiment_score DECIMAL(5,2),
        ai_analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        claim_id INTEGER REFERENCES claims(id) ON DELETE CASCADE,
        claim_number VARCHAR(50),
        amount DECIMAL(12,2),
        payment_method VARCHAR(50),
        payment_date DATE,
        status VARCHAR(30) DEFAULT 'pending',
        reference_number VARCHAR(50),
        payee_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(255),
        action VARCHAR(100),
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
