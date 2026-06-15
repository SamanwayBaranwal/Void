import { useState, useEffect } from 'react';
import { usePrivy, useWallets, getEmbeddedConnectedWallet } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import { formatWalletAddress } from '../lib/wallet';
import Layout from '../components/Layout';
import { useIsMobile } from '../lib/useIsMobile';
import { Copy, Check, Bell, CreditCard, Key, Shield, User } from 'lucide-react';

const TABS = [
  { key: 'profile',       label: 'Profile',       icon: User       },
  { key: 'billing',       label: 'Billing',       icon: CreditCard },
  { key: 'api',           label: 'API Keys',      icon: Key        },
  { key: 'notifications', label: 'Notifications', icon: Bell       },
  { key: 'security',      label: 'Security',      icon: Shield     },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function Profile() {
  const { user: privyUser }  = usePrivy();
  const { wallets }           = useWallets();
  const embeddedWallet        = getEmbeddedConnectedWallet(wallets);
  const isMobile              = useIsMobile();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [businessName, setBusiness]   = useState('');
  const [website, setWebsite]         = useState('');
  const [bio, setBio]                 = useState('');
  const [streetAddress, setStreet]    = useState('');
  const [city, setCity]               = useState('');
  const [state, setState]             = useState('');
  const [country, setCountry]         = useState('');
  const [postalCode, setPostal]       = useState('');
  const [taxId, setTaxId]             = useState('');
  const [timezone, setTimezone]       = useState('UTC');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [copied, setCopied]           = useState(false);

  useEffect(() => { if (privyUser) loadProfile(); }, [privyUser]);

  const loadProfile = async () => {
    if (!privyUser) return;
    const { data } = await supabase.from('profiles').select('*').eq('privy_id', privyUser.id).maybeSingle();
    if (data) {
      setDisplayName(data.display_name || '');
      setEmail(data.email || '');
      setBusiness(data.business_name || '');
      setWebsite(data.website || '');
      setBio(data.bio || '');
      setStreet(data.street_address || '');
      setCity(data.city || '');
      setState(data.state || '');
      setCountry(data.country || '');
      setPostal(data.postal_code || '');
      setTaxId(data.tax_id || '');
      setTimezone(data.timezone || 'UTC');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!privyUser) return;
    setSaving(true);
    const { error: e2 } = await supabase.from('profiles').upsert({
      privy_id: privyUser.id,
      display_name: displayName, email, business_name: businessName,
      website, bio, street_address: streetAddress,
      city, state, country, postal_code: postalCode, tax_id: taxId, timezone,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'privy_id' });
    setSaving(false);
    if (e2) setError(e2.message);
    else { setSuccess('Settings saved'); setTimeout(() => setSuccess(''), 3000); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px',
    color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', color: '#6B7280',
    marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace',
  };

  if (loading) return (
    <Layout>
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <img src="/assets/ash/ash-running-loading.png" width="150" alt="" onError={e => (e.currentTarget.style.display = 'none')} />
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#6B7280' }}>Loading...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: '900px' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Settings</h1>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', maxWidth: '100%', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0, whiteSpace: 'nowrap',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: isMobile ? '10px 13px' : '10px 16px',
                fontSize: '13px', fontWeight: 500,
                fontFamily: 'JetBrains Mono, monospace',
                color: activeTab === tab.key ? '#F5F5F5' : '#6B7280',
                borderBottom: activeTab === tab.key ? '2px solid #F5F5F5' : '2px solid transparent',
                marginBottom: '-1px', transition: 'all 0.12s',
              }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 240px', gap: '24px', alignItems: 'start' }}>

            {/* Left: form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Profile Information */}
              <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Profile Information</p>
                <p style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>Update your personal information and wallet address</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} placeholder="Your name" />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Wallet Address</label>
                    <input
                      type="text"
                      value={embeddedWallet?.address || ''}
                      readOnly
                      style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B7280', cursor: 'default' }}
                      placeholder="No wallet connected"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Timezone</label>
                    <input type="text" value={timezone} onChange={e => setTimezone(e.target.value)} style={inputStyle} placeholder="UTC" />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>Business Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Business Name</label>
                      <input type="text" value={businessName} onChange={e => setBusiness(e.target.value)} style={inputStyle} placeholder="Acme Studio" />
                    </div>
                    <div>
                      <label style={labelStyle}>Website</label>
                      <input type="url" value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} placeholder="https://…" />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Tax ID / GST Number <span style={{ color: '#333333' }}>(shown on invoices)</span></label>
                    <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)}
                      style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                      placeholder="GST123456789" />
                  </div>
                  <div>
                    <label style={labelStyle}>Street Address</label>
                    <input type="text" value={streetAddress} onChange={e => setStreet(e.target.value)} style={inputStyle} placeholder="123 Main St, Suite 4" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} placeholder="New York" />
                    </div>
                    <div>
                      <label style={labelStyle}>State / Province</label>
                      <input type="text" value={state} onChange={e => setState(e.target.value)} style={inputStyle} placeholder="NY" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input type="text" value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} placeholder="United States" />
                    </div>
                    <div>
                      <label style={labelStyle}>Postal Code</label>
                      <input type="text" value={postalCode} onChange={e => setPostal(e.target.value)}
                        style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }} placeholder="10001" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {error && <div style={{ padding: '10px 12px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '5px', color: '#FF4D4D', fontSize: '12px' }}>{error}</div>}
              {success && (
                <div style={{ padding: '10px 12px', background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: '5px', color: '#00FFB2', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Check size={13} /> {success}
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{ padding: '10px 20px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, alignSelf: 'flex-start' }}
                onMouseEnter={e => { if (!saving) (e.currentTarget.style.opacity = '0.88'); }}
                onMouseLeave={e => { if (!saving) (e.currentTarget.style.opacity = '1'); }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>

            {/* Right: Avatar panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Avatar</p>
                <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid #222222', margin: '0 auto 14px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/assets/ash/ash-master-character.png" alt="Ash"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      const div = document.createElement('div');
                      div.style.cssText = 'font-size:32px;font-weight:700;color:#F5F5F5;font-family:JetBrains Mono,monospace;';
                      div.textContent = (displayName || 'A')[0].toUpperCase();
                      e.currentTarget.parentElement!.appendChild(div);
                    }} />
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>
                  {displayName || 'Your Name'}
                </p>
                <p style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '14px' }}>Studio Plan</p>
                <button style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #222222', borderRadius: '5px', color: '#F5F5F5', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#333333')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#222222')}>
                  Change Avatar
                </button>
              </div>

              {/* Wallet display */}
              {embeddedWallet?.address && (
                <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
                  <p style={{ fontSize: '10px', color: '#444444', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Wallet</p>
                  <p style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', marginBottom: '8px' }}>
                    {formatWalletAddress(embeddedWallet.address)}
                  </p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(embeddedWallet.address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '5px 10px', color: copied ? '#00FFB2' : '#6B7280', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '32px', textAlign: 'center' }}>
            <CreditCard size={32} color="#333333" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>Billing & Plans</p>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>You're on the <strong style={{ color: '#F5F5F5' }}>Studio Plan</strong>. Billing management coming soon.</p>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '32px', textAlign: 'center' }}>
            <Key size={32} color="#333333" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>API Keys</p>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>Generate and manage API keys. Coming soon.</p>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>Notification Preferences</p>
            {[
              { label: 'Invoice paid', desc: 'Get notified when a client pays an invoice' },
              { label: 'Invoice overdue', desc: 'Alert when an invoice passes its due date' },
              { label: 'New client', desc: 'Notify when a new client is added' },
              { label: 'Payment received', desc: 'On-chain confirmation of payment' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>{item.desc}</p>
                </div>
                <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid #2A2A2A', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#333333', position: 'absolute', top: '2px', left: '2px', transition: 'all 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '32px', textAlign: 'center' }}>
            <Shield size={32} color="#333333" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>Security Settings</p>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>2FA and advanced security options coming soon.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
