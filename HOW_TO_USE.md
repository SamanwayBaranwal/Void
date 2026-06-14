# How to Use Your Web3 Invoicing App

## Getting Started

### 1. Sign Up
```
Go to landing page
Click "CREATE ACCOUNT"
Enter email: your@email.com
Enter password: something_secure
Click "CREATE ACCOUNT"
```

**What happens automatically:**
- Your account is created
- A crypto wallet is generated
- You get a 12-word secret phrase
- You get a wallet address (0x...)
- Redirected to Dashboard

### 2. Dashboard - Your Wallet

You'll see two boxes:

#### RED BOX - SECRET PHRASE (12 WORDS)
```
Title: YOUR SECRET PHRASE
Warning: WRITE THIS DOWN & KEEP IT SAFE

Button options:
- REVEAL (show the hidden words)
- COPY (copy to clipboard once revealed)
- HIDE (hide again)

⚠️ WARNING: Anyone with this phrase can access your funds!
```

**What to do:**
1. Click REVEAL
2. Write down all 12 words in order on paper
3. Store this somewhere safe (not on computer!)
4. This is your backup - if you lose your password, you can recover your wallet

#### YELLOW BOX - WALLET ADDRESS
```
Full Address: 0x1234567890123456789012345678901234567890
Short Format: 0x1234...7890

Copy button to save to clipboard
```

**What to do:**
1. Copy this address
2. Share with clients who want to send you USDC/USDT
3. This is PUBLIC - safe to share
4. Funds will arrive here when customers pay

### 3. Add Your Business Details

Click "PROFILE" (top right)

Fill in:
- **Display Name:** How clients see you (required)
- **Email:** Contact email (required)
- **Business Name:** Your company/agency name (optional)
- **Website:** Your website URL (optional)
- **Bio:** About you (optional)

Click "SAVE PROFILE"

### 4. Add Clients

Click "ADD CLIENT" (dashboard or Clients page)

For each client, enter:
- **Name:** Their name (required)
- **Email:** Their email (required)
- **Company:** Their company (optional)
- **Wallet Address:** Their crypto wallet (optional)
- **Notes:** Any notes (optional)

Click "SAVE CLIENT"

You can edit, delete, or view all clients anytime.

### 5. Create Invoices

Click "NEW INVOICE" (dashboard or Invoices page)

Fill in:
- **Client:** Select from your client list (required)
- **Amount:** Enter amount in USD (required) - e.g., 500
- **Title:** Invoice title (required) - e.g., "Web Design Services"
- **Description:** What the invoice is for (optional)
- **Due Date:** When payment is due (optional)

Click "CREATE INVOICE"

### 6. Get Paid - Payment QR Code

View your created invoice. You'll see:

#### LEFT SIDE - Invoice Details
- Your name and business
- Client name
- Amount
- Status (Draft, Pending, Paid)
- Due date

#### RIGHT SIDE - Payment Section

**Select Payment Method:**
```
BLOCKCHAIN dropdown:
- Ethereum (most secure, slower, more expensive)
- Polygon (fast, cheap)
- Arbitrum (fast, very cheap)
- Optimism (fast, very cheap)
- Base (fastest, cheapest) ← recommended!

TOKEN dropdown:
- USDC (USD Coin)
- USDT (Tether)
```

**QR Code appears automatically** with:
```
SCAN TO PAY [TOKEN NAME]
[Large QR Code Image]
Payment instructions shown
```

### 7. Customer Pays

Your customer needs to:
1. Install a crypto wallet app (MetaMask, Trust Wallet, etc)
2. Have USDC or USDT on the selected blockchain
3. Open their wallet app
4. Scan the QR code from invoice
5. Review payment (blockchain, token, amount, address)
6. Click "Send" or "Approve"
7. Wait for transaction to confirm
8. Payment received!

### 8. Mark as Paid

When you receive payment:
1. Open the invoice
2. Click "MARK AS PAID"
3. Status changes to "PAID"
4. Shows payment date and time

---

## Quick Reference

### Your Wallet

**What it is:**
- A real Ethereum-compatible address
- Can hold USDC/USDT on any EVM chain
- Your funds - you have full control
- Can be imported into any wallet app

**How to backup:**
- Write down your 12-word phrase
- Store in safe place
- Never share with anyone
- Can restore wallet anytime from phrase

**How to spend:**
- Import phrase into MetaMask/other wallet
- Or use our dashboard (future feature)
- Then send funds wherever you want

### Creating Invoices

**Format:**
- One invoice = one payment request
- Can create unlimited invoices
- Each gets a unique number and QR code
- Stored permanently

**For each invoice:**
- Pick client
- Set amount in USD
- Describe work
- Set due date
- QR code auto-generates

**Payment:**
- Customer scans QR
- Selects blockchain and token
- Sends payment
- You receive funds
- Mark as paid

### Supported Chains

| Chain | Best For | Speed | Cost |
|-------|----------|-------|------|
| Ethereum | Security, main network | Slow | Expensive |
| Polygon | Production, many assets | Fast | Cheap |
| Arbitrum | DeFi, low fees | Fast | Cheap |
| Optimism | Low fees, scalability | Fast | Cheap |
| Base | Best fees, beginner-friendly | Very Fast | Very Cheap |

