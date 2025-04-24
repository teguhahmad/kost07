/*
  # Add notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `title` (text)
      - `message` (text)
      - `type` (notification_type)
      - `status` (notification_status)
      - `created_at` (timestamptz)
      - `target_user_id` (uuid, references auth.users)
      - `target_property_id` (uuid, references properties)

  2. Security
    - Enable RLS on notifications table
    - Add policies for authenticated users to view their notifications
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

-- Create notifications table if it doesn't exist
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "manage_own_notifications" ON notifications;

-- Create new policies
CREATE POLICY "view_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "manage_own_notifications"
ON notifications
FOR ALL
TO authenticated
USING (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  target_user_id = auth.uid() OR
  target_property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Create indexes for better query performance
DROP INDEX IF EXISTS idx_notifications_target_user;
DROP INDEX IF EXISTS idx_notifications_target_property;
DROP INDEX IF EXISTS idx_notifications_created_at;

CREATE INDEX idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX idx_notifications_target_property ON notifications(target_property_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);