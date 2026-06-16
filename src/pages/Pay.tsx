import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  generatePaymentInstructionQR, SUPPORTED_CHAINS, SUPPORTED_TOKENS,
  captureBaselineBlocks, scanAllChainsForPayment, getExplorerTxUrl, payWithWallet, type OnchainPayment,
} from '../lib/wallet';
import { Copy, Check, X, Loader, Wallet, ShieldCheck, Zap, Lock } from 'lucide-react';

/** Address with the leading 0x+chars and trailing chars highlighted, so the
 *  payer can verify they're sending to the right place — no mistakes. */
function AddressHL({ address, size = 12 }: { address: string; size?: number }) {
  if (!address) return null;
  const head = address.slice(0, 6);   // 0x + 4
  const mid = address.slice(6, -4);
  const tail = address.slice(-4);
  return (
    <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: size, wordBreak: 'break-all', lineHeight: 1.5 }}>
      <span style={{ color: '#6EE7B7', fontWeight: 700, background: 'rgba(110,231,183,0.08)', padding: '1px 2px', borderRadius: '2px' }}>{head}</span>
      <span style={{ color: '#4B5563' }}>{mid}</span>
      <span style={{ color: '#6EE7B7', fontWeight: 700, background: 'rgba(110,231,183,0.08)', padding: '1px 2px', borderRadius: '2px' }}>{tail}</span>
    </code>
  );
}

const GRID_BG: React.CSSProperties = {
  minHeight: '100vh',
  background: '#000000',
  backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
  backgroundSize: '48px 48px',
  backgroundAttachment: 'fixed',
  fontFamily: 'JetBrains Mono, monospace',
  color: '#F5F5F5',
};

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

const corners: React.CSSProperties = { position: 'absolute', width: '12px', height: '12px' };

function PixelCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '28px', position: 'relative', ...style }}>
      <span style={{ ...corners, top: -1, left: -1, borderTop: '2px solid #F5F5F5', borderLeft: '2px solid #F5F5F5' }} />
      <span style={{ ...corners, top: -1, right: -1, borderTop: '2px solid #F5F5F5', borderRight: '2px solid #F5F5F5' }} />
      <span style={{ ...corners, bottom: -1, left: -1, borderBottom: '2px solid #F5F5F5', borderLeft: '2px solid #F5F5F5' }} />
      <span style={{ ...corners, bottom: -1, right: -1, borderBottom: '2px solid #F5F5F5', borderRight: '2px solid #F5F5F5' }} />
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
    paid:    { bg: 'rgba(110,231,183,0.08)',   color: '#6EE7B7', border: 'rgba(110,231,183,0.2)',   label: 'PAYMENT CONFIRMED' },
    pending: { bg: 'rgba(107,114,128,0.08)', color: '#6B7280', border: 'rgba(107,114,128,0.2)', label: 'AWAITING PAYMENT' },
    overdue: { bg: 'rgba(255,77,77,0.08)',   color: '#FF4D4D', border: 'rgba(255,77,77,0.2)',   label: 'OVERDUE' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ ...MONO, background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  );
}

