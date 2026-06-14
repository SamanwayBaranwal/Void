import { supabase } from './supabase';
import { ethers } from 'ethers';

export interface WalletData {
  id: string;
  address: string;
  label?: string;
  isPrivy?: boolean;
  hasSecret?: boolean;
}

export interface PaymentQRData {
  token: 'USDC' | 'USDT';
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
  recipient: string;
  amount: string;
}

// Token addresses on different chains
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  ethereum: {
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
  polygon: {
    USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  },
  arbitrum: {
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
  },
  optimism: {
    USDC: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
    USDT: '0x94b008aa00579c1307b0ef2c499ad23d3eb3db7f',
  },
  base: {
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b1566469c3d',
    USDT: '0xfde4c96c8593536e31f543899d1f18e02ae0cdc2',
  },
};

/**
 * Save a wallet address linked to a Privy user.
 * The address can be from Privy's embedded wallet or imported externally.
 */
export async function registerWalletAddress(
  privyId: string,
  address: string,
  label = 'Privy Wallet',
  isPrimary = true,
): Promise<void> {
  // Check if this address is already saved for this user
  const { data: existing } = await supabase
    .from('crypto_wallets')
    .select('id')
    .eq('privy_id', privyId)
    .eq('wallet_address', address)
    .maybeSingle();

  if (existing) return; // already saved, nothing to do

  // If marking as primary, unset current primary first
  if (isPrimary) {
    await supabase
      .from('crypto_wallets')
      .update({ is_primary: false })
      .eq('privy_id', privyId)
      .eq('is_primary', true);
  }

  const { error } = await supabase.from('crypto_wallets').insert({
    privy_id: privyId,
    wallet_address: address,
    is_primary: isPrimary,
    chain_type: 'evm',
  });

  if (error) throw error;
}

/**
 * Import an external wallet address (not Privy-managed).
 */
export async function importWalletAddress(
  privyId: string,
  address: string,
  label: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('crypto_wallets')
    .select('id')
    .eq('privy_id', privyId)
    .eq('wallet_address', address)
    .maybeSingle();

  if (existing) throw new Error('This address is already in your wallet list.');

  const { error } = await supabase.from('crypto_wallets').insert({
    privy_id: privyId,
    wallet_address: address,
    is_primary: false,
    chain_type: 'evm',
  });

  if (error) throw error;
}

/**
 * Set a wallet as the primary payment address.
 */
export async function setPrimaryWallet(privyId: string, walletId: string): Promise<void> {
  await supabase
    .from('crypto_wallets')
    .update({ is_primary: false })
    .eq('privy_id', privyId);

  const { error } = await supabase
    .from('crypto_wallets')
    .update({ is_primary: true })
    .eq('id', walletId)
    .eq('privy_id', privyId);

  if (error) throw error;
}

/**
 * Get the primary wallet address for a user.
 */
export async function getPrimaryWallet(privyId: string): Promise<WalletData | null> {
  const { data: wallet } = await supabase
    .from('crypto_wallets')
    .select('id, wallet_address, is_primary')
    .eq('privy_id', privyId)
    .eq('is_primary', true)
    .maybeSingle();

  return wallet
    ? { id: wallet.id, address: wallet.wallet_address, hasSecret: false }
    : null;
}

/**
 * Get all wallets for a user.
 */
export async function getAllWallets(privyId: string): Promise<WalletData[]> {
  const { data: wallets } = await supabase
    .from('crypto_wallets')
    .select('id, wallet_address, is_primary')
    .eq('privy_id', privyId)
    .order('created_at', { ascending: false });

  return (wallets || []).map((w) => ({
    id: w.id,
    address: w.wallet_address,
    hasSecret: false,
  }));
}

/**
 * Delete a wallet address.
 */
