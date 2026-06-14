# Wallet Service Documentation

## Overview

The Wallet Service is a critical component of the CHAIN platform that handles automatic crypto wallet generation, management, and tracking for each user. When a user signs up, they immediately receive a unique Ethereum-style wallet address on the Base chain.

## Architecture

### Components

1. **Edge Function** (`supabase/functions/generate_wallet/index.ts`)
   - Handles automatic wallet generation on user signup
   - Verifies JWT tokens and authenticates requests
   - Generates deterministic wallet addresses based on user ID
   - Stores wallet data in Supabase

2. **Wallet Service Module** (`src/lib/wallet.ts`)
   - Frontend utility functions for wallet operations
   - Wallet CRUD operations
   - Wallet validation and formatting
   - Primary wallet management

3. **Database Tables**
   - `crypto_wallets`: Stores wallet addresses, chain type, and primary flag

## How It Works

### Automatic Wallet Generation on Signup

1. User signs up with email/password
2. Auth flow creates user account in Supabase Auth
3. User profile is created in `profiles` table
4. Wallet generation function is called automatically
5. Edge Function verifies JWT token
6. Generates deterministic wallet address from user ID
7. Stores wallet in `crypto_wallets` table with `is_primary = true`
8. User is redirected to dashboard with wallet ready to use

### Wallet Address Generation

The system uses a deterministic algorithm to generate wallet addresses:

```typescript
function generateWalletAddress(userId: string): string {
  // 1. Create initial hash from user ID
  // 2. Combine with timestamp for uniqueness
  // 3. Generate 40 hex characters (Ethereum standard)
  // 4. Return 0x-prefixed address
}
```

**Benefits:**
- Deterministic: Same user always gets same wallet
- Unique: No collisions between users
- Ethereum-compatible: Standard 0x + 40 hex format
- No external dependencies: Pure hash-based generation

### Multiple Wallets Support

Users can add multiple wallets:
- One wallet marked as PRIMARY (used for invoicing by default)
- Additional wallets for different purposes
- Can switch primary wallet anytime
- Easy deletion of unused wallets

## API Reference

### Frontend Functions (`src/lib/wallet.ts`)

#### `generateUserWallet()`
Manually trigger wallet generation for current user.

```typescript
const { wallet, message } = await generateUserWallet();
```

#### `getPrimaryWallet()`
Get the user's primary wallet.

```typescript
const primaryWallet = await getPrimaryWallet();
// { id, user_id, wallet_address, chain_type, is_primary, created_at }
```

#### `getAllWallets()`
Get all wallets for current user.

```typescript
const wallets = await getAllWallets();
// [{ ... }, { ... }]
```

#### `addWallet(walletAddress: string)`
Add a new wallet address.

```typescript
const newWallet = await addWallet('0x1234567890abcdef...');
```

#### `deleteWallet(walletId: string)`
Remove a wallet.

```typescript
await deleteWallet(walletId);
```

#### `setAsPrimary(walletId: string)`
Make a wallet the primary one.

```typescript
const wallet = await setAsPrimary(walletId);
```

#### `isValidEthereumAddress(address: string)`
Validate wallet address format.

```typescript
if (isValidEthereumAddress(address)) {
  // Valid address
}
```

#### `formatWalletAddress(address: string)`
Format address for display (shortened).

```typescript
const short = formatWalletAddress('0x1234567890abcdef...');
// '0x1234...cdef'
```

### Edge Function Endpoint

**URL:** `POST /functions/v1/generate_wallet`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Response (Success 200):**
```json
{
  "success": true,
  "wallet": {
    "id": "uuid",
    "user_id": "uuid",
    "wallet_address": "0x...",
    "chain_type": "base",
    "is_primary": true,
    "created_at": "2026-05-28T..."
  },
  "message": "Wallet generated successfully"
}
```

