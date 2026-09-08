-- PostgreSQL Relational Schema for MPLADS Monitoring Platform
-- Database: PostgreSQL 17+ (Supabase)

CREATE TABLE IF NOT EXISTS works (
    work_id VARCHAR(64) PRIMARY KEY,
    house VARCHAR(32),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ida VARCHAR(100),
    mp_name VARCHAR(150),
    constituency VARCHAR(150),
    constituency_or_term VARCHAR(150),
    work_category VARCHAR(100),
    work_type VARCHAR(255),
    work_description TEXT,
    work_status VARCHAR(100),
    sanction_amount NUMERIC(15, 2),
    sanction_date DATE,
    recommended_date DATE,
    completion_date DATE,
    amount_disbursed NUMERIC(15, 2),
    is_completed_flag BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_works_state ON works(state);
CREATE INDEX IF NOT EXISTS idx_works_district ON works(district);
CREATE INDEX IF NOT EXISTS idx_works_mp_name ON works(mp_name);
CREATE INDEX IF NOT EXISTS idx_works_work_type ON works(work_type);
CREATE INDEX IF NOT EXISTS idx_works_status ON works(work_status);
CREATE INDEX IF NOT EXISTS idx_works_sanction_date ON works(sanction_date);

CREATE TABLE IF NOT EXISTS cost_anomaly_results (
    work_id VARCHAR(64) PRIMARY KEY REFERENCES works(work_id) ON DELETE CASCADE,
    cost_anomaly_score DOUBLE PRECISION NOT NULL,
    raw_anomaly_score DOUBLE PRECISION,
    severity VARCHAR(32) NOT NULL,
    peer_group_used VARCHAR(255),
    peer_group_level VARCHAR(64),
    peer_group_size INTEGER,
    is_data_quality_exception BOOLEAN DEFAULT FALSE,
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_cost_severity ON cost_anomaly_results(severity);
CREATE INDEX IF NOT EXISTS idx_cost_score ON cost_anomaly_results(cost_anomaly_score);

CREATE TABLE IF NOT EXISTS duplicate_work_results (
    id BIGSERIAL PRIMARY KEY,
    work_id_1 VARCHAR(64) NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    work_id_2 VARCHAR(64) NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    duplicate_score DOUBLE PRECISION NOT NULL,
    severity VARCHAR(32) NOT NULL,
    confidence DOUBLE PRECISION,
    semantic_similarity DOUBLE PRECISION,
    structural_score DOUBLE PRECISION,
    amount_similarity DOUBLE PRECISION,
    date_proximity DOUBLE PRECISION,
    days_diff INTEGER,
    is_same_mp BOOLEAN,
    is_same_constituency BOOLEAN,
    explanation TEXT,
    CONSTRAINT uq_duplicate_pair UNIQUE (work_id_1, work_id_2)
);

CREATE INDEX IF NOT EXISTS idx_dup_work1 ON duplicate_work_results(work_id_1);
CREATE INDEX IF NOT EXISTS idx_dup_work2 ON duplicate_work_results(work_id_2);
CREATE INDEX IF NOT EXISTS idx_dup_severity ON duplicate_work_results(severity);
CREATE INDEX IF NOT EXISTS idx_dup_score ON duplicate_work_results(duplicate_score);

CREATE TABLE IF NOT EXISTS fund_expenditure_results (
    work_id VARCHAR(64) PRIMARY KEY REFERENCES works(work_id) ON DELETE CASCADE,
    fund_anomaly_score DOUBLE PRECISION NOT NULL,
    raw_score DOUBLE PRECISION,
    severity VARCHAR(32) NOT NULL,
    audit_category VARCHAR(64),
    total_disbursed_amount NUMERIC(15, 2),
    utilization_ratio DOUBLE PRECISION,
    transaction_count INTEGER,
    payment_concentration_hhi DOUBLE PRECISION,
    days_to_first_disbursement DOUBLE PRECISION,
    anomaly_reasons TEXT[],
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_fund_severity ON fund_expenditure_results(severity);
CREATE INDEX IF NOT EXISTS idx_fund_score ON fund_expenditure_results(fund_anomaly_score);
CREATE INDEX IF NOT EXISTS idx_fund_category ON fund_expenditure_results(audit_category);

CREATE TABLE IF NOT EXISTS delay_results (
    work_id VARCHAR(64) PRIMARY KEY REFERENCES works(work_id) ON DELETE CASCADE,
    delay_score DOUBLE PRECISION NOT NULL,
    severity VARCHAR(32) NOT NULL,
    primary_delay_type VARCHAR(64),
    active_delay_types TEXT[],
    rec_to_sanc_days INTEGER,
    rec_to_sanc_delay_days INTEGER,
    rec_to_sanc_severity VARCHAR(32),
    sanc_to_comp_days INTEGER,
    sanc_to_comp_delay_days INTEGER,
    sanc_to_comp_severity VARCHAR(32),
    open_work_aging_days INTEGER,
    open_work_overdue_days INTEGER,
    open_work_aging_severity VARCHAR(32),
    explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_delay_severity ON delay_results(severity);
CREATE INDEX IF NOT EXISTS idx_delay_score ON delay_results(delay_score);
CREATE INDEX IF NOT EXISTS idx_delay_type ON delay_results(primary_delay_type);

CREATE TABLE IF NOT EXISTS work_expenditures (
    id BIGSERIAL PRIMARY KEY,
    work_id VARCHAR(64) NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    expenditure_date DATE,
    vendor_name VARCHAR(255),
    fund_disbursed_amount NUMERIC(15, 2),
    payment_status VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_exp_work_id ON work_expenditures(work_id);
CREATE INDEX IF NOT EXISTS idx_exp_date ON work_expenditures(expenditure_date);
