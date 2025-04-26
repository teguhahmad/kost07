/*
  # Fix tenants access for backoffice

  1. Changes
    - Add RLS policies for backoffice users to access all tenants
    - Update existing policies to handle backoffice access
    
  2. Security
    - Maintains existing RLS protection
    - Adds specific policies for backoffice access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage tenants in their properties" ON tenants;
DROP POLICY IF EXISTS "backoffice_manage_tenants" ON tenants;

-- Create new policies for tenants
CREATE POLICY "Users can manage tenants in their properties"
ON tenants
FOR ALL
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "backoffice_manage_tenants"
ON tenants
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
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);