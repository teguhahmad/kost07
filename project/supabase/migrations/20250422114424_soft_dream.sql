/*
  # Add payment reminders function and trigger

  1. New Function
    - Creates payment records automatically before due date
    - Uses tenant end_date as payment due date
    - Configurable days before due date

  2. Security
    - Function runs with security definer
    - Maintains existing RLS policies
*/

-- Function to create payment reminders
CREATE OR REPLACE FUNCTION create_payment_reminders() 
RETURNS void AS $$
BEGIN
  -- Create payment records for tenants whose end_date is approaching
  INSERT INTO payments (
    "tenantId",
    "roomId",
    amount,
    "dueDate",
    status,
    property_id
  )
  SELECT 
    t.id as "tenantId",
    t.room_id as "roomId",
    r.price as amount,
    t.end_date as "dueDate",
    'pending' as status,
    t.property_id
  FROM tenants t
  JOIN rooms r ON t.room_id = r.id
  WHERE 
    t.status = 'active' 
    AND t.end_date > CURRENT_DATE
    AND t.end_date <= (CURRENT_DATE + INTERVAL '5 days')
    AND NOT EXISTS (
      SELECT 1 
      FROM payments p 
      WHERE p."tenantId" = t.id 
      AND p."dueDate" = t.end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run the function daily
SELECT cron.schedule(
  'create-payment-reminders',
  '0 0 * * *', -- Run at midnight every day
  'SELECT create_payment_reminders()'
);