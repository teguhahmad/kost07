/*
  # Create initial superadmin account

  1. Changes
    - Insert initial superadmin user into backoffice_users table
    - Set status as active and role as superadmin
    
  2. Security
    - Uses secure defaults
    - Maintains existing RLS policies
*/

-- Insert initial superadmin if not exists
INSERT INTO backoffice_users (email, name, role, status)
SELECT 
  'admin@kostmanager.com',
  'Super Admin',
  'superadmin'::user_role,
  'active'::user_status
WHERE NOT EXISTS (
  SELECT 1 FROM backoffice_users 
  WHERE role = 'superadmin'::user_role
);