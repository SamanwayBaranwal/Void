# VOID — The Invoice Layer for Web3

Create, send, and track crypto invoices. Built for freelancers, studios, and DAOs.
Black/monospace terminal aesthetic, on-chain auto-verified payments, and a real EVM wallet per user.

---

## ✨ Features

- **Crypto invoicing** — create professional invoices, share a public pay link
- **On-chain auto-verification** — polls 5 chains (Base, Ethereum, Polygon, Arbitrum, Optimism) for incoming USDC/USDT and marks invoices **paid automatically** (no manual step)
- **Real EVM wallet** — embedded wallet per user via Privy (keys in a TEE, never stored by us)
- **A4 PDF invoices** — single-page, pure-black, print-to-PDF
- **Dashboard, Clients, Payments, Wallet, Settings** — fully responsive (desktop sidebar + mobile bottom tab bar)
- **Transparency page** — exactly what is and isn't stored

## 🧱 Tech stack

- **Vite + React + TypeScript**
- **Privy** — auth (email + Google) & embedded wallets
- **Supabase** (PostgreSQL) — profiles, clients, invoices, wallet addresses
- **ethers v6** — on-chain payment verification via public RPCs
- **lucide-react** — icons

---

## 🚀 Local setup

```bash
npm install
npm run dev      # runs on http://localhost:5176
```

### Environment variables (`.env`)

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PRIVY_APP_ID=your_privy_app_id
```

### Database

Run these in the Supabase **SQL Editor** (in order):

1. `supabase/migrations/20260602_complete_schema.sql` — core tables
2. `supabase/migrations/20260615_add_payment_proof.sql` — adds `tx_hash`, `paid_chain`, `paid_token` for on-chain proof

> ⚠️ **Port matters for login.** Privy blocks its login iframe on any origin not whitelisted in the Privy dashboard. The dev server is locked to **`localhost:5176`** (`vite.config.ts`) — make sure that origin is in your Privy **Allowed origins**.

---

## ☁️ Deploy (Vercel)

1. Push to GitHub, import the repo in Vercel
2. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`
3. Add the three env vars above in **Vercel → Settings → Environment Variables**
4. SPA routing is handled by `vercel.json` (rewrites all routes to `index.html`)
5. **Add your production URL** (e.g. `https://yourapp.vercel.app`) to **Privy → Allowed origins** — otherwise login will fail exactly like an un-whitelisted localhost port.

---

## 📁 Structure

```
src/
  pages/        Landing, Auth, Dashboard, Invoices, InvoiceDetail,
                Clients, Payments, Wallet, Profile, Transparency, Pay
  components/    Layout (sidebar + mobile bottom nav), LoadingScreen, Skeleton
  lib/          supabase, wallet (on-chain verification), useIsMobile, env
supabase/migrations/   SQL schema + payment-proof migration
```

---

*Secure. Private. Onchain.*
