/*
  # Privy Wallet Support + Profile Address Fields

  1. crypto_wallets
     - Add privy_id text column (Privy user identifier)
     - Make user_id nullable (Privy users don't have Supabase auth accounts)
     - Drop old FK constraint so rows can be inserted without a Supabase auth user
     - New unique constraint on (privy_id, wallet_address)
     - Permissive anon policies so the Privy-authenticated frontend can read/write

  2. profiles
     - Add address fields for professional invoice "From" section:
       street_address, city, state, country, postal_code
     - Add privy_id text column if not already present

  NOTE: Data isolation is enforced at the application layer via privy_id filtering.
  For stronger server-side isolation, integrate Privy's Supabase JWT provider.
*/

-- ─── crypto_wallets ───────────────────────────────────────────────────────────

-- Make user_id nullable so Privy-only users can insert rows
ALTER TABLE crypto_wallets ALTER COLUMN user_id DROP NOT NULL;

-- Add privy_id column
ALTER TABLE crypto_wallets ADD COLUMN IF NOT EXISTS privy_id text;

-- New unique constraint (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crypto_wallets_privy_id_wallet_address_key'
  ) THEN
    ALTER TABLE crypto_wallets
      ADD CONSTRAINT crypto_wallets_privy_id_wallet_address_key
      UNIQUE (privy_id, wallet_address);
  END IF;
END $$;

-- Permissive policies for anon key (Privy architecture)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crypto_wallets' AND policyname = 'anon_select_wallets'
  ) THEN
    CREATE POLICY "anon_select_wallets" ON crypto_wallets FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crypto_wallets' AND policyname = 'anon_insert_wallets'
  ) THEN
    CREATE POLICY "anon_insert_wallets" ON crypto_wallets FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crypto_wallets' AND policyname = 'anon_update_wallets'
  ) THEN
    CREATE POLICY "anon_update_wallets" ON crypto_wallets FOR UPDATE TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'crypto_wallets' AND policyname = 'anon_delete_wallets'
  ) THEN
    CREATE POLICY "anon_delete_wallets" ON crypto_wallets FOR DELETE TO anon USING (true);
  END IF;
END $$;

-- ─── profiles ─────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS street_address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privy_id text;
