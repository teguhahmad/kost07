/*
  # Add admin user to backoffice_users table

  1. Changes
    - Insert admin user into backoffice_users table
    - Set role as superadmin and status as active
    
  2. Security
    - Uses secure defaults
    - Maintains existing RLS policies
*/

-- Create user_role type if not exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_status type if not exists
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Insert admin user if not exists
INSERT INTO backoffice_users (email, name, role, status)
SELECT 
  'admin@kostmanager.com',
  'Super Admin',
  'superadmin'::user_role,
  'active'::user_status
WHERE NOT EXISTS (
  SELECT 1 FROM backoffice_users 
  WHERE email = 'admin@kostmanager.com'
);