/*
  # Fix payments table property_id column

  1. Changes
    - Rename "propertyId" column to "property_id" in payments table to follow naming convention
    - Update foreign key constraint to use new column name
    - Add index on property_id column for better query performance

  2. Security
    - Maintain existing RLS policies with updated column name
*/

-- Rename propertyId to property_id
ALTER TABLE payments 
  RENAME COLUMN "propertyId" TO property_id;

-- Create index on property_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_payments_property_id 
  ON payments(property_id);

-- Update foreign key constraint
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_property_id_fkey,
  ADD CONSTRAINT payments_property_id_fkey 
    FOREIGN KEY (property_id) 
    REFERENCES properties(id);