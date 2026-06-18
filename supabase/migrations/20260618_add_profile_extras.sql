/*
  ============================================================
  VOID — Profile extras (Tax ID + Timezone)
  ============================================================
  Run this in your Supabase SQL Editor. Safe to run repeatedly.

  These two columns are written by the Settings page. Without
  them, saving Settings fails with a "schema cache" / column
  error. The app already falls back gracefully, but run this so
  Tax ID and Timezone actually persist (Tax ID shows on invoices).
  ============================================================
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
