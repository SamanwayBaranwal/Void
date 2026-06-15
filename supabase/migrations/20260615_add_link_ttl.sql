/*
  ============================================================
  VOID — Configurable pay-link expiry
  ============================================================
  Run this in your Supabase SQL Editor. Safe to run repeatedly.

  link_ttl_minutes: how long the public /pay link stays active
  after the invoice is created.
    30    = 30 minutes (default)
    60    = 1 hour
    1440  = 24 hours
    10080 = 7 days
    0     = never expires
  ============================================================
*/

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS link_ttl_minutes integer NOT NULL DEFAULT 30;
