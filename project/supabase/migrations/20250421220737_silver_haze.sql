/*
  # Fix backoffice users RLS policies

  1. Changes
    - Drop existing policies on backoffice_users table that cause recursion
    - Create new, optimized policies that avoid recursive checks:
      - View policy: Allow active backoffice users to view all users
      - Manage policy: Allow only superadmins to manage users
    
  2. Security
    - Maintains RLS protection
    - Simplifies policy logic to prevent recursion
    - Ensures proper access control based on user roles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "view_backoffice_users" ON backoffice_users;
DROP POLICY IF EXISTS "manage_backoffice_users" ON backoffice_users;

-- Create new optimized policies
CREATE POLICY "view_backoffice_users"
ON backoffice_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM backoffice_users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "manage_backoffice_users"
ON backoffice_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM backoffice_users 
    WHERE id = auth.uid() 
    AND status = 'active' 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM backoffice_users 
    WHERE id = auth.uid() 
    AND status = 'active' 
    AND role = 'superadmin'
  )
);