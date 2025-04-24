/*
  # Fix admin user in backoffice_users

  1. Changes
    - Create backoffice_users table if not exists
    - Insert admin user with correct auth.users id
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

-- Create backoffice_users table if not exists
CREATE TABLE IF NOT EXISTS backoffice_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE backoffice_users ENABLE ROW LEVEL SECURITY;

-- Insert admin user with auth.users id
INSERT INTO backoffice_users (id, email, name, role, status)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', 'Super Admin'),
  'superadmin'::user_role,
  'active'::user_status
FROM auth.users u
WHERE u.email = 'admin@kostmanager.com'
ON CONFLICT (email) DO UPDATE
SET 
  id = EXCLUDED.id,
  role = 'superadmin'::user_role,
  status = 'active'::user_status;