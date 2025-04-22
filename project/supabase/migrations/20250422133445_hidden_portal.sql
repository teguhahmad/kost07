/*
  # Add user settings table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_notifications` (boolean)
      - `payment_reminders` (boolean)
      - `maintenance_updates` (boolean)
      - `new_tenants` (boolean)
      - `currency` (text)
      - `date_format` (text)
      - `payment_reminder_days` (integer)
      - `session_timeout` (integer)
      - `login_notifications` (boolean)
      - `two_factor_enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on user_settings table
    - Add policies for users to manage their own settings
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  payment_reminders boolean DEFAULT true,
  maintenance_updates boolean DEFAULT true,
  new_tenants boolean DEFAULT true,
  currency text DEFAULT 'IDR',
  date_format text DEFAULT 'DD/MM/YYYY',
  payment_reminder_days integer DEFAULT 5,
  session_timeout integer DEFAULT 30,
  login_notifications boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create function to initialize user settings
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize settings for new users
DROP TRIGGER IF EXISTS initialize_user_settings_trigger ON auth.users;
CREATE TRIGGER initialize_user_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_settings();