/*
  # Fix recursive policies

  1. Changes
    - Fix recursive policy in backoffice_users table
    - Fix recursive policy in notifications table
    - Update policies to use direct comparisons instead of subqueries where possible
    - Add proper indexes for policy performance

  2. Security
    - Maintain RLS security while preventing recursion
    - Ensure proper access control for backoffice users
    - Ensure proper access control for notifications
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "allow_superadmin_full_access" ON backoffice_users;
DROP POLICY IF EXISTS "users_view_own_profile" ON backoffice_users;
DROP POLICY IF EXISTS "view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "manage_own_notifications" ON notifications;

-- Create new non-recursive policies for backoffice_users
CREATE POLICY "allow_superadmin_full_access" ON backoffice_users
  FOR ALL 
  TO authenticated
  USING (
    role = 'superadmin' AND 
    status = 'active'
  );

CREATE POLICY "users_view_own_profile" ON backoffice_users
  FOR SELECT 
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = email
  );

-- Create new non-recursive policies for notifications
CREATE POLICY "view_own_notifications" ON notifications
  FOR SELECT 
  TO authenticated
  USING (
    target_user_id = auth.uid() OR
    target_property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "manage_own_notifications" ON notifications
  FOR ALL 
  TO authenticated
  USING (
    target_user_id = auth.uid() OR
    target_property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    target_user_id = auth.uid() OR
    target_property_id IN (
      SELECT id FROM properties 
      WHERE owner_id = auth.uid()
    )
  );

-- Add indexes to improve policy performance
CREATE INDEX IF NOT EXISTS idx_backoffice_users_role_status ON backoffice_users(role, status);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user_property ON notifications(target_user_id, target_property_id);