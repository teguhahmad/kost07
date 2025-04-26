/*
  # Fix infinite recursion in backoffice RLS policies

  1. Changes
    - Drop existing problematic policies on backoffice_users table
    - Create new simplified policies that avoid circular dependencies
    - Update related policies on backoffice_notifications and backoffice_audit_logs

  2. Security
    - Maintain security while eliminating recursion
    - Ensure proper access control for backoffice users
    - Preserve data integrity and access patterns
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "enable_read_basic_info" ON backoffice_users;
DROP POLICY IF EXISTS "superadmins_insert_users" ON backoffice_users;
DROP POLICY IF EXISTS "superadmins_manage_all" ON backoffice_users;
DROP POLICY IF EXISTS "users_read_own_full_profile" ON backoffice_users;
DROP POLICY IF EXISTS "users_update_own_profile" ON backoffice_users;

-- Create new simplified policies for backoffice_users
CREATE POLICY "enable_read_basic_info" 
ON backoffice_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "superadmins_manage_users" 
ON backoffice_users
FOR ALL 
TO authenticated
USING (
  role = 'superadmin' 
  AND status = 'active'
)
WITH CHECK (
  role = 'superadmin' 
  AND status = 'active'
);

CREATE POLICY "users_manage_own_profile" 
ON backoffice_users
FOR ALL 
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);

-- Update backoffice_notifications policies to avoid recursion
DROP POLICY IF EXISTS "Backoffice users can manage notifications" ON backoffice_notifications;
DROP POLICY IF EXISTS "Backoffice users can view all notifications" ON backoffice_notifications;

CREATE POLICY "backoffice_users_manage_notifications" 
ON backoffice_notifications
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
);

-- Update backoffice_audit_logs policies to avoid recursion
DROP POLICY IF EXISTS "Backoffice users can view audit logs" ON backoffice_audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON backoffice_audit_logs;

CREATE POLICY "backoffice_users_view_audit_logs" 
ON backoffice_audit_logs
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "backoffice_users_create_audit_logs" 
ON backoffice_audit_logs
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
);