export default function Pay() {
  const { id } = useParams();
  const [invoice, setInvoice]         = useState<any>(null);
  const [client, setClient]           = useState<any>(null);
  const [profile, setProfile]         = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [selectedChain, setSelectedChain] = useState('base');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [qrUrl, setQrUrl]             = useState('');
  const [copied, setCopied]           = useState(false);

  useEffect(() => { if (id) load(); }, [id]);
  useEffect(() => { if (walletAddress && invoice) generateQR(); }, [walletAddress, selectedChain, selectedToken, invoice]);

  const load = async () => {
    const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
    if (!inv) { setLoading(false); return; }
    setInvoice(inv);
    const [{ data: cl }, { data: pr }, { data: wl }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', inv.client_id).maybeSingle(),
      supabase.from('profiles').select('*').eq('privy_id', inv.privy_id).maybeSingle(),
      supabase.from('crypto_wallets').select('wallet_address').eq('privy_id', inv.privy_id).eq('is_primary', true).maybeSingle(),
    ]);
    setClient(cl);
    setProfile(pr);
    if (wl) setWalletAddress(wl.wallet_address);
    setLoading(false);
  };

  const generateQR = async () => {
    if (!walletAddress || !invoice) return;
    try {
      const url = await generatePaymentInstructionQR(
        selectedToken as 'USDC' | 'USDT', selectedChain,
        walletAddress, invoice.amount_usd.toString(),
      );
      setQrUrl(url);
    } catch (e) { console.error(e); }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [confirming, setConfirming] = useState(false);
  const [watching, setWatching]     = useState(false);
  const baselineRef = useRef<Record<string, number> | null>(null);

  // ── 30-minute link expiry + live countdown ──────────────
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ttlMin = invoice?.link_ttl_minutes ?? 30;          // per-invoice validity
  const neverExpires = ttlMin === 0;
  const expiresAt = invoice && !neverExpires ? new Date(invoice.created_at).getTime() + ttlMin * 60000 : 0;
  const msLeft = neverExpires ? Infinity : Math.max(0, expiresAt - now);
  const expired = !!invoice && invoice.status !== 'paid' && !neverExpires && msLeft <= 0;
  const fmtLeft = () => {
    if (neverExpires) return '';
    const totalMin = Math.floor(msLeft / 60000);
    if (totalMin >= 60) { const h = Math.floor(totalMin / 60); return `${h}h ${totalMin % 60}m`; }
    return `${String(totalMin).padStart(2, '0')}:${String(Math.floor((msLeft % 60000) / 1000)).padStart(2, '0')}`;
  };
  const countdown = fmtLeft();

  // ── Pay directly from a browser wallet ──────────────────
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const handlePayWithWallet = async () => {
    if (!invoice || !walletAddress) return;
    setPaying(true); setPayError('');
    try {
      const { txHash } = await payWithWallet(selectedChain, selectedToken as 'USDC' | 'USDT', walletAddress, Number(invoice.amount_usd));
      await markPaid({ txHash, chain: selectedChain, token: selectedToken, amount: Number(invoice.amount_usd), from: '' });
    } catch (e: any) {
      setPayError(e?.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  // Mark the invoice paid (shared by auto-detect + manual fallback)
  const markPaid = async (onchain?: OnchainPayment) => {
    if (!invoice) return;
    // Always mark paid (works regardless of schema version)
    await supabase.from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoice.id);
    // Best-effort: store on-chain proof (requires the payment-proof migration)
    if (onchain) {
      const { error } = await supabase.from('invoices')
        .update({ tx_hash: onchain.txHash, paid_chain: onchain.chain, paid_token: onchain.token })
        .eq('id', invoice.id);
      if (error) console.warn('Payment-proof columns not present yet — run the migration.', error.message);
    }
    setShowModal(false);
    await load(); // reloads → shows the confirmed "paid" state
  };

  const confirmPayment = async () => {
    if (!invoice) return;
    setConfirming(true);
    try { await markPaid(); }
    catch (e) { console.error(e); }
    finally { setConfirming(false); }
  };

  // ─── Real-time on-chain auto-verification ───────────────────────────────
  // While the invoice is unpaid, poll every chain/token for an incoming
  // transfer to the wallet matching the amount. When found → auto-mark paid.
  useEffect(() => {
    if (!invoice || invoice.status === 'paid' || !walletAddress) return;
    let cancelled = false;
    let timer: any;

    const start = async () => {
      setWatching(true);
      baselineRef.current = await captureBaselineBlocks();

      const poll = async () => {
        if (cancelled || !baselineRef.current) return;
        // Stop watching once the link's validity window closes (0 = never)
        const ttl = invoice.link_ttl_minutes ?? 30;
        if (ttl > 0 && Date.now() > new Date(invoice.created_at).getTime() + ttl * 60000) {
          setWatching(false); return;
        }
        const hit = await scanAllChainsForPayment(
          walletAddress, Number(invoice.amount_usd), baselineRef.current,
        );
        if (hit && !cancelled) {
          setWatching(false);
          await markPaid(hit);
          return; // stop polling
        }
        if (!cancelled) timer = setTimeout(poll, 12000); // re-check every 12s
      };
      timer = setTimeout(poll, 8000); // first check after 8s
    };
    start();

    return () => { cancelled = true; clearTimeout(timer); setWatching(false); };
  }, [invoice?.id, invoice?.status, walletAddress]);

  const chainName = SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name || selectedChain;

  /* ─── Loading ─────────────────────────────────────────── */
  if (loading) return (
    <div style={{ ...GRID_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <img src="/assets/ash/ash-running-loading.png" width="170" alt="" onError={e => e.currentTarget.style.display = 'none'} />
      <p style={{ ...MONO, fontSize: '12px', color: '#6B7280' }}>Loading...</p>
    </div>
  );

  /* ─── Not found ───────────────────────────────────────── */
  if (!invoice) return (
    <div style={{ ...GRID_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <img src="/assets/ash/ash-confused-error.png" width="200" alt="" onError={e => e.currentTarget.style.display = 'none'} />
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5' }}>Invoice not found.</p>
      <p style={{ fontSize: '13px', color: '#6B7280' }}>This link may be expired or invalid.</p>
    </div>
  );

  /* ─── From address lines ──────────────────────────────── */
  const fromLines = [
    profile?.street_address,
    [profile?.city, profile?.state, profile?.postal_code].filter(Boolean).join(', '),
    profile?.country,
  ].filter(Boolean);

  return (
    <div style={{ ...GRID_BG, padding: '40px 20px 60px' }}>

      {/* ── Top logo ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 8px)', gap: '5px' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FFFFFF', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
            ))}
          </div>
          <span style={{ ...MONO, fontSize: '28px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.16em', textShadow: '0 0 24px rgba(255,255,255,0.25)' }}>VOID</span>
        </div>
        <p style={{ ...MONO, fontSize: '11px', color: '#6B7280', letterSpacing: '0.12em' }}>SECURE · PRIVATE · ONCHAIN</p>
      </div>

      {/* ── Main invoice card ──────────────────────────────── */}
      <div style={{ maxWidth: '580px', margin: '0 auto 40px', position: 'relative' }}>
        <PixelCard style={{ overflow: 'hidden' }}>

          {/* Frame overlay */}
          <img src="/assets/textures/void-invoice-card-frame.png" alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.35, zIndex: 0 }}
            onError={e => e.currentTarget.style.display = 'none'} />

          <div style={{ position: 'relative', zIndex: 1 }}>

            {/* Card header: logo + status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <img src="/assets/logos/void-logo-white.png" alt="VOID" style={{ width: '48px' }}
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <StatusBadge status={invoice.status} />
            </div>

            {/* Invoice number + date */}
            <p style={{ ...MONO, fontSize: '22px', fontWeight: 500, color: '#F5F5F5', marginBottom: '4px' }}>
              #{invoice.invoice_number}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>
              Issued on {new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>

            {/* FROM / TO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'FROM', name: profile?.business_name || (profile?.display_name && profile.display_name !== 'My Account' ? profile.display_name : 'Your business name'), company: profile?.business_name ? (profile?.display_name && profile.display_name !== 'My Account' ? profile.display_name : null) : null, email: profile?.email, lines: fromLines, tax: profile?.tax_id },
                { label: 'TO',   name: client?.name,           company: client?.company,        email: client?.email,  lines: [],        tax: null },
              ].map((b, i) => (
                <div key={i} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
                  <p style={{ ...MONO, fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{b.label}</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '3px' }}>{b.name || '—'}</p>
                  {b.company && <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{b.company}</p>}
                  {b.email   && <p style={{ fontSize: '11px', color: '#6B7280' }}>{b.email}</p>}
                  {b.lines.map((line, j) => (
                    <p key={j} style={{ ...MONO, fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{line}</p>
                  ))}
                  {b.tax && (
                    <p style={{ ...MONO, fontSize: '10px', color: '#444444', marginTop: '6px' }}>TAX ID: {b.tax}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '10px 14px', background: '#050505', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ ...MONO, fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DESCRIPTION</p>
                <p style={{ ...MONO, fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>AMOUNT</p>
              </div>
              {/* Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '14px', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#F5F5F5', marginBottom: invoice.description ? '4px' : 0 }}>{invoice.title}</p>
                  {invoice.description && (
                    <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{invoice.description}</p>
                  )}
                </div>
                <p style={{ ...MONO, fontSize: '14px', color: '#F5F5F5', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  ${Number(invoice.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Total due */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginBottom: invoice.status !== 'paid' && walletAddress ? '24px' : 0 }}>
              <p style={{ ...MONO, fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>TOTAL DUE</p>
              <p style={{ ...MONO, fontSize: '40px', fontWeight: 500, color: '#F5F5F5', lineHeight: 1, marginBottom: '6px' }}>
                ${Number(invoice.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>USD · Payable in USDC or USDT</p>
            </div>

            {/* CTA — active (not paid, not expired) */}
            {invoice.status !== 'paid' && walletAddress && !expired && (
              <>
                <button onClick={() => setShowModal(true)}
                  style={{ width: '100%', padding: '15px', background: '#F5F5F5', color: '#000000', border: 'none', borderRadius: '4px', fontSize: '15px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <Wallet size={16} /> PAY NOW
                </button>

                {/* Countdown — only when the link has an expiry */}
                {!neverExpires && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: msLeft < 5 * 60000 ? '#FF4D4D' : '#FBBF24', display: 'inline-block' }} />
                    <span style={{ ...MONO, fontSize: '11px', color: '#6B7280' }}>
                      This payment link expires in <span style={{ color: msLeft < 5 * 60000 ? '#FF4D4D' : '#F5F5F5', fontWeight: 600 }}>{countdown}</span>
                    </span>
                  </div>
                )}

                {/* Live on-chain verification status */}
                {watching && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.18)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Loader size={14} color="#6EE7B7" className="void-spin" />
                    <div>
                      <p style={{ ...MONO, fontSize: '12px', color: '#6EE7B7', fontWeight: 500 }}>Auto-verifying on-chain…</p>
                      <p style={{ ...MONO, fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
                        Confirms automatically the moment your USDC/USDT payment lands.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Expired state */}
            {expired && (
              <div style={{ padding: '16px', background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.22)', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ ...MONO, fontSize: '13px', color: '#FF4D4D', fontWeight: 600, marginBottom: '4px' }}>⊘ This payment link has expired</p>
                <p style={{ ...MONO, fontSize: '11px', color: '#6B7280', lineHeight: 1.6 }}>
                  Links are valid for 30 minutes for your security. Ask the sender to share a fresh invoice link.
                </p>
              </div>
            )}

            {/* Paid state CTA */}
            {invoice.status === 'paid' && (
              <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ ...MONO, fontSize: '13px', color: '#6EE7B7', fontWeight: 500 }}>✓ This invoice has been paid</p>
                {invoice.paid_at && (
                  <p style={{ ...MONO, fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                    Paid on {new Date(invoice.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                {invoice.tx_hash && (
                  <a href={getExplorerTxUrl(invoice.paid_chain || 'ethereum', invoice.tx_hash)} target="_blank" rel="noopener noreferrer"
                    style={{ ...MONO, fontSize: '11px', color: '#6EE7B7', marginTop: '8px', display: 'inline-block', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                    View transaction on-chain ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </PixelCard>
      </div>

      {/* ── Trust badges ───────────────────────────────────── */}
      <div style={{ maxWidth: '580px', margin: '0 auto 40px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { Icon: ShieldCheck, title: 'Non-custodial', desc: 'Paid wallet-to-wallet. VOID never holds funds.' },
          { Icon: Zap,         title: 'Auto-verified', desc: 'Confirmed on-chain in seconds, automatically.' },
          { Icon: Lock,        title: 'No sign-up',    desc: 'Pay directly. No account, no card needed.' },
        ].map(({ Icon, title, desc }) => (
          <div key={title} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
            <Icon size={16} color="#6EE7B7" strokeWidth={1.8} />
            <p style={{ ...MONO, fontSize: '12px', fontWeight: 600, color: '#F5F5F5', margin: '8px 0 4px' }}>{title}</p>
            <p style={{ ...MONO, fontSize: '10px', color: '#6B7280', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
        <img src="/assets/textures/void-powered-by-footer.png" alt="Powered by VOID"
          style={{ width: '120px', opacity: 0.6, margin: '0 auto', display: 'block' }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            const t = document.createElement('p');
            t.style.cssText = 'font-family:JetBrains Mono,monospace;font-size:11px;color:#333333;letter-spacing:0.06em;text-align:center;';
            t.textContent = 'Powered by VOID';
            e.currentTarget.parentElement!.appendChild(t);
          }} />
      </div>

      {/* ── Payment modal ──────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '100%', maxWidth: '460px', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '28px', position: 'relative' }}>
            <span style={{ ...corners, top: -1, left: -1, borderTop: '2px solid #F5F5F5', borderLeft: '2px solid #F5F5F5' }} />
            <span style={{ ...corners, top: -1, right: -1, borderTop: '2px solid #F5F5F5', borderRight: '2px solid #F5F5F5' }} />
            <span style={{ ...corners, bottom: -1, left: -1, borderBottom: '2px solid #F5F5F5', borderLeft: '2px solid #F5F5F5' }} />
            <span style={{ ...corners, bottom: -1, right: -1, borderBottom: '2px solid #F5F5F5', borderRight: '2px solid #F5F5F5' }} />

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5' }}>Payment Details</p>
              <button onClick={() => setShowModal(false)}
                style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} color="#6B7280" />
              </button>
            </div>

            {/* Network + Token selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ ...MONO, display: 'block', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>NETWORK</label>
                <select value={selectedChain} onChange={e => setSelectedChain(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}>
                  {SUPPORTED_CHAINS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...MONO, display: 'block', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>TOKEN</label>
                <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}>
                  {SUPPORTED_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                </select>
              </div>
            </div>

            {/* QR code */}
            {qrUrl && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'inline-block', padding: '8px', background: '#FFFFFF', borderRadius: '6px' }}>
                  <img src={qrUrl} alt="Payment QR" style={{ width: '160px', height: '160px', display: 'block' }} />
                </div>
              </div>
            )}

            {/* Wallet address — first & last chars highlighted to prevent mistakes */}
            <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ ...MONO, fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SEND TO</p>
                <span style={{ ...MONO, fontSize: '8px', color: '#6EE7B7', letterSpacing: '0.06em' }}>✓ VERIFY HIGHLIGHTED CHARS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}><AddressHL address={walletAddress} /></div>
                <button onClick={copyAddress}
                  style={{ width: '32px', height: '32px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {copied ? <Check size={13} color="#6EE7B7" /> : <Copy size={13} color="#6B7280" />}
                </button>
              </div>
            </div>

            {/* Amount table */}
            <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
              {[
                { label: 'Network',   value: chainName },
                { label: 'Token',     value: selectedToken },
                { label: 'Amount',    value: `${Number(invoice.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${selectedToken}` },
                { label: 'USD Value', value: `$${Number(invoice.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid #0D0D0D' : 'none' }}>
                  <span style={{ ...MONO, fontSize: '11px', color: '#6B7280' }}>{row.label}</span>
                  <span style={{ ...MONO, fontSize: '12px', color: '#F5F5F5', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Paying from an exchange */}
            <div style={{ background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ ...MONO, fontSize: '10px', color: '#6EE7B7', letterSpacing: '0.06em', marginBottom: '8px' }}>● PAYING FROM AN EXCHANGE? (BINANCE · COINBASE · OKX…)</p>
              <p style={{ ...MONO, fontSize: '11px', color: '#9CA3AF', lineHeight: 1.7 }}>
                Withdraw exactly <strong style={{ color: '#F5F5F5' }}>{Number(invoice.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedToken}</strong> on the <strong style={{ color: '#F5F5F5' }}>{chainName}</strong> network to the address above. No wallet needed — we detect &amp; confirm it automatically.
              </p>
            </div>

            {/* Warning */}
            <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', lineHeight: 1.55, marginBottom: '16px' }}>
              Send only <strong style={{ color: '#F5F5F5' }}>{selectedToken}</strong> on <strong style={{ color: '#F5F5F5' }}>{chainName}</strong> to this address.<br />
              Sending the wrong token may result in permanent loss.
            </p>

            {/* Pay with Wallet — real one-click payment */}
            <button onClick={handlePayWithWallet} disabled={paying}
              style={{ width: '100%', padding: '14px', background: '#6EE7B7', color: '#000000', border: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: paying ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px', opacity: paying ? 0.7 : 1, transition: 'opacity 0.15s' }}>
              {paying ? <><Loader size={15} className="void-spin" /> Confirm in your wallet…</> : <><Wallet size={15} /> Pay {Number(invoice.amount_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedToken} with Wallet</>}
            </button>
            {payError && (
              <p style={{ ...MONO, fontSize: '11px', color: '#FF4D4D', textAlign: 'center', marginBottom: '10px', lineHeight: 1.5 }}>{payError}</p>
            )}

            {/* Auto-verify status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
              <Loader size={12} color="#6EE7B7" className="void-spin" />
              <p style={{ ...MONO, fontSize: '11px', color: '#6B7280' }}>or scan the QR — we auto-detect payment on-chain</p>
            </div>

            {/* Close */}
            <button onClick={() => setShowModal(false)}
              style={{ width: '100%', padding: '11px', background: 'transparent', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '13px', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', marginBottom: '12px', transition: 'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#444444'; e.currentTarget.style.color = '#F5F5F5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6B7280'; }}>
              CLOSE
            </button>

            {/* Manual fallback (small) — for payments we can't auto-detect (e.g. from an exchange) */}
            <button onClick={confirmPayment} disabled={confirming}
              style={{ width: '100%', background: 'none', border: 'none', color: '#444444', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: confirming ? 'default' : 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444444')}>
              {confirming ? 'Confirming…' : 'Already paid? Mark as paid manually'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
