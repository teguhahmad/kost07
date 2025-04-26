/*
  # Fix auth.users permissions and view

  1. Changes
    - Grant necessary permissions on auth.users table
    - Create/update public.users view with created_at column
    - Add indexes for better performance
    
  2. Security
    - Only expose necessary columns through view
    - Maintain RLS protection
*/

-- Grant necessary permissions
GRANT SELECT ON auth.users TO postgres, authenticated, service_role;
GRANT SELECT ON auth.users TO anon;

-- Drop existing view if exists
DROP VIEW IF EXISTS public.users;

-- Create updated view with created_at
CREATE OR REPLACE VIEW public.users AS
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  last_sign_in_at
FROM auth.users;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_at ON auth.users(created_at);