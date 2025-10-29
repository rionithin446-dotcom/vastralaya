/*
  # Enhance Retailer Authentication System

  ## Overview
  This migration enhances the retailer authentication system with proper session management,
  retailer profiles, and audit logging capabilities.

  ## Changes

  ### 1. New Tables
  - `retailer_profiles` - Extended retailer profile information
  - `retailer_sessions` - Track active retailer sessions
  - `retailer_activity_log` - Audit trail for retailer actions

  ### 2. Updated Tables
  - Add security columns to retailer_auth

  ### 3. Security
  - Enable RLS on all new tables
  - Add policies for secure access
  - Add functions for session management
*/

-- Add new columns to retailer_auth for security
ALTER TABLE retailer_auth ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE retailer_auth ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE retailer_auth ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- Create retailer_profiles table
CREATE TABLE IF NOT EXISTS retailer_profiles (
  id uuid PRIMARY KEY REFERENCES retailer_auth(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  business_name text DEFAULT '',
  phone_number text DEFAULT '',
  address text DEFAULT '',
  profile_image_url text DEFAULT '',
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create retailer_sessions table
CREATE TABLE IF NOT EXISTS retailer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailer_auth(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create retailer_activity_log table
CREATE TABLE IF NOT EXISTS retailer_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailer_auth(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  entity_type text DEFAULT '',
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE retailer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retailer_profiles
CREATE POLICY "Service role can manage retailer profiles"
  ON retailer_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for retailer_sessions
CREATE POLICY "Service role can manage sessions"
  ON retailer_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for retailer_activity_log
CREATE POLICY "Service role can manage activity logs"
  ON retailer_activity_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to verify retailer login with enhanced security
CREATE OR REPLACE FUNCTION verify_retailer_login_enhanced(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retailer_id uuid;
  v_is_active boolean;
  v_locked_until timestamptz;
  v_failed_attempts integer;
  v_session_token text;
  v_expires_at timestamptz;
BEGIN
  SELECT id, is_active, locked_until, failed_login_attempts
  INTO v_retailer_id, v_is_active, v_locked_until, v_failed_attempts
  FROM retailer_auth
  WHERE email = p_email;

  IF v_retailer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  IF NOT v_is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is disabled');
  END IF;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is temporarily locked. Please try again later.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM retailer_auth
    WHERE id = v_retailer_id
    AND password_hash = crypt(p_password, password_hash)
  ) THEN
    UPDATE retailer_auth
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = v_retailer_id;

    UPDATE retailer_profiles
    SET last_login_at = now()
    WHERE id = v_retailer_id;

    v_session_token := encode(gen_random_bytes(32), 'base64');
    v_expires_at := now() + interval '24 hours';

    INSERT INTO retailer_sessions (retailer_id, token, expires_at)
    VALUES (v_retailer_id, v_session_token, v_expires_at);

    INSERT INTO retailer_activity_log (retailer_id, action, details)
    VALUES (v_retailer_id, 'login', jsonb_build_object('timestamp', now()));

    RETURN jsonb_build_object(
      'success', true,
      'token', v_session_token,
      'retailer_id', v_retailer_id,
      'email', p_email,
      'expires_at', v_expires_at
    );
  ELSE
    v_failed_attempts := v_failed_attempts + 1;

    IF v_failed_attempts >= 5 THEN
      UPDATE retailer_auth
      SET failed_login_attempts = v_failed_attempts,
          locked_until = now() + interval '30 minutes'
      WHERE id = v_retailer_id;

      RETURN jsonb_build_object('success', false, 'error', 'Too many failed attempts. Account locked for 30 minutes.');
    ELSE
      UPDATE retailer_auth
      SET failed_login_attempts = v_failed_attempts
      WHERE id = v_retailer_id;

      RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
  END IF;
END;
$$;

-- Create function to verify session token
CREATE OR REPLACE FUNCTION verify_retailer_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_record record;
BEGIN
  SELECT s.retailer_id, s.expires_at, r.email, r.is_active
  INTO v_session_record
  FROM retailer_sessions s
  JOIN retailer_auth r ON r.id = s.retailer_id
  WHERE s.token = p_token;

  IF v_session_record IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid session');
  END IF;

  IF v_session_record.expires_at < now() THEN
    DELETE FROM retailer_sessions WHERE token = p_token;
    RETURN jsonb_build_object('valid', false, 'error', 'Session expired');
  END IF;

  IF NOT v_session_record.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Account is disabled');
  END IF;

  UPDATE retailer_sessions
  SET expires_at = now() + interval '24 hours'
  WHERE token = p_token;

  RETURN jsonb_build_object(
    'valid', true,
    'retailer_id', v_session_record.retailer_id,
    'email', v_session_record.email
  );
END;
$$;

-- Create function to logout
CREATE OR REPLACE FUNCTION logout_retailer_session(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM retailer_sessions WHERE token = p_token;
  RETURN true;
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_retailer_sessions_token ON retailer_sessions(token);
CREATE INDEX IF NOT EXISTS idx_retailer_sessions_retailer_id ON retailer_sessions(retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_sessions_expires_at ON retailer_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_retailer_activity_log_retailer_id ON retailer_activity_log(retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_activity_log_created_at ON retailer_activity_log(created_at);

-- Insert default profile for existing retailer
INSERT INTO retailer_profiles (id, full_name, business_name)
SELECT id, 'Admin User', 'Vastralaya'
FROM retailer_auth
WHERE email = 'rionithin446@gmail.com'
ON CONFLICT (id) DO NOTHING;
