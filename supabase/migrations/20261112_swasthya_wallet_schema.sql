-- ==============================================================================
-- Swasthya Wallet - PostgreSQL Database Schema Migration
-- Official Slogan: Digital Health Locker for Citizens
-- Compliant with Ayushman Bharat Digital Mission (ABDM) & DPDP Act 2023
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) UNIQUE NOT NULL,
  mobile_number VARCHAR(16) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_legal_name VARCHAR(255) NOT NULL,
  dob_aadhaar VARCHAR(10) NOT NULL, -- DD/MM/YYYY
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  biometrics_enrolled BOOLEAN DEFAULT FALSE,
  biometrics_credential_id TEXT,
  google_id VARCHAR(255) UNIQUE,
  google_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  abha_id VARCHAR(32) UNIQUE,
  blood_group VARCHAR(16),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  primary_doctor VARCHAR(255),
  hospital_network VARCHAR(255),
  insurance_provider VARCHAR(255),
  preferred_language VARCHAR(8) DEFAULT 'en',
  avatar_url TEXT,
  vault_public_key TEXT,
  recovery_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HEALTH RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL, -- 'lab', 'imaging', 'notes', 'prescription', 'discharge', 'consult', 'other'
  code VARCHAR(64),
  code_standard VARCHAR(32), -- 'LOINC', 'SNOMED CT', 'DICOM'
  record_date VARCHAR(10) NOT NULL, -- DD/MM/YYYY
  clinician VARCHAR(255),
  hospital VARCHAR(255),
  integrity_status VARCHAR(64) DEFAULT 'Cryptographic Seal',
  sha256 TEXT NOT NULL,
  file_size VARCHAR(32),
  file_format VARCHAR(16),
  encrypted_payload TEXT,
  indication TEXT,
  impression TEXT,
  verified BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1,
  sync_state VARCHAR(32) DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  health_record_id UUID REFERENCES public.health_records(id) ON DELETE SET NULL,
  prescriber_name VARCHAR(255) NOT NULL,
  prescriber_reg_no VARCHAR(64),
  clinic_hospital VARCHAR(255),
  medical_system VARCHAR(32) NOT NULL, -- 'allopathy', 'ayurveda', 'homeopathy', 'mixed'
  prescription_date VARCHAR(10) NOT NULL,
  raw_image_url TEXT,
  encrypted_image_data TEXT,
  notes TEXT,
  verified_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRESCRIPTION MEDICINES TABLE
CREATE TABLE IF NOT EXISTS public.prescription_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name VARCHAR(255) NOT NULL,
  system VARCHAR(32) NOT NULL, -- 'allopathy', 'ayurveda', 'homeopathy'
  active_ingredients TEXT,
  brand_name VARCHAR(255),
  potency VARCHAR(64), -- e.g. '30C', '200C', '1M'
  dosage_form VARCHAR(64), -- 'tablet', 'capsule', 'syrup', 'churna', 'vati', 'globules', 'dilution'
  strength VARCHAR(64),
  frequency VARCHAR(64),
  duration VARCHAR(64),
  instructions TEXT,
  ocr_confidence NUMERIC(5,2),
  verified_by_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEDICAL REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.health_records(id) ON DELETE CASCADE,
  report_type VARCHAR(64) NOT NULL,
  lab_name VARCHAR(255),
  pathologist_name VARCHAR(255),
  biomarkers JSONB,
  conclusion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SHARED RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.shared_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token_id UUID,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_facility VARCHAR(255),
  scope_type VARCHAR(64) NOT NULL, -- 'complete', 'selected', 'prescriptions', 'lab', 'imaging', 'vaccines'
  selected_record_ids JSONB,
  purpose VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. QR SHARING TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.qr_sharing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  encrypted_access_key TEXT NOT NULL,
  share_scope VARCHAR(64) NOT NULL,
  authorized_record_ids JSONB NOT NULL,
  expiry_minutes INT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  pin_hash VARCHAR(64),
  view_count INT DEFAULT 0,
  max_views INT DEFAULT 10,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MEDICINE SEARCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.medicine_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  query VARCHAR(255) NOT NULL,
  system VARCHAR(32),
  search_type VARCHAR(64),
  results_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STORAGE METADATA TABLE
