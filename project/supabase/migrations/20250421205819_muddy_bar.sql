/*
  # Add notifications tables and functions

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `title` (text)
      - `message` (text)
      - `type` (notification_type)
      - `status` (notification_status)
      - `created_at` (timestamptz)
      - `target_user_id` (uuid, references users)
      - `target_property_id` (uuid, references properties)

  2. Security
    - Enable RLS on notifications table
    - Add policies for authenticated users to view their notifications
    - Add policies for backoffice users to manage notifications
*/

-- Create notification type enum if not exists
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('system', 'user', 'property', 'payment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification status enum if not exists
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('unread', 'read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  status notification_status NOT NULL DEFAULT 'unread',
  created_at timestamptz DEFAULT now(),
  target_user_id uuid REFERENCES auth.users(id),
  target_property_id uuid REFERENCES properties(id)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    target_user_id = auth.uid() OR
    target_property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Policies for backoffice users
CREATE POLICY "Backoffice users can manage notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM backoffice_users
      WHERE id = auth.uid()
      AND status = 'active'
    )
  );

-- Function to create system notifications
CREATE OR REPLACE FUNCTION create_system_notification(
  p_title text,
  p_message text,
  p_type notification_type,
  p_target_user_id uuid DEFAULT NULL,
  p_target_property_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    title,
    message,
    type,
    target_user_id,
    target_property_id
  ) VALUES (
    p_title,
    p_message,
    p_type,
    p_target_user_id,
    p_target_property_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;