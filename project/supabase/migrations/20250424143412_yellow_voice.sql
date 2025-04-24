/*
  # Add subscription tables

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (integer)
      - `max_properties` (integer)
      - `max_rooms_per_property` (integer)
      - `features` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_id` (uuid, references subscription_plans)
      - `status` (text)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `cancel_at_period_end` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing subscriptions
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  max_properties integer NOT NULL,
  max_rooms_per_property integer NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;

-- Create new policies
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, max_properties, max_rooms_per_property, features)
VALUES 
  (
    'Basic',
    'Perfect for small property owners',
    99000,
    1,
    10,
    '{
      "tenant_data": true,
      "auto_billing": false,
      "billing_notifications": true,
      "financial_reports": "basic",
      "data_backup": false,
      "multi_user": false,
      "analytics": false,
      "support": "basic"
    }'
  ),
  (
    'Professional',
    'Ideal for growing businesses',
    299000,
    5,
    30,
    '{
      "tenant_data": true,
      "auto_billing": true,
      "billing_notifications": true,
      "financial_reports": "advanced",
      "data_backup": "weekly",
      "multi_user": true,
      "analytics": true,
      "support": "priority"
    }'
  ),
  (
    'Enterprise',
    'For large property management companies',
    999000,
    20,
    100,
    '{
      "tenant_data": true,
      "auto_billing": true,
      "billing_notifications": true,
      "financial_reports": "predictive",
      "data_backup": "realtime",
      "multi_user": true,
      "analytics": "predictive",
      "support": "24/7"
    }'
  )
ON CONFLICT DO NOTHING;