**Recommendation:** Use Base or Polygon for best user experience

### Supported Tokens

**USDC (USD Coin)**
- Issued by Circle
- Fully reserved (1 USDC = 1 USD)
- Most trusted stablecoin
- Widely accepted

**USDT (Tether)**
- Issued by Tether
- Pegged to USD
- Most widely used stablecoin
- Good alternative to USDC

---

## Troubleshooting

### Q: I can't see my wallet address
**A:** Refresh the page. If still missing, wait a moment for wallet to generate.

### Q: Where's my secret phrase?
**A:** Dashboard → RED BOX → Click "REVEAL"

### Q: How do I backup my wallet?
**A:** 
1. Go to Dashboard
2. Click REVEAL on secret phrase
3. Write down all 12 words in order
4. Store safely (paper wallet or safe deposit)

### Q: Can I recover my wallet if I forget password?
**A:** Yes! You need your 12-word secret phrase:
1. Go to any wallet app (MetaMask, etc)
2. Choose "Import Wallet"
3. Enter your 12-word phrase
4. You can access all your funds

### Q: What if I lose my secret phrase?
**A:** You cannot recover your wallet or funds. Write it down immediately!

### Q: Can I create multiple wallets?
**A:** Currently one wallet per account. We're adding multi-wallet support soon.

### Q: How long does payment take?
**A:** Depends on blockchain:
- Base: 1-2 seconds
- Polygon: 2-5 seconds
- Ethereum: 12-30 seconds
Plus wallet confirmation time

### Q: Can I change the amount after creating invoice?
**A:** Delete and create new invoice with correct amount.

### Q: What if customer sends wrong amount?
**A:** Payment is final on blockchain. Contact customer to send remaining amount.

### Q: Can customer pay with different token?
**A:** No - QR code specifies exact token. Create new invoice for different token.

### Q: Is there a fee?
**A:** No app fees! Only blockchain gas fees (paid by customer).

### Q: Can I export invoices?
**A:** Yes - click "DOWNLOAD / PRINT" on invoice detail page.

### Q: How do I get USDC/USDT?
**A:** You can:
1. Buy from exchange (Coinbase, Kraken, etc)
2. Receive as payment (this app)
3. Swap from other tokens (Uniswap, etc)
4. Earn from DeFi

---

## Security Tips

### DO:
✅ Write down your 12-word phrase
✅ Store it somewhere safe (offline)
✅ Use strong password (mix of characters)
✅ Keep browser updated
✅ Verify addresses before sending
✅ Take screenshots of invoices

### DON'T:
❌ Share your secret phrase
❌ Share your private key
❌ Use simple passwords
❌ Click links from emails
❌ Screenshot sensitive info
❌ Use same password everywhere
❌ Share wallet details publicly

---

## Examples

### Example 1: Freelancer Invoice

```
Invoice created for: Acme Corp
Amount: $2,000 (2000 USDC on Base)
Description: Website redesign - 40 hours

Invoice shows QR code:
- Blockchain: Base
- Token: USDC
- Amount: 2000
- Recipient: 0x1234...

Client scans QR with MetaMask:
→ MetaMask shows: Send 2000 USDC to 0x1234...
→ Client clicks Approve
→ Transaction sent
→ Payment confirmed in 2 seconds
→ You receive 2000 USDC!
```

### Example 2: Agency Invoice

```
Invoice for: TechCorp
Amount: $5,500 (5500 USDC on Polygon)
Description: Q1 Marketing Services

Client in different country:
→ Uses USDC instead of wiring
→ Much cheaper, instant confirmation
→ No bank intermediaries
→ 24/7 availability
```

### Example 3: International Payment

```
Freelancer in: India
Client in: US
Amount: $1,000 USD

Without crypto:
- Bank transfer: 3-5 days
- Fees: $20-50
- Exchange rate: Variable

With this app:
- Payment: 1-30 seconds (depending on chain)
- Fees: $0.01-0.50
- Exchange rate: Fixed at time of transaction
- 24/7 availability
```

---

## Advanced Features (Coming Soon)

- [ ] Multiple wallets per account
- [ ] Recurring invoices
- [ ] Payment tracking dashboard
- [ ] Automatic payment notifications
- [ ] CSV export of invoices
- [ ] API for integrations
- [ ] Invoice templates
- [ ] Multi-signature support
- [ ] Hardware wallet integration

---

## Support

For issues:
1. Check this guide first
2. Try refreshing browser
3. Check browser console (F12) for errors
4. Clear browser cache and cookies
5. Try different browser
6. Contact support with error message

---

## Remember

Your wallet is **your bank**. Be responsible:
- Never lose your seed phrase
- Never share it
- Always verify addresses
- Keep funds in stablecoin if not trading
- Use strong passwords
- Back up everything

You now have a decentralized, permissionless wallet that:
✅ Works 24/7
✅ Needs no bank
✅ Takes no middleman
✅ Is always accessible
✅ Belongs 100% to you

Welcome to Web3! 🚀
