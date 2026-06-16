import { useState, useEffect } from 'react';
import {
  usePrivy, useWallets, useCreateWallet,
  useExportWallet, getEmbeddedConnectedWallet,
} from '@privy-io/react-auth';
import {
  getAllWallets, deleteWallet, importWalletAddress, setPrimaryWallet,
  isValidEthereumAddress, formatWalletAddress, WalletData,
} from '../lib/wallet';
import Layout from '../components/Layout';
import { Wallet, Copy, Check, Shield, Plus, Trash2, Star, X, AlertTriangle, Key, ChevronDown, ChevronUp } from 'lucide-react';

const CHAINS = ['Base', 'Ethereum', 'Polygon', 'Arbitrum', 'Optimism'];

export default function WalletPage() {
  const { user: privyUser }    = usePrivy();
  const { wallets }             = useWallets();
  const { createWallet }        = useCreateWallet();
  const { exportWallet }        = useExportWallet();
  const privyWallet             = getEmbeddedConnectedWallet(wallets);

  const [savedWallets, setSavedWallets]   = useState<WalletData[]>([]);
  const [loading, setLoading]             = useState(true);
  const [copied, setCopied]               = useState('');
  const [creating, setCreating]           = useState(false);
  const [createError, setCreateError]     = useState('');
  const [exporting, setExporting]         = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [ackChecked, setAckChecked]       = useState(false);
  const [showImport, setShowImport]       = useState(false);
  const [importAddress, setImportAddress] = useState('');
  const [importError, setImportError]     = useState('');
  const [importing, setImporting]         = useState(false);
  const [showDetails, setShowDetails]     = useState(false);

  useEffect(() => { if (privyUser) loadWallets(); }, [privyUser]);

  const loadWallets = async () => {
    if (!privyUser) return;
    setSavedWallets(await getAllWallets(privyUser.id));
    setLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleExport = async () => {
    if (!privyWallet?.address || !ackChecked) return;
    setExporting(true);
    try { await exportWallet({ address: privyWallet.address }); }
    catch (e) { console.error(e); }
    finally {
      setExporting(false);
      setShowExportConfirm(false);
      setAckChecked(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    if (!privyUser) return;
    const addr = importAddress.trim();
    if (!isValidEthereumAddress(addr)) {
      setImportError('Invalid address — must start with 0x and be 42 characters.');
      return;
    }
    setImporting(true);
    try {
      await importWalletAddress(privyUser.id, addr, 'Imported Wallet');
      setImportAddress(''); setShowImport(false);
      await loadWallets();
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import.');
    } finally { setImporting(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
    color: '#F5F5F5', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
  };

  const iconBtn = (onClick: () => void, children: React.ReactNode, danger = false): React.ReactNode => (
    <button onClick={onClick}
      style={{ width: '30px', height: '30px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      onMouseEnter={e => { if (danger) { e.currentTarget.style.background = 'rgba(255,77,77,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.2)'; } else { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = '#0D0D0D'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
      {children}
    </button>
  );

  return (
    <Layout>
      <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>Wallet</h1>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>Your EVM payment address for receiving crypto</p>
        </div>

        {/* ── Privy Embedded Wallet ─────────────────────────────── */}
        <section>
          <p style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Your EVM Wallet
          </p>

          {privyWallet ? (
            <div className="void-card void-card-pixel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '38px', height: '38px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Wallet size={16} color="#F5F5F5" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5' }}>Privy Embedded Wallet</p>
                  <p style={{ fontSize: '11px', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6EE7B7', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    ACTIVE · SECURED BY PRIVY
                  </p>
                </div>
              </div>

              {/* Address */}
              <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  PUBLIC ADDRESS
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#F5F5F5', wordBreak: 'break-all', flex: 1 }}>
                    {privyWallet.address}
                  </code>
                  {iconBtn(() => copy(privyWallet.address, 'privy'),
                    copied === 'privy' ? <Check size={13} color="#6EE7B7" /> : <Copy size={13} color="#6B7280" />
                  )}
                </div>
                <p style={{ fontSize: '11px', color: '#444444', fontFamily: 'JetBrains Mono, monospace', marginTop: '6px' }}>
                  {formatWalletAddress(privyWallet.address)}
                </p>
              </div>

              {/* Chain tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {CHAINS.map(c => (
                  <span key={c} style={{ padding: '4px 10px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>
                    {c}
                  </span>
                ))}
              </div>

              {/* Export button — seed phrase section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <img src="/assets/ash/ash-serious-seedphrase.png" width="130" alt=""
                  style={{ flexShrink: 0 }}
                  onError={e => e.currentTarget.style.display = 'none'} />
                <div style={{ flex: 1 }}>
                  <button onClick={() => { setAckChecked(false); setShowExportConfirm(true); }}
                    style={{ width: '100%', padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#444444'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                    <Key size={14} />
                    View Private Key / Seed Phrase
                  </button>
                  <p style={{ fontSize: '11px', color: '#444444', marginTop: '8px', lineHeight: 1.5 }}>
                    Opens a secure Privy iframe — we never see your private key. Use it to import into MetaMask or any EVM wallet.
                  </p>
                </div>
              </div>
            </div>

          ) : (
            <div className="void-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ width: '48px', height: '48px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Wallet size={20} color="#6B7280" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px' }}>No EVM wallet yet</p>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                Create your embedded EVM wallet — secured by Privy, works on all 5 chains.
              </p>
              {createError && <p style={{ fontSize: '12px', color: '#FF4D4D', marginBottom: '12px' }}>{createError}</p>}
              <button disabled={creating} onClick={async () => { setCreating(true); setCreateError(''); try { await createWallet(); } catch (e: any) { setCreateError(e?.message || 'Failed to create wallet.'); } finally { setCreating(false); } }}
                className="void-btn-primary" style={{ padding: '10px 24px' }}>
                <Wallet size={14} />
                {creating ? 'Creating…' : 'Create My EVM Wallet'}
              </button>
            </div>
          )}
        </section>

        {/* ── Saved Addresses ───────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Saved Addresses
            </p>
            <button onClick={() => setShowImport(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '5px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
              <Plus size={12} /> Import address
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <img src="/assets/ash/ash-running-loading.png" width="120" alt="" onError={e => e.currentTarget.style.display = 'none'} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B7280' }}>Loading...</p>
            </div>
          ) : savedWallets.length === 0 ? (
            <div className="void-card" style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Your Privy wallet address is saved automatically once created.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedWallets.map((w, idx) => (
                <div key={w.id} className="void-card" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {idx === 0
                        ? <Star size={13} color="#FBBF24" fill="#FBBF24" />
                        : <Wallet size={13} color="#6B7280" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#F5F5F5' }}>
                          {idx === 0 ? 'Primary Address' : 'Additional Address'}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)', padding: '2px 6px', borderRadius: '3px', fontWeight: 500, letterSpacing: '0.05em' }}>
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B7280', wordBreak: 'break-all', display: 'block' }}>
                        {w.address}
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {iconBtn(() => copy(w.address, w.id), copied === w.id ? <Check size={12} color="#6EE7B7" /> : <Copy size={12} color="#6B7280" />)}
                      {idx !== 0 && (
                        <>
                          {iconBtn(async () => { if (privyUser) { await setPrimaryWallet(privyUser.id, w.id); loadWallets(); } }, <Star size={12} color="#FBBF24" />)}
                          {iconBtn(async () => { if (privyUser && confirm('Remove this address?')) { await deleteWallet(privyUser.id, w.id); loadWallets(); } }, <Trash2 size={12} color="#FF4D4D" />, true)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Security overview ─────────────────────────────────── */}
        <section>
          <button onClick={() => setShowDetails(v => !v)} className="void-card"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={15} color="#6B7280" />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#F5F5F5' }}>How your data &amp; wallet is stored — full transparency</span>
            </div>
            {showDetails ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
          </button>

          {showDetails && (
            <div className="void-card animate-fade-in" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Private key', stored: false },
                { label: 'Seed phrase', stored: false },
                { label: 'Your funds', stored: false },
                { label: 'Password', stored: false },
                { label: 'Public wallet address', stored: true },
                { label: 'Invoice & client data', stored: true },
                { label: 'Business profile', stored: true },
              ].map(({ label, stored }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, background: stored ? 'rgba(110,231,183,0.08)' : 'rgba(255,77,77,0.08)', color: stored ? '#6EE7B7' : '#FF4D4D', border: `1px solid ${stored ? 'rgba(110,231,183,0.2)' : 'rgba(255,77,77,0.2)'}` }}>
                    {stored ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: '13px', color: stored ? '#F5F5F5' : '#444444', textDecoration: stored ? 'none' : 'line-through' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Private Key Confirmation Gate */}
      {showExportConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: '100%', maxWidth: '460px', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '26px', position: 'relative' }}>
            {[['top:-1px','left:-1px','borderTop','borderLeft'],['top:-1px','right:-1px','borderTop','borderRight'],['bottom:-1px','left:-1px','borderBottom','borderLeft'],['bottom:-1px','right:-1px','borderBottom','borderRight']].map(([tb, lr, b1, b2], idx) => (
              <span key={idx} style={{ position: 'absolute', width: '12px', height: '12px', [b1]: '2px solid #F5F5F5', [b2]: '2px solid #F5F5F5', [tb.split(':')[0]]: tb.split(':')[1], [lr.split(':')[0]]: lr.split(':')[1] } as React.CSSProperties} />
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <img src="/assets/ash/ash-serious-seedphrase.png" width="64" alt="" onError={e => e.currentTarget.style.display = 'none'} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Reveal Private Key</h3>
                <p style={{ fontSize: '11px', color: '#FBBF24', fontFamily: 'JetBrains Mono, monospace' }}>⚠ Sensitive — read before continuing</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '18px' }}>
              <p style={{ fontSize: '12px', color: '#C9CDD4', lineHeight: 1.7 }}>
                Your private key / seed phrase gives <strong style={{ color: '#FF4D4D' }}>full control</strong> of this wallet and all its funds.
                Anyone who sees it can steal everything. <strong style={{ color: '#F5F5F5' }}>VOID will never ask for it.</strong>
                Never share it, never type it on any other site, and never send it to anyone.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '18px' }}>
              <input type="checkbox" checked={ackChecked} onChange={e => setAckChecked(e.target.checked)}
                style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#6EE7B7', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: '12px', color: '#C9CDD4', lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace' }}>
                I understand I am <strong style={{ color: '#F5F5F5' }}>solely responsible for the security of my wallet</strong>, and I will never share my private key or seed phrase with anyone.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleExport} disabled={!ackChecked || exporting}
                style={{ flex: 1, padding: '11px', background: ackChecked ? '#F5F5F5' : '#1A1A1A', color: ackChecked ? '#080808' : '#555', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: ackChecked && !exporting ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.15s' }}>
                <Key size={14} /> {exporting ? 'Opening…' : 'Reveal'}
              </button>
              <button onClick={() => { setShowExportConfirm(false); setAckChecked(false); }}
                style={{ flex: 1, padding: '11px', background: 'transparent', color: '#F5F5F5', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="void-card animate-slide-up" style={{ width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#F5F5F5' }}>Import Wallet Address</h3>
              <button onClick={() => { setShowImport(false); setImportAddress(''); setImportError(''); }}
                style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={13} color="#6B7280" />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', padding: '12px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', marginBottom: '16px' }}>
              <AlertTriangle size={14} color="#FBBF24" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '12px', color: '#FBBF24', lineHeight: 1.5 }}>
                Only paste a <strong>public wallet address</strong> (0x…). Never share your private key or seed phrase.
              </p>
            </div>

            <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Wallet Address</label>
                <input type="text" value={importAddress} onChange={e => setImportAddress(e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
                  placeholder="0x…" spellCheck={false} required />
              </div>
              {importError && (
                <div style={{ padding: '10px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '6px', color: '#FF4D4D', fontSize: '12px' }}>
                  {importError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={importing} className="void-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {importing ? 'Saving…' : 'Save Address'}
                </button>
                <button type="button" onClick={() => { setShowImport(false); setImportAddress(''); setImportError(''); }} className="void-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </Layout>
  );
}
