# Wallet Not Showing? Debug Guide

If you don't see your wallet on the Dashboard, follow these steps:

## Step 1: Check Browser Console

1. Open your app in browser
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Look for error messages

Common messages:

### "No user found"
- **Problem:** You're not logged in
- **Solution:** Sign out and sign back in, or refresh page

### "No wallet found, attempting to generate..."
- **Problem:** Wallet generation is being attempted
- **Solution:** Wait a moment, refresh page

### "Error fetching wallet: [error details]"
- **Problem:** Database permission issue
- **Solution:** Check Supabase RLS policies

### "Wallet generation error: [error]"
- **Problem:** Edge Function failed
- **Solution:** Check Supabase Edge Function logs

## Step 2: Try Manual Wallet Generation

If wallet isn't showing on Dashboard:

1. Look for the message "Wallet not found"
2. You should see a button: **GENERATE WALLET NOW**
3. Click it
4. Check console for success message
5. Wallet should appear

## Step 3: Check Supabase Database

1. Go to Supabase Dashboard
2. Select your project
3. Go to "SQL Editor"
4. Run this query:

```sql
SELECT * FROM crypto_wallets;
```

Expected results:
- Should see 1+ rows
- Should have your wallet_address (0x...)
- Should have mnemonic_encrypted (long string)
- Should have private_key_encrypted (long string)

### No rows returned?
- Wallet table is empty
- Wallet generation is failing
- Check Edge Function logs

## Step 4: Check Edge Function Logs

1. Go to Supabase Dashboard
2. Go to "Edge Functions"
3. Click "generate_wallet"
4. Click "Executions" tab
5. Look for recent executions

Look for:
- **Status:** Should be "Success" (green)
- **Duration:** Should be <1000ms
- **Response:** Should show wallet data

### If Status is Error:
- Click on the error
- See full error message
- Common issues:
  - Token invalid
  - Database permission denied
  - Mnemonic generation failed

## Step 5: Check Network Requests

1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Refresh page
4. Look for request: `generate_wallet`

### If you see the request:
- Click on it
- Go to "Response" tab
- Should see JSON with wallet data

### If request fails:
- Check status code:
  - 401 = Token issue
  - 403 = Permission denied
  - 500 = Server error

## Step 6: Manual Wallet Display

If you want to see your wallet anyway:

1. Go to "Profile" page
2. Should show wallet address in YELLOW BOX
3. If shown there, wallet exists
4. Refresh Dashboard page
5. Should then appear in red/yellow boxes

## Step 7: Database Troubleshooting

### Check crypto_wallets table exists:

In Supabase SQL Editor:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'crypto_wallets';
```

Should return 1 row with `crypto_wallets`

### Check columns exist:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'crypto_wallets';
```

Should include:
- id
- user_id
- wallet_address
- mnemonic_encrypted
- private_key_encrypted
- chain_type
- is_primary
- created_at

### Check RLS is enabled:

```sql
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname = 'crypto_wallets';
```

Should show: `t` (true) for relrowsecurity

## Quick Fixes

### Fix 1: Refresh Page
```
Press F5 or Cmd+R
Wait 5 seconds
Check Dashboard
```

### Fix 2: Clear Cache
```
Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
Select "All time"
Check "Cookies and other site data"
Click "Clear data"
Reload page
```

### Fix 3: Sign Out and Back In
```
Click LOGOUT
Go back to home
Click CREATE ACCOUNT
Sign up again with different email
```

### Fix 4: Check Environment Variables
Make sure `.env` has:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## Still Not Working?

Collect this information:

1. **Browser Console Output:**
   - Screenshot or copy error messages

2. **Network Response:**
   - Go to Dev Tools → Network
   - Look for `generate_wallet` request
   - Copy full Response JSON

3. **Database Query Result:**
   - Run in Supabase SQL Editor:
   ```sql
   SELECT COUNT(*) FROM crypto_wallets;
   ```
   - What number appears?

4. **Edge Function Status:**
   - Go to Supabase → Edge Functions
   - Check if `generate_wallet` shows green (Success)

5. **User Information:**
   - What email did you sign up with?
   - When did you sign up?

Share these details for support.

## What Should Happen

### On Signup:
```
1. Enter email/password
2. Click CREATE ACCOUNT
3. System creates auth user
4. System creates profile
5. System calls generate_wallet Edge Function
6. Edge Function creates real wallet
7. Wallet stored in database (encrypted)
8. Redirect to Dashboard
9. Dashboard loads wallet from database
10. RED BOX appears with secret phrase
11. YELLOW BOX appears with wallet address
```

### If Anything Breaks:
- Console shows error
- Manual "GENERATE WALLET NOW" button appears
- Click button to retry
- Wallet should then appear

## Prevention

To avoid wallet issues:

1. ✅ Keep browser DevTools open while testing
2. ✅ Check console after every action
3. ✅ Wait for pages to fully load (5 seconds)
4. ✅ Don't refresh immediately after signup
5. ✅ Use strong password (mix of chars)
6. ✅ Keep Supabase connected
7. ✅ Check database has data

## Performance Notes

- Wallet generation: <500ms
- Dashboard loading: <2s
- If taking longer, check internet connection

## Working Wallet Sign

✅ You see RED BOX with secret phrase
✅ You see YELLOW BOX with wallet address
✅ Copy buttons work
✅ Reveal button shows words
✅ No error in console

If you have all of these, wallet is working!
