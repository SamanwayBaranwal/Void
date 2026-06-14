# Wallet Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth.tsx (Signup Page)                                │ │
│  │  1. User enters email/password                         │ │
│  │  2. Calls supabase.auth.signUp()                       │ │
│  │  3. Creates profile in database                        │ │
│  │  4. Calls generateUserWallet()                         │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        │                                     │
│                        ├─► POST /functions/v1/generate_wallet
│                        │   (with JWT token)                 │
│                        │                                     │
│  ┌─────────────────────▼──────────────────────────────────┐ │
│  │  Dashboard.tsx                                         │ │
│  │  - Displays primary wallet address                    │ │
│  │  - Shows copy button                                   │ │
│  │  - Links to Profile for wallet management            │ │
│  └────────────────────────────────────────────────────────┘ │
│                        ▲                                     │
│  ┌─────────────────────┴──────────────────────────────────┐ │
│  │  Profile.tsx                                           │ │
│  │  - Add additional wallets                             │ │
│  │  - Delete wallets                                      │ │
│  │  - Set primary wallet                                  │ │
│  └──────────────────────────────────────────────────────── ┘ │
│                        ▲                                     │
│  ┌─────────────────────┴──────────────────────────────────┐ │
│  │  lib/wallet.ts (Wallet Service)                        │ │
│  │  - getPrimaryWallet()                                  │ │
│  │  - getAllWallets()                                     │ │
│  │  - addWallet()                                         │ │
│  │  - deleteWallet()                                      │ │
│  │  - setAsPrimary()                                      │ │
│  │  - isValidEthereumAddress()                            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼────────────────────────────────────┐
│              Supabase Edge Functions                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  generate_wallet/index.ts                              │  │
│  │  1. Verify JWT token                                   │  │
│  │  2. Get user from auth.getUser(token)                 │  │
│  │  3. Check if wallet already exists                     │  │
│  │  4. Generate deterministic wallet address              │  │
│  │  5. Insert into crypto_wallets table                   │  │
│  │  6. Return wallet data to client                       │  │
│  └────────────────────┬─────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ Service Role Key
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│            Supabase PostgreSQL Database                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  auth.users                                            │    │
│  │  ├─ id (uuid) - PRIMARY                               │    │
│  │  └─ email                                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  profiles                                              │    │
│  │  ├─ id (uuid) - PRIMARY                               │    │
│  │  ├─ user_id (uuid) - FOREIGN KEY → auth.users.id     │    │
│  │  ├─ display_name                                       │    │
│  │  ├─ email                                              │    │
│  │  └─ business_name                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  crypto_wallets ◄─ Managed by Wallet Service          │    │
│  │  ├─ id (uuid) - PRIMARY                               │    │
│  │  ├─ user_id (uuid) - FOREIGN KEY → auth.users.id     │    │
│  │  ├─ wallet_address (text, UNIQUE per user)            │    │
│  │  ├─ chain_type (text)                                 │    │
│  │  ├─ is_primary (boolean)                              │    │
│  │  └─ created_at (timestamptz)                          │    │
│  │                                                         │    │
│  │  RLS Policies:                                         │    │
│  │  ├─ SELECT: auth.uid() = user_id                      │    │
│  │  ├─ INSERT: auth.uid() = user_id                      │    │
│  │  ├─ DELETE: auth.uid() = user_id                      │    │
│  │  └─ UPDATE: auth.uid() = user_id                      │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Signup with Wallet Generation

```
Step 1: User Signs Up
┌─────────────────────────────────────┐
│ Auth.tsx handleSubmit()             │
│ email: "user@example.com"           │
│ password: "secure_password"         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ supabase.auth.signUp()              │
│ Creates auth.users entry            │
│ Returns: user.id (UUID)             │
└────────────┬────────────────────────┘
             │
             ▼
Step 2: Create Profile
┌─────────────────────────────────────┐
│ supabase.from('profiles').insert()  │
│ user_id: (returned UUID)            │
│ display_name: "user"                │
│ email: "user@example.com"           │
└────────────┬────────────────────────┘
             │
             ▼
Step 3: Generate Wallet
┌─────────────────────────────────────┐
│ generateUserWallet()                │
│ Gets session.access_token           │
│ Calls Edge Function:                │
│ POST /functions/v1/generate_wallet  │
│ Header: Authorization: Bearer JWT   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Edge Function: generate_wallet      │
│ 1. Extract JWT from header          │
│ 2. Verify with supabase.auth.getUser(token)
│ 3. Check crypto_wallets for existing
│ 4. If exists: return existing       │
│ 5. If not: generate address         │
│    hashValue = hash(user_id)        │
│    address = "0x" + hex(40 chars)   │
│ 6. Insert into crypto_wallets       │
│    is_primary = true                │
│    chain_type = "base"              │
│ 7. Return wallet data               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Database Insert Success             │
│ crypto_wallets entry created:       │
│ {                                   │
│   id: "xxxxxxxx-xxxx-xxxx-xxxx",   │
│   user_id: "yyyyyyyy-yyyy-yyyy-yyyy",
│   wallet_address: "0x123...",       │
│   chain_type: "base",               │
│   is_primary: true,                 │
│   created_at: "2026-05-28T..."      │
│ }                                   │
└────────────┬────────────────────────┘
             │
             ▼
Step 4: User Ready
┌─────────────────────────────────────┐
│ Redirect to /dashboard              │
│ Wallet displayed immediately        │
│ No additional steps needed          │
└─────────────────────────────────────┘
```

