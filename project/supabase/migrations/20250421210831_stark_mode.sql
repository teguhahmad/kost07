/*
  # Initial Schema Setup

  1. New Tables
    - `properties`
      - Basic property information
      - Owner reference to auth.users
    - `rooms`
      - Room details and status
      - Property reference
    - `tenants`
      - Tenant information
      - Room and property references
    - `payments`
      - Payment records
      - References to tenant, room, and property
    - `maintenance_requests`
      - Maintenance ticket details
      - References to room, tenant, and property

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner_id uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  floor text NOT NULL,
  type text NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL,
  facilities text[],
  tenant_id uuid,
  property_id uuid REFERENCES properties(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage rooms in their properties"
  ON rooms
  FOR ALL
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  room_id uuid REFERENCES rooms(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL,
  payment_status text NOT NULL,
  property_id uuid REFERENCES properties(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tenants in their properties"
  ON tenants
  FOR ALL
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  room_id uuid REFERENCES rooms(id),
  amount numeric NOT NULL,
  date date,
  due_date date NOT NULL,
  status text NOT NULL,
  payment_method text,
  notes text,
  property_id uuid REFERENCES properties(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments in their properties"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Maintenance requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id),
  tenant_id uuid REFERENCES tenants(id),
  title text NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  property_id uuid REFERENCES properties(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage maintenance requests in their properties"
  ON maintenance_requests
  FOR ALL
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_property_id ON maintenance_requests(property_id);