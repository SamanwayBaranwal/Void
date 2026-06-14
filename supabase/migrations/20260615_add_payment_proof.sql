/*
  ============================================================
  VOID — Add on-chain payment proof to invoices
  ============================================================
  Run this in your Supabase SQL Editor.
  Safe to run multiple times (IF NOT EXISTS).

  Stores the verified on-chain payment details so a paid
  invoice can show the transaction hash + a block-explorer link.
  ============================================================
*/

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tx_hash     text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_chain  text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_token  text;
