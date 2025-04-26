/*
  # Fix RLS policies for backoffice access

  1. Changes
    - Add RLS policies for backoffice users to manage all rooms
    - Update existing policies to properly handle backoffice access
    - Ensure proper access control based on user roles
    
  2. Security
    - Maintains existing RLS protection
    - Adds specific policies for backoffice access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage rooms in their properties" ON rooms;
DROP POLICY IF EXISTS "backoffice_manage_rooms" ON rooms;

-- Create new policies for rooms
CREATE POLICY "Users can manage rooms in their properties"
ON rooms
FOR ALL
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "backoffice_manage_rooms"
ON rooms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);