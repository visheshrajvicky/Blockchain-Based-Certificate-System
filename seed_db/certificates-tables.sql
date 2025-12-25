-- Certificate Management Tables

-- Certificate Types
CREATE TABLE certificate_types(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    template_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certificates Table
CREATE TABLE certificates(
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    certificate_type_id INTEGER REFERENCES certificate_types(id),
    course_name VARCHAR(255) NOT NULL,
    grade VARCHAR(10),
    issue_date DATE NOT NULL,
    issuer_id INTEGER REFERENCES users(id),
    
    -- Blockchain data
    blockchain_id INTEGER,
    transaction_hash VARCHAR(66),
    contract_address VARCHAR(42),
    network VARCHAR(50),
    
    -- IPFS data
    ipfs_hash VARCHAR(255),
    ipfs_metadata_url TEXT,
    
    -- Certificate data
    certificate_number VARCHAR(100) UNIQUE,
    description TEXT,
    
    -- Status
    is_revoked BOOLEAN DEFAULT false,
    revoked_date TIMESTAMP,
    revoked_by INTEGER REFERENCES users(id),
    revoked_reason TEXT,
    
    -- Audit fields
    created_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_dt TIMESTAMP DEFAULT NULL,
    
    CONSTRAINT unique_transaction_hash UNIQUE(transaction_hash)
);

-- Certificate Templates
CREATE TABLE certificate_templates(
    id SERIAL PRIMARY KEY,
    certificate_type_id INTEGER REFERENCES certificate_types(id),
    name VARCHAR(100) NOT NULL,
    html_template TEXT NOT NULL,
    css_styles TEXT,
    variables JSONB, -- Store template variables like {studentName}, {courseName}, etc.
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_dt TIMESTAMP DEFAULT NULL
);

-- Certificate Verification Logs
CREATE TABLE certificate_verifications(
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER REFERENCES certificates(id),
    verified_by VARCHAR(100), -- Can be IP or user ID
    verification_method VARCHAR(50), -- 'blockchain', 'database', 'qr_code'
    verification_result BOOLEAN,
    verified_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blockchain Configuration
CREATE TABLE blockchain_config(
    id SERIAL PRIMARY KEY,
    network_name VARCHAR(50) NOT NULL UNIQUE,
    chain_id INTEGER NOT NULL,
    rpc_url VARCHAR(255) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    explorer_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_testnet BOOLEAN DEFAULT true,
    created_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_dt TIMESTAMP DEFAULT NULL
);

-- IPFS Configuration
CREATE TABLE ipfs_config(
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL,
    api_url VARCHAR(255) NOT NULL,
    gateway_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_blockchain ON certificates(blockchain_id);
CREATE INDEX idx_certificates_ipfs ON certificates(ipfs_hash);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificate_verifications_cert ON certificate_verifications(certificate_id);

-- Insert default certificate types
INSERT INTO certificate_types (name, description) VALUES
('Completion', 'Course completion certificate'),
('Achievement', 'Special achievement certificate'),
('Merit', 'Merit-based certificate'),
('Participation', 'Event participation certificate'),
('Excellence', 'Academic excellence certificate');

-- Insert default blockchain config (for local development)
INSERT INTO blockchain_config (network_name, chain_id, rpc_url, contract_address, explorer_url, is_testnet) VALUES
('Localhost', 31337, 'http://localhost:8545', '0x0000000000000000000000000000000000000000', '', true),
('Polygon Mumbai', 80001, 'https://rpc-mumbai.maticvigil.com', '0x0000000000000000000000000000000000000000', 'https://mumbai.polygonscan.com', true),
('Polygon', 137, 'https://polygon-rpc.com', '0x0000000000000000000000000000000000000000', 'https://polygonscan.com', false);
