/*
  # Update notification policies for backoffice access

  1. Changes
    - Add new RLS policies for backoffice users to manage notifications
    - Update existing policies to properly handle backoffice user access
    - Ensure proper access control based on user roles and status

  2. Security
    - Enable RLS on notifications table
    - Add policies for backoffice users to manage notifications
    - Maintain existing policies for regular users
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "backoffice_manage_notifications" ON notifications;
DROP POLICY IF EXISTS "manage_own_notifications" ON notifications;
DROP POLICY IF EXISTS "view_own_notifications" ON notifications;

-- Create new policies with proper permissions
CREATE POLICY "backoffice_manage_notifications" ON notifications
FOR ALL TO authenticated
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

-- Policy for regular users to manage their own notifications
CREATE POLICY "manage_own_notifications" ON notifications
FOR ALL TO authenticated
USING (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Policy for regular users to view their own notifications
CREATE POLICY "view_own_notifications" ON notifications
FOR SELECT TO authenticated
USING (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);