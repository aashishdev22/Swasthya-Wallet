-- ==============================================================================
-- Swasthya Wallet - Real User Data, Owner RLS Policies & Private Storage Buckets
-- Official Slogan: Digital Health Locker for Citizens
-- Migration: 20261113_real_data_rls_and_profile_photos.sql
-- ==============================================================================

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ALIGN USER FOREIGN KEYS WITH SUPABASE AUTH (auth.users)
-- ==============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'user_profiles',
      'health_records',
      'prescriptions',
      'medical_reports',
      'shared_records',
      'qr_sharing_tokens',
      'medicine_search_history',
      'storage_metadata',
      'sync_status',
      'audit_logs'
    ])
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      -- Drop legacy FK referencing public.users if present
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = tbl
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'users'
          AND ccu.table_schema = 'public'
      ) THEN
        EXECUTE format(
          'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
          tbl,
          tbl || '_user_id_fkey'
        );
      END IF;

      -- Add FK to auth.users(id) ON DELETE CASCADE if not already present
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = tbl
          AND constraint_name = tbl || '_auth_user_id_fkey'
      ) THEN
        EXECUTE format(
          'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
          tbl,
          tbl || '_auth_user_id_fkey'
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 2. EXPAND EXISTING TABLES FOR REAL CITIZEN PROFILES & RECORDS
-- ==============================================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(64),
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dob_aadhaar VARCHAR(16),
  ADD COLUMN IF NOT EXISTS critical_allergy TEXT DEFAULT 'None reported',
  ADD COLUMN IF NOT EXISTS avatar_path TEXT,
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS biometrics_enrolled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"smsEnabled": true, "emailEnabled": true, "pushEnabled": true}'::jsonb;

-- Ensure unique constraint on user_profiles(user_id) for upsert onConflict: 'user_id'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND indexname = 'idx_user_profiles_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_user_profiles_user_id_unique ON public.user_profiles(user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile ON public.user_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Expand health_records
ALTER TABLE public.health_records
  ADD COLUMN IF NOT EXISTS file_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(64) DEFAULT 'health-documents',
  ADD COLUMN IF NOT EXISTS original_document_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uploaded_at VARCHAR(64),
  ADD COLUMN IF NOT EXISTS ocr_extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS biomarkers JSONB,
  ADD COLUMN IF NOT EXISTS dosage_sig TEXT,
  ADD COLUMN IF NOT EXISTS refills_left INT,
  ADD COLUMN IF NOT EXISTS total_refills INT;

-- Ensure prescriptions children carry user_id for clean direct owner RLS
ALTER TABLE public.prescription_medicines
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.prescription_ocr_results
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==============================================================================
-- 3. NEW TABLES FOR REAL USER HEALTH DATA (ZERO MOCK DATA)
-- ==============================================================================

-- A. USER MEDICINES (Prescribed or saved by citizen)
CREATE TABLE IF NOT EXISTS public.user_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_medicine_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  system VARCHAR(32) NOT NULL DEFAULT 'allopathy',
  generic_or_active_salt VARCHAR(255) NOT NULL,
  dosage_form VARCHAR(64) NOT NULL DEFAULT 'Tablet',
  strength_or_potency VARCHAR(64) NOT NULL DEFAULT '',
  manufacturer VARCHAR(255),
  frequency VARCHAR(128),
  duration VARCHAR(128),
  instructions TEXT,
  prescriber_name VARCHAR(255),
  prescription_date VARCHAR(32),
  linked_record_id UUID REFERENCES public.health_records(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_medicines_user ON public.user_medicines(user_id);

-- B. VACCINATIONS WALLET
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  vaccine_type VARCHAR(32) NOT NULL DEFAULT 'administered', -- 'due' | 'seasonal' | 'administered'
  priority VARCHAR(16) DEFAULT 'normal', -- 'high' | 'normal'
  status VARCHAR(128) NOT NULL,
  code VARCHAR(64) NOT NULL,
  due_date VARCHAR(32),
  interval_label VARCHAR(64),
  last_dose VARCHAR(32),
  lot_number VARCHAR(64),
  facility VARCHAR(255),
  registry_state VARCHAR(64),
  serology_titer VARCHAR(128),
  fhir_id VARCHAR(128),
  ndc_code VARCHAR(64),
  clinician_sig VARCHAR(255),
  doses_history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_user ON public.vaccinations(user_id);

-- C. APPOINTMENTS & REMINDERS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  clinician_or_facility VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'consultation', -- 'consultation' | 'lab' | 'vaccination' | 'follow_up'
  scheduled_date VARCHAR(32) NOT NULL,
  scheduled_time VARCHAR(32) NOT NULL,
  fee_inr VARCHAR(32),
  notes TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'completed' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON public.appointments(user_id);

-- D. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(32) NOT NULL DEFAULT 'info', -- 'info' | 'warning' | 'security' | 'reminder'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_view VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ==============================================================================
-- 4. ENABLE ROW LEVEL SECURITY & CREATE OWNER-ONLY POLICIES ON ALL USER TABLES
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_sharing_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Idempotent helper: create SELECT / INSERT / UPDATE / DELETE policies scoped to auth.uid() = user_id
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'user_profiles',
      'health_records',
      'prescriptions',
      'prescription_medicines',
      'prescription_ocr_results',
      'medical_reports',
      'shared_records',
      'qr_sharing_tokens',
      'medicine_search_history',
      'storage_metadata',
      'sync_status',
      'audit_logs',
      'user_medicines',
      'vaccinations',
      'appointments',
      'notifications'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_select_%s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "owner_select_%s" ON public.%I FOR SELECT USING (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_insert_%s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "owner_insert_%s" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_update_%s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "owner_update_%s" ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "owner_delete_%s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "owner_delete_%s" ON public.%I FOR DELETE USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- 5. SUPABASE STORAGE PRIVATE BUCKETS & OWNER OBJECT RLS POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'health-documents',
  'health-documents',
  FALSE,
  52428800
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 52428800;

-- Storage Object RLS: Owners can read, upload, update, delete files ONLY inside their own {auth.uid()}/ folder
DROP POLICY IF EXISTS "owner_read_profile_photos" ON storage.objects;
CREATE POLICY "owner_read_profile_photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_insert_profile_photos" ON storage.objects;
CREATE POLICY "owner_insert_profile_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_update_profile_photos" ON storage.objects;
CREATE POLICY "owner_update_profile_photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_delete_profile_photos" ON storage.objects;
CREATE POLICY "owner_delete_profile_photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_read_health_documents" ON storage.objects;
CREATE POLICY "owner_read_health_documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_insert_health_documents" ON storage.objects;
CREATE POLICY "owner_insert_health_documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_update_health_documents" ON storage.objects;
CREATE POLICY "owner_update_health_documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_delete_health_documents" ON storage.objects;
CREATE POLICY "owner_delete_health_documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'health-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
