/*
  # Create Web3 Invoicing App Schema

  1. New Tables
    - `profiles` - User profile information and branding
    - `crypto_wallets` - User crypto wallet addresses
    - `clients` - Client information for each user
    - `invoices` - Invoice records with amounts and details
    - `invoice_items` - Line items for invoices

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated user access
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  business_name text,
  bio text,
  avatar_url text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  chain_type text DEFAULT 'base',
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  wallet_address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  title text NOT NULL,
  description text,
  amount_usd numeric(18, 2) NOT NULL,
  amount_crypto numeric(18, 8),
  crypto_currency text DEFAULT 'ETH',
  status text DEFAULT 'draft',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  UNIQUE(user_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  rate numeric(18, 2) NOT NULL,
  amount numeric(18, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wallets"
  ON crypto_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wallets"
  ON crypto_wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Invoice items accessible through invoices"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
