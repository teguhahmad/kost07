/*
  # Fix properties view for backoffice

  1. Changes
    - Add RLS policy for backoffice users to view all properties
    - Allow superadmin to view all properties regardless of ownership
    
  2. Security
    - Maintains existing RLS policies
    - Adds specific policy for backoffice access
*/

-- Add policy for backoffice users to view all properties
CREATE POLICY "backoffice_view_all_properties"
ON properties
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
);