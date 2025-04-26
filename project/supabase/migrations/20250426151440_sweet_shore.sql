/*
  # Add created_at column to users table

  1. Changes
    - Add created_at column to users table
    - Set default value to now()
    - Update existing rows to have a created_at value
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add created_at column to users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update existing rows to have a created_at value if null
UPDATE auth.users 
SET created_at = now() 
WHERE created_at IS NULL;