# Wallet Service - Quick Reference

## TL;DR

✅ **Wallet system is LIVE and DEPLOYED**

When a user signs up:
1. Email/password authentication ✅
2. Profile created ✅
3. **Wallet automatically generated** ✅
4. User taken to dashboard with wallet ready ✅

## Key Files

| File | Purpose |
|------|---------|
| `supabase/functions/generate_wallet/index.ts` | Edge Function (serverless wallet generation) |
| `src/lib/wallet.ts` | Frontend wallet service utilities |
| `src/pages/Auth.tsx` | Signup with wallet generation |
| `src/pages/Dashboard.tsx` | Display primary wallet |
| `src/pages/Profile.tsx` | Manage wallets |

## Wallet Service Functions

```typescript
// Get primary wallet for invoicing
const wallet = await getPrimaryWallet();

// Get all user wallets
const wallets = await getAllWallets();

// Add new wallet
await addWallet('0x...');

// Delete wallet
await deleteWallet(walletId);

// Make wallet primary
await setAsPrimary(walletId);

// Validate address format
if (isValidEthereumAddress(address)) { ... }

// Format for display (shortened)
const short = formatWalletAddress('0x...');
```

## Database Table

```sql
crypto_wallets {
  id: uuid,
  user_id: uuid,
  wallet_address: text (e.g., 0x1234567890abcdef...),
  chain_type: text (default: 'base'),
  is_primary: boolean,
  created_at: timestamp
}
```

## API Endpoint

```
POST /functions/v1/generate_wallet
Header: Authorization: Bearer {JWT_TOKEN}
Response: { wallet: { wallet_address, ... } }
```

## User Flow

### Signup
```
User → Email/Password → Profile Created → Wallet Generated → Dashboard
```

### Manage Wallets
```
Profile Page → List Wallets → Add/Delete/Set Primary → Changes Saved
```

### Invoice Payment
```
Create Invoice → Primary Wallet → QR Code → Customer Scans → Pays to Address
```

## Wallet Address Format

```
0x1234567890abcdef1234567890abcdef12345678
│  └─────────────────────────────────────┘
└─ Prefix                  40 hexadecimal characters

Total: 42 characters (2 + 40)
```

## Security

- **JWT Verification:** ✅ Edge Function verifies token
- **RLS Protection:** ✅ Users only access their wallets
- **Address Validation:** ✅ Ethereum format required
- **Isolation:** ✅ No cross-user access

## Deployment Status

- Database Schema: ✅ DEPLOYED
- Edge Function: ✅ ACTIVE
- Frontend Integration: ✅ COMPLETE
- Security: ✅ VERIFIED

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No wallet on dashboard | Refresh page, check login |
| Can't add wallet | Verify format: 0x + 40 hex chars |
| "Invalid token" error | Sign out → Log back in |
| Wallet not generating | Check Edge Function logs |

## Testing It Out

1. **Sign Up**
   - Go to landing page
   - Click "CREATE ACCOUNT"
   - Enter email and password
   - Should see wallet on dashboard

2. **Manage Wallets**
   - Go to Profile
   - Add custom wallet (use any 0x... address)
   - Set as primary
   - Delete if needed

3. **Create Invoice**
   - Create invoice with client
   - View invoice detail
   - See QR code with wallet address

## Documentation

- `WALLET_SERVICE.md` - Full API reference
- `WALLET_SETUP.md` - Setup and troubleshooting
- `WALLET_ARCHITECTURE.md` - System design
- `WALLET_IMPLEMENTATION.md` - Implementation details

## Environment

No special setup needed!
- All environment variables pre-configured
- Edge Function automatically has access to secrets
- Database migrations applied
- RLS policies enabled

## Next Steps

The wallet system is ready for:
- ✅ User signups
- ✅ Invoice generation
- ✅ QR code payment requests
- ✅ Payment tracking (coming soon)
- ✅ Multi-chain support (planned)

## Support

For detailed information, see the full documentation files listed above.

For issues:
1. Check browser console
2. Review relevant documentation
3. Check Supabase logs
4. Verify database permissions

---

**Status:** Production Ready ✅
**Last Updated:** 2026-05-28
**Version:** 1.0.0