**Response (Already Exists 200):**
```json
{
  "success": true,
  "wallet": { ... },
  "message": "Wallet already exists"
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

## Integration Points

### Auth Flow
- Called automatically after successful signup in `Auth.tsx`
- Uses JWT from session for verification
- Non-blocking: Continues even if wallet generation fails

### Dashboard
- Displays primary wallet address
- Shows copy-to-clipboard button
- Provides shortcut to manage wallets

### Profile Page
- Full wallet management interface
- Add new wallets
- Delete wallets
- Set primary wallet
- Validate Ethereum addresses

### Invoices
- Uses primary wallet address for QR code generation
- Customer sends payment to this address
- Can override with client's wallet for multi-sig scenarios

## Security Considerations

### Row Level Security (RLS)
All wallet operations are protected by RLS policies:

```sql
-- Users can only view their own wallets
SELECT: user_id = auth.uid()

-- Users can only insert their own wallets
INSERT: user_id = auth.uid()

-- Users can only delete their own wallets
DELETE: user_id = auth.uid()
```

### JWT Verification
- Edge Function verifies JWT token before operations
- Only authenticated users can generate wallets
- Service role key used for database operations (secure)

### Address Validation
- Ethereum address format validation on frontend
- Only valid 0x + 40 hex addresses accepted
- Prevents invalid wallet addresses from being stored

### Privacy
- Wallet addresses are private (RLS protected)
- Users see full addresses only in their account
- Invoice QR codes display wallet address (intentional)

## Data Model

### crypto_wallets Table

```sql
CREATE TABLE crypto_wallets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,           -- Foreign key to auth.users
  wallet_address text NOT NULL,    -- 0x... format
  chain_type text DEFAULT 'base',  -- blockchain name
  is_primary boolean DEFAULT false,-- invoice default
  created_at timestamptz,
  UNIQUE(user_id, wallet_address)  -- prevent duplicates
);
```

## Future Enhancements

1. **Blockchain Integration**
   - Connect to actual Base blockchain
   - Real wallet creation instead of deterministic generation
   - On-chain transaction tracking

2. **Multi-Chain Support**
   - Add wallets on Ethereum, Polygon, etc.
   - Per-wallet chain selection
   - Cross-chain payment aggregation

3. **Wallet Verification**
   - Verify wallet ownership (sign message)
   - Prevent unauthorized address claims
   - Increase security

4. **Payment Tracking**
   - Monitor incoming payments
   - Real-time payment notifications
   - Blockchain event webhooks

5. **Wallet Labeling**
   - Custom names for wallets
   - Tags (personal, business, etc.)
   - Notes and descriptions

## Troubleshooting

### Wallet Not Generated After Signup
- Check if user session is valid
- Verify Edge Function is deployed
- Check browser console for errors
- Manually trigger generation from dashboard

### Can't Add Custom Wallet
- Verify address format (0x + 40 hex chars)
- Check for duplicate addresses
- Ensure user is authenticated
- Check RLS policies are correct

### Primary Wallet Not Updating
- Refresh the page
- Check if wallet exists
- Verify database permissions
- Check for concurrent operations

## Testing

### Manual Testing
1. Sign up new user
2. Check Dashboard - should show wallet
3. Copy wallet address
4. Go to Profile
5. Add additional wallet (test with generated address)
6. Set as primary
7. Delete wallet
8. Verify primary changed appropriately

### Automated Testing
```typescript
// Example test case
describe('Wallet Service', () => {
  it('should generate wallet on signup', async () => {
    // Sign up user
    // Call generateUserWallet()
    // Assert wallet exists in database
    // Assert format is valid
  });
});
```

## Monitoring

Track wallet generation success:
- Edge Function logs
- Database insert counts
- User signup to wallet generation ratio
- Failed generation attempts

## Support

For wallet-related issues:
1. Check JWT token validity
2. Verify database connection
3. Review RLS policies
4. Check Edge Function logs
5. Validate wallet address format
