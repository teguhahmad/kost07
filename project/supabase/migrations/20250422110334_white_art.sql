/*
  # Fix payment column names

  1. Changes
    - Rename columns in payments table to match frontend camelCase naming:
      - `due_date` -> `dueDate`
      - `payment_method` -> `paymentMethod`
      - `tenant_id` -> `tenantId`
      - `room_id` -> `roomId`
      - `property_id` -> `propertyId`

  2. Security
    - No changes to RLS policies needed as they reference the new column names
*/

DO $$ 
BEGIN
  -- Only rename if the old column names exist and new ones don't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'due_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'dueDate'
  ) THEN
    ALTER TABLE payments RENAME COLUMN due_date TO "dueDate";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_method'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'paymentMethod'
  ) THEN
    ALTER TABLE payments RENAME COLUMN payment_method TO "paymentMethod";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'tenant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE payments RENAME COLUMN tenant_id TO "tenantId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'room_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'roomId'
  ) THEN
    ALTER TABLE payments RENAME COLUMN room_id TO "roomId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'property_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'propertyId'
  ) THEN
    ALTER TABLE payments RENAME COLUMN property_id TO "propertyId";
  END IF;
END $$;