export async function deleteWallet(privyId: string, walletId: string): Promise<void> {
  const { error } = await supabase
    .from('crypto_wallets')
    .delete()
    .eq('id', walletId)
    .eq('privy_id', privyId);

  if (error) throw error;
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatWalletAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generate a payment QR code using the standard ERC-20 transfer URI (EIP-681).
 */
export async function generatePaymentInstructionQR(
  token: 'USDC' | 'USDT',
  chain: string,
  recipientAddress: string,
  amount: string,
): Promise<string> {
  const QRCode = await import('qrcode') as any;

  const tokenAddress = TOKEN_ADDRESSES[chain]?.[token];
  if (!tokenAddress) throw new Error(`${token} not supported on ${chain}`);

  const chainId = getChainId(chain);
  // EIP-681 standard: ethereum:<tokenAddress>@<chainId>/transfer?address=<recipient>&uint256=<amount_in_base_units>
  // Amount in base units (USDC/USDT have 6 decimals)
  const amountBaseUnits = Math.round(parseFloat(amount) * 1_000_000).toString();
  const uri = `ethereum:${tokenAddress}@${chainId}/transfer?address=${recipientAddress}&uint256=${amountBaseUnits}`;

  const qrUrl = await QRCode.default.toDataURL(uri, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return qrUrl;
}

// ─── On-chain payment verification ───────────────────────────────────────────
// Public RPC endpoints (CORS-enabled, no API key required)
const RPC_URLS: Record<string, string> = {
  ethereum: 'https://ethereum-rpc.publicnode.com',
  polygon:  'https://polygon-bor-rpc.publicnode.com',
  arbitrum: 'https://arbitrum-one-rpc.publicnode.com',
  optimism: 'https://optimism-rpc.publicnode.com',
  base:     'https://base-rpc.publicnode.com',
};

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Block-explorer base URLs per chain
const EXPLORERS: Record<string, string> = {
  ethereum: 'https://etherscan.io',
  polygon:  'https://polygonscan.com',
  arbitrum: 'https://arbiscan.io',
  optimism: 'https://optimistic.etherscan.io',
  base:     'https://basescan.org',
};

/** Block-explorer link for a transaction on a given chain. */
export function getExplorerTxUrl(chain: string, txHash: string): string {
  const base = EXPLORERS[chain] || EXPLORERS.ethereum;
  return `${base}/tx/${txHash}`;
}

export interface OnchainPayment {
  txHash: string;
  amount: number;
  from: string;
  chain: string;
  token: string;
}

/** Current block number for a chain — used as the baseline when monitoring starts. */
export async function getCurrentBlock(chain: string): Promise<number> {
  const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
  return provider.getBlockNumber();
}

/**
 * Scan a chain for an incoming USDC/USDT transfer to `recipient` of at least
 * `expectedAmount` (with 1% tolerance) since `fromBlock`. Returns the matching
 * payment (with tx hash) or null. This is how we auto-verify payment on-chain.
 */
export async function checkForPayment(
  chain: string,
  token: 'USDC' | 'USDT',
  recipient: string,
  expectedAmount: number,
  fromBlock: number,
): Promise<OnchainPayment | null> {
  const tokenAddress = TOKEN_ADDRESSES[chain]?.[token];
  if (!tokenAddress || !RPC_URLS[chain]) return null;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URLS[chain]);
    const latest = await provider.getBlockNumber();
    const toTopic = ethers.zeroPadValue(recipient.toLowerCase(), 32);

    const logs = await provider.getLogs({
      address: tokenAddress,
      topics: [TRANSFER_TOPIC, null, toTopic],
      fromBlock: Math.max(0, fromBlock),
      toBlock: latest,
    });

    // USDC/USDT use 6 decimals — allow 1% tolerance for rounding/fees
    const expectedBase = BigInt(Math.round(expectedAmount * 1_000_000));
    const minBase = (expectedBase * 99n) / 100n;

    for (const log of logs) {
      const value = BigInt(log.data);
      if (value >= minBase) {
        return {
          txHash: log.transactionHash,
          amount: Number(value) / 1_000_000,
          from: '0x' + log.topics[1].slice(26),
          chain,
          token,
        };
      }
    }
  } catch (err) {
    console.error(`[checkForPayment] ${chain}/${token}:`, err);
  }
  return null;
}

/**
 * Scan ALL supported chains + tokens at once for a matching incoming payment.
 * `baseline` maps each chain id → the block number captured when monitoring began.
 */
export async function scanAllChainsForPayment(
  recipient: string,
  expectedAmount: number,
  baseline: Record<string, number>,
): Promise<OnchainPayment | null> {
  const checks: Promise<OnchainPayment | null>[] = [];
  for (const chain of Object.keys(RPC_URLS)) {
    const fromBlock = baseline[chain] ?? 0;
    checks.push(checkForPayment(chain, 'USDC', recipient, expectedAmount, fromBlock));
    checks.push(checkForPayment(chain, 'USDT', recipient, expectedAmount, fromBlock));
  }
  const results = await Promise.all(checks);
  return results.find(r => r !== null) || null;
}

/** Capture the current block on every chain — the baseline for payment monitoring. */
export async function captureBaselineBlocks(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    Object.keys(RPC_URLS).map(async chain => {
      try { return [chain, await getCurrentBlock(chain)] as const; }
      catch { return [chain, 0] as const; }
    }),
  );
  return Object.fromEntries(entries);
}

function getChainId(chain: string): number {
  const chainIds: Record<string, number> = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
  };
  return chainIds[chain] || 1;
}

export const SUPPORTED_CHAINS = [
  { id: 'base', name: 'Base', chainId: 8453 },
  { id: 'ethereum', name: 'Ethereum', chainId: 1 },
  { id: 'polygon', name: 'Polygon', chainId: 137 },
  { id: 'arbitrum', name: 'Arbitrum', chainId: 42161 },
  { id: 'optimism', name: 'Optimism', chainId: 10 },
];

export const SUPPORTED_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
];
