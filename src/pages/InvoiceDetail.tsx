import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrivy, useWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import {
  generatePaymentInstructionQR, SUPPORTED_CHAINS, SUPPORTED_TOKENS, formatWalletAddress,
  captureBaselineBlocks, scanAllChainsForPayment, getExplorerTxUrl,
} from '../lib/wallet';
import Layout from '../components/Layout';
import { useIsMobile } from '../lib/useIsMobile';
import { Download, CheckCircle, QrCode, User, ArrowLeft, Share2, Check, Loader } from 'lucide-react';

export default function InvoiceDetail() {
  const { id }           = useParams();
  const { user: privyUser } = usePrivy();
  const { wallets }      = useWallets();
  const embeddedWallet   = getEmbeddedConnectedWallet(wallets);
  const navigate         = useNavigate();
  const isMobile         = useIsMobile();

  const [invoice, setInvoice]             = useState<any>(null);
  const [client, setClient]               = useState<any>(null);
  const [profile, setProfile]             = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [qrUrl, setQrUrl]                 = useState('');
  const [selectedChain, setSelectedChain] = useState('base');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [linkCopied, setLinkCopied]       = useState(false);

  const payLink = `${window.location.origin}/pay/${id}`;
  const copyPayLink = () => {
    navigator.clipboard.writeText(payLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  useEffect(() => { if (privyUser) loadInvoice(); }, [id, privyUser]);
  useEffect(() => { if (embeddedWallet?.address && invoice) generateQR(); }, [embeddedWallet, selectedChain, selectedToken, invoice]);

  const loadInvoice = async () => {
    if (!privyUser || !id) return;
    const { data: invoiceData } = await supabase.from('invoices').select('*')
      .eq('id', id).eq('privy_id', privyUser.id).maybeSingle();
    if (invoiceData) {
      setInvoice(invoiceData);
      const { data: clientData } = await supabase.from('clients').select('*')
        .eq('id', invoiceData.client_id).maybeSingle();
      setClient(clientData);
    }
    const { data: profileData } = await supabase.from('profiles').select('*')
      .eq('privy_id', privyUser.id).maybeSingle();
    setProfile(profileData);
    setLoading(false);
  };

  const generateQR = async () => {
    if (!embeddedWallet?.address || !invoice) return;
    try {
      const url = await generatePaymentInstructionQR(
        selectedToken as 'USDC' | 'USDT', selectedChain,
        embeddedWallet.address, invoice.amount_usd.toString(),
      );
      setQrUrl(url);
    } catch (err) { console.error('QR error:', err); }
  };

  const markAsPaid = async () => {
    if (!invoice) return;
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoice.id);
    loadInvoice();
  };

  // ─── Real-time on-chain auto-verification (creator's view) ──────────────
  const [watching, setWatching] = useState(false);
  const baselineRef = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (!invoice || invoice.status === 'paid' || !embeddedWallet?.address) return;
    let cancelled = false;
    let timer: any;
    const start = async () => {
      setWatching(true);
      baselineRef.current = await captureBaselineBlocks();
      const poll = async () => {
        if (cancelled || !baselineRef.current) return;
        const hit = await scanAllChainsForPayment(
          embeddedWallet.address, Number(invoice.amount_usd), baselineRef.current,
        );
        if (hit && !cancelled) {
          setWatching(false);
          await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoice.id);
          // Best-effort: store on-chain proof (requires the payment-proof migration)
          const { error } = await supabase.from('invoices')
            .update({ tx_hash: hit.txHash, paid_chain: hit.chain, paid_token: hit.token })
            .eq('id', invoice.id);
          if (error) console.warn('Payment-proof columns not present yet — run the migration.', error.message);
          loadInvoice();
          return;
        }
        if (!cancelled) timer = setTimeout(poll, 12000);
      };
      timer = setTimeout(poll, 8000);
    };
    start();
    return () => { cancelled = true; clearTimeout(timer); setWatching(false); };
  }, [invoice?.id, invoice?.status, embeddedWallet?.address]);


  if (loading) return (
    <Layout>
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <img src="/assets/ash/ash-running-loading.png" width="150" alt="" onError={e => e.currentTarget.style.display = 'none'} />
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6B7280' }}>Loading...</p>
      </div>
    </Layout>
  );

  if (!invoice) return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F5F5', marginBottom: '20px' }}>Invoice not found</h2>
        <button onClick={() => navigate('/invoices')} className="void-btn-secondary">
          <ArrowLeft size={14} /> Back to Invoices
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          /* Single A4 page, no browser margins (we control padding) */
          @page { size: A4; margin: 0; }
          html, body { background: #000000 !important; margin: 0 !important; padding: 0 !important; }
          /* Force backgrounds & colors to actually render in the PDF */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide app chrome + the right-hand payment panel */
          aside, nav, .no-print { display: none !important; }
          /* Reset Layout's sidebar offset so the invoice fills the sheet */
          .app-main { margin-left: 0 !important; }
          .invoice-print-area { max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .invoice-grid { display: block !important; gap: 0 !important; }
          .invoice-doc {
            border: none !important; border-radius: 0 !important;
            box-shadow: none !important;
            width: 210mm !important; min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 16mm 16mm 12mm !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div className="invoice-print-area" style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Top nav */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button onClick={() => navigate('/invoices')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
            <ArrowLeft size={14} /> Invoices
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={copyPayLink}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', borderRadius: '6px', background: 'transparent', color: linkCopied ? '#00FFB2' : '#F5F5F5', border: `1px solid ${linkCopied ? 'rgba(0,255,178,0.4)' : 'rgba(255,255,255,0.12)'}`, transition: 'all 0.15s' }}>
              {linkCopied ? <><Check size={13} /> Link Copied</> : <><Share2 size={13} /> Copy Pay Link</>}
            </button>
            <button onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', borderRadius: '6px', background: '#F5F5F5', color: '#080808', border: 'none' }}>
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: '16px' }} className="animate-fade-in invoice-grid">

          {/* ── Left — INVOICE DOCUMENT (matches VOID reference) ── */}
          <div>
            <div className="void-card invoice-doc" style={{
              position: 'relative', background: '#000000',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              padding: isMobile ? '24px 18px 20px' : '40px 40px 28px', overflow: 'hidden',
            }}>
              {/* Corner brackets */}
              {[
                { top: 14, left: 14, bt: true, bl: true }, { top: 14, right: 14, bt: true, br: true },
                { bottom: 14, left: 14, bb: true, bl: true }, { bottom: 14, right: 14, bb: true, br: true },
              ].map((c, i) => (
                <span key={i} style={{
                  position: 'absolute', width: '16px', height: '16px',
                  top: c.top, bottom: c.bottom, left: c.left, right: c.right,
                  borderTop: c.bt ? '2px solid #F5F5F5' : undefined,
                  borderBottom: c.bb ? '2px solid #F5F5F5' : undefined,
                  borderLeft: c.bl ? '2px solid #F5F5F5' : undefined,
                  borderRight: c.br ? '2px solid #F5F5F5' : undefined,
                } as React.CSSProperties} />
              ))}

              {/* Header: logo + dates/status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,7px)', gap: '4px' }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} style={{ width: '7px', height: '7px', background: '#F5F5F5', borderRadius: '1px' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#F5F5F5', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace' }}>VOID</span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.1em', marginBottom: '3px' }}>INVOICE DATE</p>
                    <p style={{ fontSize: '13px', color: '#F5F5F5' }}>{new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  {invoice.due_date && (
                    <div>
                      <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.1em', marginBottom: '3px' }}>DUE DATE</p>
                      <p style={{ fontSize: '13px', color: '#F5F5F5' }}>{new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.1em', marginBottom: '3px' }}>STATUS</p>
                    <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: invoice.status === 'paid' ? '#00FFB2' : invoice.status === 'overdue' ? '#FF4D4D' : '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
                      {invoice.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* INVOICE # + badge */}
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', letterSpacing: '0.08em', marginBottom: '6px' }}>INVOICE</p>
                <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#F5F5F5', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: '14px' }}>
                  #{invoice.invoice_number}
                </h1>
                {invoice.status === 'paid' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,255,178,0.1)', color: '#00FFB2', border: '1px solid rgba(0,255,178,0.25)', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
                    ● PAYMENT CONFIRMED
                  </span>
                )}
              </div>

              {/* FROM / TO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '16px' : '32px', marginBottom: '32px' }}>
                {[
                  {
                    label: 'FROM', icon: 'dots',
                    // Prefer business name, then real display name (ignore the "My Account" default)
                    name: profile?.business_name
                      || (profile?.display_name && profile.display_name !== 'My Account' ? profile.display_name : 'Your business name'),
                    wallet: embeddedWallet?.address,
                    email: profile?.email,
                    site: profile?.website,
                    sub: profile?.business_name && profile?.display_name && profile.display_name !== 'My Account' ? profile.display_name : null,
                  },
                  { label: 'TO', icon: 'user', name: client?.name || '—', wallet: client?.wallet_address, email: client?.email, site: null, sub: client?.company },
                ].map((b, i) => (
                  <div key={i}>
                    <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.12em', marginBottom: '14px' }}>{b.label}</p>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {b.icon === 'dots' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,4px)', gap: '2px' }}>
                            {Array.from({ length: 9 }).map((_, j) => <div key={j} style={{ width: '4px', height: '4px', background: '#F5F5F5', borderRadius: '1px' }} />)}
                          </div>
                        ) : <User size={20} color="#F5F5F5" strokeWidth={1.5} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>{b.name}</p>
                        {b.wallet && <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>{formatWalletAddress(b.wallet)}</p>}
                        {b.email && <p style={{ fontSize: '12px', color: '#6B7280' }}>{b.email}</p>}
                        {b.site && <p style={{ fontSize: '12px', color: '#6B7280' }}>{b.site}</p>}
                        {b.sub && !b.site && <p style={{ fontSize: '12px', color: '#6B7280' }}>{b.sub}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Line items */}
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.1em' }}>ITEM</span>
                  <span style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.1em' }}>DESCRIPTION</span>
                  <span style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.1em', textAlign: 'right' }}>AMOUNT</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 0.8fr', padding: '18px 20px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: '#F5F5F5', fontWeight: 500 }}>01. {invoice.title}</span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6 }}>{invoice.description || '—'}</span>
                  <span style={{ fontSize: '13px', color: '#F5F5F5', textAlign: 'right' }}>${invoice.amount_usd.toLocaleString()}</span>
                </div>
              </div>

              {/* NOTES + TOTAL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '28px' }}>
                <div>
                  <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.12em', marginBottom: '12px' }}>NOTES</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.7, marginBottom: '20px' }}>
                    Thank you for your business!<br />This invoice was generated on-chain and is verified by VOID.
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.12em', marginBottom: '12px' }}>TOTAL DUE</p>
                  <p style={{ fontSize: '40px', fontWeight: 700, color: '#F5F5F5', lineHeight: 1, marginBottom: '20px' }}>
                    ${invoice.amount_usd.toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#6B7280' }}>Subtotal</span><span style={{ color: '#9CA3AF' }}>${invoice.amount_usd.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#6B7280' }}>Tax (0%)</span><span style={{ color: '#9CA3AF' }}>$0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#F5F5F5', fontWeight: 600 }}>Total</span><span style={{ color: '#F5F5F5', fontWeight: 600 }}>${invoice.amount_usd.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT DETAILS + QR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', paddingTop: '24px', borderTop: '1px dashed rgba(255,255,255,0.1)', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.12em', marginBottom: '14px' }}>PAYMENT DETAILS</p>
                  {[
                    ['Network', SUPPORTED_CHAINS.find(c => c.id === (invoice.paid_chain || selectedChain))?.name || 'Ethereum'],
                    ['Payment Method', invoice.paid_token ? `On-chain · ${invoice.paid_token}` : 'On-chain'],
                    ['Wallet Address', embeddedWallet?.address ? formatWalletAddress(embeddedWallet.address) : '—'],
                    ['Paid On', invoice.paid_at ? new Date(invoice.paid_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>{k}</span>
                      <span style={{ fontSize: '11px', color: '#C9CDD4', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                  {invoice.tx_hash && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>Transaction</span>
                      <a href={getExplorerTxUrl(invoice.paid_chain || 'ethereum', invoice.tx_hash)} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: '#00FFB2', textAlign: 'right', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                        {invoice.tx_hash.slice(0, 8)}…{invoice.tx_hash.slice(-6)} ↗
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '18px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '88px', height: '88px', background: qrUrl ? 'white' : '#0A0A0A', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {qrUrl ? <img src={qrUrl} alt="QR" style={{ width: '100%', height: '100%' }} /> : <QrCode size={36} color="#333" />}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#F5F5F5', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>Scan to view invoice on-chain</p>
                    <p style={{ fontSize: '10px', color: '#6B7280', lineHeight: 1.6 }}>Verify this invoice and payment on the blockchain.</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', paddingTop: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,4px)', gap: '2px' }}>
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} style={{ width: '4px', height: '4px', background: '#6B7280', borderRadius: '1px' }} />)}
                </div>
                <span style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '0.04em' }}>Powered by VOID</span>
              </div>
            </div>
          </div>

          {/* ── Right ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-print">

            {/* Network / Token selectors */}
            <div className="void-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <QrCode size={14} color="#6B7280" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>Payment Setup</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Network
                  </label>
                  <select value={selectedChain} onChange={e => setSelectedChain(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#050505', border: '1px solid #222222', borderRadius: '5px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}>
                    {SUPPORTED_CHAINS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Token
                  </label>
                  <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: '#050505', border: '1px solid #222222', borderRadius: '5px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}>
                    {SUPPORTED_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol} — {t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {qrUrl && (
              <div className="void-card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F5', marginBottom: '14px' }}>Scan to Pay</p>
                <div style={{ display: 'inline-block', padding: '12px', background: 'white', borderRadius: '6px', marginBottom: '14px' }}>
                  <img src={qrUrl} alt="Payment QR" style={{ width: '160px', height: '160px', display: 'block' }} />
                </div>
                <div style={{ background: '#050505', border: '1px solid #222222', borderRadius: '5px', padding: '10px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>
                    {invoice.amount_usd} {selectedToken}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
                    on {SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name}
                  </p>
                </div>
                <p style={{ fontSize: '10px', color: '#444444', marginTop: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
                  EIP-681 · MetaMask · Rainbow · Coinbase Wallet
                </p>
              </div>
            )}

            {/* On-chain auto-verify status */}
            {invoice.status !== 'paid' && watching && (
              <div className="void-card" style={{ borderColor: 'rgba(0,255,178,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Loader size={16} color="#00FFB2" className="void-spin" />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#00FFB2', fontFamily: 'JetBrains Mono, monospace' }}>Watching on-chain…</p>
                  <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>Auto-confirms when payment lands.</p>
                </div>
              </div>
            )}

            {/* Mark as paid (manual fallback) */}
            {invoice.status !== 'paid' ? (
              <button onClick={markAsPaid} className="void-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }}>
                <CheckCircle size={15} /> Mark as Paid Manually
              </button>
            ) : (
              <div className="void-card" style={{ textAlign: 'center', borderColor: 'rgba(0,255,178,0.2)' }}>
                <CheckCircle size={24} color="#00FFB2" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#00FFB2' }}>Payment Received</p>
                {invoice.paid_at && (
                  <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(invoice.paid_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
