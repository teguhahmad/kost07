/*
  # Fix notifications policies

  1. Changes
    - Drop existing policies on notifications table
    - Create new policies that avoid recursion with backoffice_users
    - Simplify policy logic for better performance
    
  2. Security
    - Maintains RLS protection
    - Prevents policy recursion
    - Ensures proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Backoffice users can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Create new optimized policies
CREATE POLICY "view_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "manage_notifications"
ON notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM backoffice_users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM backoffice_users 
    WHERE id = auth.uid() 
    AND status = 'active'
  )
);