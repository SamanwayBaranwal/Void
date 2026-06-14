/*
  ============================================================
  ChainPay — Complete Database Schema
  ============================================================
  Run this entire script in your Supabase SQL Editor.
  It is safe to run multiple times (uses IF NOT EXISTS).

  Architecture:
  - Auth is handled by Privy (not Supabase Auth)
  - Every table uses `privy_id text` to identify the user
  - RLS is enabled but allows anon key access
    (data isolation happens at the app layer via privy_id)
  ============================================================
*/

-- ─── Drop old tables if they exist with wrong schema ──────────────────────────
-- (Safe order: children first, then parents)
DROP TABLE IF EXISTS invoice_items  CASCADE;
DROP TABLE IF EXISTS invoices        CASCADE;
DROP TABLE IF EXISTS clients         CASCADE;
DROP TABLE IF EXISTS crypto_wallets  CASCADE;
DROP TABLE IF EXISTS profiles        CASCADE;

-- ─── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id        text        NOT NULL UNIQUE,
  display_name    text        NOT NULL DEFAULT '',
  email           text        NOT NULL DEFAULT '',
  business_name   text,
  website         text,
  bio             text,
  -- Address fields (shown on invoices)
  street_address  text,
  city            text,
  state           text,
  country         text,
  postal_code     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_anon_select" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "profiles_anon_insert" ON profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "profiles_anon_update" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "profiles_anon_delete" ON profiles FOR DELETE TO anon USING (true);

-- ─── crypto_wallets ───────────────────────────────────────────────────────────
CREATE TABLE crypto_wallets (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id        text        NOT NULL,
  wallet_address  text        NOT NULL,
  chain_type      text        NOT NULL DEFAULT 'evm',
  is_primary      boolean     NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (privy_id, wallet_address)
);

CREATE INDEX idx_crypto_wallets_privy_id ON crypto_wallets (privy_id);

ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_anon_select" ON crypto_wallets FOR SELECT TO anon USING (true);
CREATE POLICY "wallets_anon_insert" ON crypto_wallets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "wallets_anon_update" ON crypto_wallets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "wallets_anon_delete" ON crypto_wallets FOR DELETE TO anon USING (true);

-- ─── clients ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id        text        NOT NULL,
  name            text        NOT NULL,
  email           text        NOT NULL DEFAULT '',
  company         text,
  wallet_address  text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_clients_privy_id ON clients (privy_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_anon_select" ON clients FOR SELECT TO anon USING (true);
CREATE POLICY "clients_anon_insert" ON clients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "clients_anon_update" ON clients FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "clients_anon_delete" ON clients FOR DELETE TO anon USING (true);

-- ─── invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id        text        NOT NULL,
  client_id       uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number  text        NOT NULL,
  title           text        NOT NULL,
  description     text,
  amount_usd      numeric(18,2) NOT NULL CHECK (amount_usd > 0),
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('draft', 'pending', 'paid')),
  due_date        date,
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (privy_id, invoice_number)
);

CREATE INDEX idx_invoices_privy_id ON invoices (privy_id);
CREATE INDEX idx_invoices_client_id ON invoices (client_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_anon_select" ON invoices FOR SELECT TO anon USING (true);
CREATE POLICY "invoices_anon_insert" ON invoices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "invoices_anon_update" ON invoices FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "invoices_anon_delete" ON invoices FOR DELETE TO anon USING (true);
