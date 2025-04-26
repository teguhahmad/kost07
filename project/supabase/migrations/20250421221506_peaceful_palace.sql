/*
  # Fix recursive policies in backoffice_users table

  1. Changes
    - Remove recursive policies from backoffice_users table
    - Create new, simplified policies that avoid infinite recursion
    - Maintain security while fixing the recursion issue

  2. Security
    - Maintain row level security
    - Update policies to use direct role checks
    - Ensure proper access control without circular references
*/

-- Drop existing policies to replace them with non-recursive versions
DROP POLICY IF EXISTS "manage_backoffice_users" ON backoffice_users;
DROP POLICY IF EXISTS "view_backoffice_users" ON backoffice_users;

-- Create new non-recursive policies
CREATE POLICY "superadmin_manage_backoffice_users"
ON backoffice_users
FOR ALL
TO authenticated
USING (
  role = 'superadmin'::user_role 
  AND status = 'active'::user_status
)
WITH CHECK (
  role = 'superadmin'::user_role 
  AND status = 'active'::user_status
);

CREATE POLICY "active_users_view_backoffice_users"
ON backoffice_users
FOR SELECT
TO authenticated
USING (
  status = 'active'::user_status
);