CREATE TABLE IF NOT EXISTS public.storage_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  storage_target VARCHAR(32) NOT NULL, -- 'indexeddb', 'gdrive', 'supabase'
  file_key VARCHAR(255) NOT NULL,
  folder_path VARCHAR(255) NOT NULL,
  gdrive_file_id VARCHAR(255),
  file_size_bytes BIGINT NOT NULL,
  sha256_checksum VARCHAR(64) NOT NULL,
  is_encrypted BOOLEAN DEFAULT TRUE,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SYNC STATUS TABLE
CREATE TABLE IF NOT EXISTS public.sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  local_version INT DEFAULT 1,
  cloud_version INT DEFAULT 1,
  sync_state VARCHAR(32) DEFAULT 'synced', -- 'synced', 'pending', 'conflict', 'failed'
  error_message TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  client_ip VARCHAR(64),
  status_code VARCHAR(32) DEFAULT '200 OK',
  details TEXT,
  sig_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. MEDICINE CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.medicine_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255) NOT NULL,
  system VARCHAR(32) NOT NULL, -- 'allopathy', 'ayurveda', 'homeopathy'
  strength_or_potency VARCHAR(64),
  dosage_form VARCHAR(64) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  approx_mrp NUMERIC(10,2),
  jan_aushadhi_price NUMERIC(10,2),
  is_jan_aushadhi_available BOOLEAN DEFAULT FALSE,
  online_pharmacy_status VARCHAR(64) DEFAULT 'In Stock',
  ayush_licence_no VARCHAR(128),
  safety_advice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MEDICINE INGREDIENTS TABLE
CREATE TABLE IF NOT EXISTS public.medicine_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID REFERENCES public.medicine_catalog(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  sanskrit_name VARCHAR(255),
  botanical_name VARCHAR(255),
  latin_name VARCHAR(255),
  strength_quantity VARCHAR(64),
  purpose TEXT
);

-- 15. MEDICINE MANUFACTURERS TABLE
CREATE TABLE IF NOT EXISTS public.medicine_manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(64) DEFAULT 'India',
  systems_supported JSONB,
  headquarters VARCHAR(255),
  license_status VARCHAR(64) DEFAULT 'Verified'
);

-- 16. MEDICINE ALTERNATIVES TABLE
CREATE TABLE IF NOT EXISTS public.medicine_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_medicine_id UUID REFERENCES public.medicine_catalog(id) ON DELETE CASCADE,
  alternative_medicine_id UUID REFERENCES public.medicine_catalog(id) ON DELETE CASCADE,
  match_category VARCHAR(64) NOT NULL, -- 'exact_match', 'same_salt_formulation', 'similar_product', 'different_system'
  price_difference_pct NUMERIC(5,2),
  notes TEXT
);

-- 17. PRESCRIPTION OCR RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.prescription_ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  detected_system VARCHAR(32) NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL,
  extracted_medicines JSONB NOT NULL,
  raw_text TEXT,
  corrections_applied JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_health_records_user ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_hash ON public.qr_sharing_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_medicine_catalog_brand ON public.medicine_catalog(brand_name);
CREATE INDEX IF NOT EXISTS idx_medicine_catalog_generic ON public.medicine_catalog(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicine_catalog_system ON public.medicine_catalog(system);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_sharing_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Catalog tables readable by authenticated users
ALTER TABLE public.medicine_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_alternatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read medicine catalog" ON public.medicine_catalog FOR SELECT USING (true);
CREATE POLICY "Public read medicine ingredients" ON public.medicine_ingredients FOR SELECT USING (true);
CREATE POLICY "Public read medicine manufacturers" ON public.medicine_manufacturers FOR SELECT USING (true);
CREATE POLICY "Public read medicine alternatives" ON public.medicine_alternatives FOR SELECT USING (true);
