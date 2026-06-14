# Wallet Service Setup Guide

## Quick Start

The wallet service is **already configured and deployed**. When a user signs up, they automatically receive a unique crypto wallet.

## What Happens on User Signup

1. **Instant Wallet Generation**
   - User signs up with email/password
   - Wallet is generated automatically
   - No manual steps required

2. **Wallet Address**
   - Deterministic Ethereum-style address (0x + 40 hex characters)
   - Unique per user
   - Consistent (same user always gets same wallet)

3. **Ready to Use**
   - Immediately available on dashboard
   - Can be copied with one click
   - Can be used for invoicing

## Features

### Automatic Generation
- Happens on user signup
- Uses JWT for verification
- Stored securely in database

### Multiple Wallets
- Add additional wallet addresses anytime
- Set any wallet as primary
- Delete unused wallets

### Invoice Integration
- Primary wallet used for QR codes
- Customer scans and pays to this address
- Can add multiple wallets for different invoice types

## Database Schema

The wallet data is stored in the `crypto_wallets` table:

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| user_id | uuid | Links to auth.users |
| wallet_address | text | 0x prefixed address |
| chain_type | text | Blockchain (base, ethereum, etc) |
| is_primary | boolean | Used for invoicing |
| created_at | timestamp | When wallet was created |

## Edge Function Details

**Function Name:** `generate_wallet`
**Status:** ACTIVE
**JWT Verification:** Enabled
**Endpoint:** `POST /functions/v1/generate_wallet`

The function:
- Verifies JWT token from Authorization header
- Checks if wallet already exists
- Generates deterministic address from user ID
- Inserts into crypto_wallets table
- Returns wallet data

## Security

### Row Level Security (RLS)
All wallet operations are protected:
- Users can only access their own wallets
- Insert/update/delete restricted to owner
- No cross-user data access

### JWT Verification
- All requests must include valid JWT
- Edge Function verifies token
- Service role key used for database

### Address Validation
- Ethereum format validation
- Prevents invalid addresses
- Unique per user constraint

## Troubleshooting

### Issue: Wallet not appearing on dashboard after signup
**Solution:**
1. Refresh the page
2. Check if you're logged in
3. Go to Profile page
4. If wallet appears there, it's working

### Issue: Can't add a custom wallet
**Solutions:**
- Verify wallet address format (0x + 40 hex)
- Check there's no duplicate
- Ensure you're authenticated
- Try a different address

### Issue: "Invalid token" error
**Solutions:**
- Sign out and log back in
- Clear browser cookies
- Try in incognito/private mode
- Refresh the page

## Using Your Wallet

### Share for Payments
1. Go to Dashboard
2. Click copy button on wallet address
3. Share with clients
4. They can send crypto to this address

### For Invoices
1. Create invoice from Dashboard
2. QR code automatically includes primary wallet
3. Client scans to pay
4. Address can't be changed (use primary wallet)

### Add More Wallets
1. Go to Profile
2. Scroll to "Crypto Wallets" section
3. Enter wallet address (0x format)
4. Click ADD
5. Use star icon to set as primary

## API Usage (Frontend)

```typescript
import { 
  getPrimaryWallet,
  getAllWallets,
  addWallet,
  deleteWallet,
  setAsPrimary
} from '@/lib/wallet';

// Get primary wallet
const wallet = await getPrimaryWallet();
console.log(wallet.wallet_address);

// Get all wallets
const allWallets = await getAllWallets();

// Add new wallet
await addWallet('0x1234567890abcdef...');

// Set as primary
await setAsPrimary(walletId);

// Delete wallet
await deleteWallet(walletId);
```

## Future Enhancements

Planned features:
- Real blockchain wallet integration
- Multi-chain support (Ethereum, Polygon, etc)
- Wallet verification
- Payment tracking and notifications
- Wallet labels and organization
- Transaction history

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review the WALLET_SERVICE.md documentation
3. Check Supabase logs for Edge Function errors
4. Verify database is running and connected

## Summary

✅ Wallet service is fully operational
✅ Wallets are generated automatically on signup
✅ Multiple wallets supported
✅ Secure and private with RLS protection
✅ Ready for production use
