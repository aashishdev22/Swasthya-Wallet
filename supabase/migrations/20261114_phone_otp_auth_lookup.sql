-- ==============================================================================
-- Swasthya Wallet - Phone OTP Authentication, Duplicate Prevention & RLS Lookup
-- Official Slogan: Digital Health Locker for Citizens
-- Migration: 20261114_phone_otp_auth_lookup.sql
-- ==============================================================================

-- 1. Track verified Indian E.164 phone numbers cleanly on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Enforce uniqueness for non-empty Indian phone numbers to block duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_phone_e164_unique
  ON public.user_profiles(phone_e164)
  WHERE phone_e164 IS NOT NULL AND phone_e164 <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_mobile_unique
  ON public.user_profiles(mobile_number)
  WHERE mobile_number IS NOT NULL AND mobile_number <> '';

-- 2. Authoritative duplicate-check RPC (returns booleans only; exposes zero PII)
CREATE OR REPLACE FUNCTION public.check_phone_or_email_available(
  p_mobile TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean_digits TEXT;
  v_e164 TEXT;
  v_clean_email TEXT;
  v_mobile_exists BOOLEAN := FALSE;
  v_email_exists BOOLEAN := FALSE;
BEGIN
  v_clean_digits := regexp_replace(COALESCE(p_mobile, ''), '[^0-9]', '', 'g');
  IF length(v_clean_digits) = 12 AND left(v_clean_digits, 2) = '91' THEN
    v_clean_digits := substr(v_clean_digits, 3);
  ELSIF length(v_clean_digits) = 11 AND left(v_clean_digits, 1) = '0' THEN
    v_clean_digits := substr(v_clean_digits, 2);
  END IF;

  IF length(v_clean_digits) = 10 THEN
    v_e164 := '+91' || v_clean_digits;
  ELSE
    v_e164 := '';
  END IF;

  v_clean_email := lower(trim(COALESCE(p_email, '')));

  IF v_clean_digits <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.mobile_number = v_clean_digits
         OR (v_e164 <> '' AND up.phone_e164 = v_e164)
    ) OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.phone = v_e164
         OR au.phone = ltrim(v_e164, '+')
         OR au.raw_user_meta_data->>'mobile_number' = v_clean_digits
    ) INTO v_mobile_exists;
  END IF;

  IF v_clean_email <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE lower(up.email) = v_clean_email
    ) OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE lower(au.email) = v_clean_email
    ) INTO v_email_exists;
  END IF;

  RETURN jsonb_build_object(
    'mobile_exists', COALESCE(v_mobile_exists, FALSE),
    'email_exists', COALESCE(v_email_exists, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_phone_or_email_available(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_phone_or_email_available(TEXT, TEXT) TO anon, authenticated;

-- 3. Secure single-identifier resolution (Username / Mobile -> login target) under strict RLS
CREATE OR REPLACE FUNCTION public.resolve_login_identifier(
  p_identifier TEXT
)
RETURNS TABLE (
  login_email TEXT,
  login_phone TEXT,
  phone_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_trimmed TEXT := lower(trim(COALESCE(p_identifier, '')));
  v_digits TEXT := regexp_replace(COALESCE(p_identifier, ''), '[^0-9]', '', 'g');
  v_e164 TEXT := '';
BEGIN
  IF v_trimmed = '' THEN
    RETURN;
  END IF;

  IF length(v_digits) = 12 AND left(v_digits, 2) = '91' THEN
    v_digits := substr(v_digits, 3);
  ELSIF length(v_digits) = 11 AND left(v_digits, 1) = '0' THEN
    v_digits := substr(v_digits, 2);
  END IF;

  IF length(v_digits) = 10 THEN
    v_e164 := '+91' || v_digits;
  END IF;

  RETURN QUERY
  SELECT
    NULLIF(trim(COALESCE(up.email, au.email, '')), '') AS login_email,
    NULLIF(trim(COALESCE(up.phone_e164, CASE WHEN au.phone IS NOT NULL AND au.phone <> '' THEN '+' || ltrim(au.phone, '+') ELSE '' END, '')), '') AS login_phone,
    COALESCE(up.phone_verified, au.phone_confirmed_at IS NOT NULL, FALSE) AS phone_verified
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.user_id
  WHERE lower(up.username) = v_trimmed
     OR (v_digits <> '' AND (up.mobile_number = v_digits OR up.phone_e164 = v_e164))
     OR lower(up.email) = v_trimmed
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_login_identifier(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_login_identifier(TEXT) TO anon, authenticated;
