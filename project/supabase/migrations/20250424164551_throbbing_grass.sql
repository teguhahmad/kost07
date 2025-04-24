/*
  # Fix backoffice notifications policies

  1. Changes
    - Add backoffice_manage_system_notifications policy
    - Allow backoffice users to create notifications for all users
    - Fix policy to check backoffice user status properly

  2. Security
    - Maintain RLS protection
    - Ensure proper access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "backoffice_manage_notifications" ON notifications;

-- Create new policy for backoffice users
CREATE POLICY "backoffice_manage_system_notifications"
ON notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users b
    WHERE b.email = (SELECT email FROM users WHERE id = auth.uid())::text
    AND b.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM backoffice_users b
    WHERE b.email = (SELECT email FROM users WHERE id = auth.uid())::text
    AND b.status = 'active'
  )
);