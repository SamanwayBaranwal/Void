/*
  # Add Wallet Secrets (Mnemonic and Private Key)

  1. Changes to crypto_wallets table
    - Add mnemonic_encrypted column for secret phrase
    - Add private_key_encrypted column for private key
    - These are encrypted at rest and should never be exposed

  2. Security
    - Encrypted columns are encrypted with server-side keys
    - Only accessible to owner via RLS
    - Never returned to frontend by default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crypto_wallets' AND column_name = 'mnemonic_encrypted'
  ) THEN
    ALTER TABLE crypto_wallets ADD COLUMN mnemonic_encrypted text;
    ALTER TABLE crypto_wallets ADD COLUMN private_key_encrypted text;
  END IF;
END $$;
