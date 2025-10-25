/*
  # Create Retailer Login Verification Function

  1. New Functions
    - `verify_retailer_login` - Verifies retailer credentials using bcrypt
      - Takes email and password as parameters
      - Returns boolean indicating success
      - Uses secure password comparison
  
  2. Security
    - Function runs with security definer to access retailer_auth table
    - Only compares hashed passwords
*/

CREATE OR REPLACE FUNCTION verify_retailer_login(p_email text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM retailer_auth 
    WHERE email = p_email 
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$;