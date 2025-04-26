/*
  # Fix properties and users relationship

  1. Changes
    - Add foreign key constraint between properties and auth.users
    - Update properties query to use correct join syntax
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper data integrity with foreign key
*/

-- Add foreign key constraint to properties table
ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_owner_id_fkey,
  ADD CONSTRAINT properties_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES auth.users(id);