## Data Flow: Add Additional Wallet

```
User at Profile Page
        │
        ▼
Input wallet address: 0x1234567890abcdef...
        │
        ▼
Frontend validates: isValidEthereumAddress()
        │
        ├─ Invalid? Show error
        │
        └─ Valid? Continue
          │
          ▼
addWallet(address)
        │
        ▼
supabase.from('crypto_wallets').insert({
  user_id: auth.uid(),
  wallet_address: "0x1234...",
  chain_type: "base",
  is_primary: false
})
        │
        ├─ Duplicate? Database constraint fails
        │  Show error to user
        │
        └─ Success? 
          │
          ▼
Update UI - new wallet appears in list
```

## Data Flow: Set Primary Wallet

```
User clicks star icon on wallet
        │
        ▼
setAsPrimary(walletId)
        │
        ▼
Step 1: Set all wallets to non-primary
supabase.from('crypto_wallets')
  .update({ is_primary: false })
  .eq('user_id', auth.uid())
        │
        ▼
Step 2: Set selected wallet to primary
supabase.from('crypto_wallets')
  .update({ is_primary: true })
  .eq('id', walletId)
        │
        ▼
Success - Wallet list updates
- Old primary no longer highlighted
- New primary highlighted in green
- Star icon disappears from new primary
```

## Security Model

### JWT Token Flow

```
1. User authenticates
   ├─ auth.signUp() or auth.signInWithPassword()
   └─ Returns: { session: { access_token, ... } }

2. Call Edge Function
   ├─ Header: Authorization: Bearer {access_token}
   └─ Function receives JWT in Authorization header

3. Edge Function Verification
   ├─ Extract JWT from Authorization header
   ├─ Call supabase.auth.getUser(token)
   ├─ If valid: user.id available
   ├─ If invalid: Return 401 error
   └─ Only verified users can generate wallets

4. Database Operations
   ├─ Use Service Role Key (secure)
   ├─ Insert with verified user_id
   ├─ RLS policies protect all access
   └─ Users can only access their own data
```

### Row Level Security (RLS)

```
crypto_wallets table RLS:

SELECT Policy:
  USING (auth.uid() = user_id)
  └─ Users see only their wallets

INSERT Policy:
  WITH CHECK (auth.uid() = user_id)
  └─ Users create only their wallets

UPDATE Policy:
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)
  └─ Users modify only their wallets

DELETE Policy:
  USING (auth.uid() = user_id)
  └─ Users delete only their wallets
```

## Component Integration

### Auth Component
```
Auth.tsx
├─ Signup flow
├─ Create profile
└─ Call generateUserWallet()
   ├─ Edge Function call
   └─ Wallet created
```

### Dashboard Component
```
Dashboard.tsx
├─ Load primary wallet: getPrimaryWallet()
├─ Display wallet address
├─ Copy button
└─ Link to Profile
```

### Profile Component
```
Profile.tsx
├─ Load all wallets: getAllWallets()
├─ Display wallet list
├─ Add wallet form: addWallet()
├─ Delete button: deleteWallet()
└─ Set primary button: setAsPrimary()
```

### Invoices Component
```
Invoices.tsx / InvoiceDetail.tsx
├─ Get primary wallet
├─ Generate QR code
├─ QR value = wallet_address
└─ Customer scans and pays
```

## Deployment Status

```
✅ Database Schema
   - crypto_wallets table created
   - RLS policies enabled
   - Unique constraints set

✅ Edge Function
   - generate_wallet deployed
   - JWT verification enabled
   - Status: ACTIVE

✅ Frontend Integration
   - Auth.tsx calls wallet generation
   - Wallet service module created
   - Dashboard displays wallet
   - Profile manages wallets

✅ Security
   - RLS protecting all access
   - JWT verification in Edge Function
   - Address validation
   - User isolation
```

## Summary

The wallet service is a multi-layered system:
1. **Frontend** - React components managing UI and state
2. **Service Layer** - wallet.ts utility functions
3. **Edge Function** - Serverless wallet generation
4. **Database** - Secure wallet storage with RLS
5. **Auth** - JWT verification and user isolation

All components work together to provide secure, automatic wallet generation on user signup with full management capabilities.
