/*
  # Fix notifications sharing between backoffice and users

  1. Changes
    - Update notifications policies to properly handle shared notifications
    - Allow backoffice users to create notifications for regular users
    - Ensure users can see notifications created by backoffice
    
  2. Security
    - Maintain RLS protection
    - Allow proper notification flow between backoffice and users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "backoffice_manage_notifications" ON notifications;
DROP POLICY IF EXISTS "manage_own_notifications" ON notifications;
DROP POLICY IF EXISTS "view_own_notifications" ON notifications;

-- Create new policies that handle both backoffice and user notifications
CREATE POLICY "backoffice_manage_notifications"
ON notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users b
    WHERE b.id = auth.uid()
    AND b.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM backoffice_users b
    WHERE b.id = auth.uid()
    AND b.status = 'active'
  )
);

-- Allow users to view notifications targeted to them or their properties
CREATE POLICY "view_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  -- User can see notifications targeted to them
  target_user_id = auth.uid()
  OR
  -- User can see notifications for their properties
  target_property_id IN (
    SELECT id FROM properties 
    WHERE owner_id = auth.uid()
  )
  OR
  -- User can see system-wide notifications
  (type = 'system' AND target_user_id IS NULL AND target_property_id IS NULL)
);

-- Allow users to manage (update status, delete) their own notifications
CREATE POLICY "manage_own_notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (
  target_user_id = auth.uid()
  OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  target_user_id = auth.uid()
  OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type_targets 
ON notifications(type, target_user_id, target_property_id);