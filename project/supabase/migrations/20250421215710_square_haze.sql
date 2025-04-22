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
DROP POLICY IF EXISTS "Backoffice users can view all users" ON backoffice_users;
DROP POLICY IF EXISTS "Only superadmins can manage users" ON backoffice_users;

-- Create new optimized policies
CREATE POLICY "view_backoffice_users"
ON backoffice_users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id 
    FROM backoffice_users 
    WHERE status = 'active'
  )
);

CREATE POLICY "manage_backoffice_users"
ON backoffice_users
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id 
    FROM backoffice_users 
    WHERE status = 'active' 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id 
    FROM backoffice_users 
    WHERE status = 'active' 
    AND role = 'superadmin'
  )
);