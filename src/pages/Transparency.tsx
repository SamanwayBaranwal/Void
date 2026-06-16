import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useIsMobile } from '../lib/useIsMobile';
import { Shield, Database, Key, Globe, Lock, Check, X, Server, Eye, EyeOff, ArrowRight, Wallet, FileText, Users, User } from 'lucide-react';

function VoidSymbol({ size = 14, color = '#F5F5F5' }: { size?: number; color?: string }) {
  const dot = Math.floor(size / 4);
  const gap = Math.floor(size / 6);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${dot}px)`, gap: `${gap}px`, flexShrink: 0 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ width: dot, height: dot, background: color, borderRadius: '1px' }} />
      ))}
    </div>
  );
}

const DB_TABLES = [
  {
    table: 'profiles', icon: User,
    description: 'Your personal and business details used on invoices.',
    stored: ['Display name', 'Email address', 'Business name', 'Website URL', 'Bio / services description', 'Business address (street, city, state, country, postal code)'],
    notStored: ['Password — no password exists. Auth is handled entirely by Privy.', 'Any payment or financial information'],
    who: 'Only you — filtered by your unique privy_id on every query.',
    location: 'Supabase (PostgreSQL) — hosted on AWS via Supabase cloud.',
  },
  {
    table: 'crypto_wallets', icon: Wallet,
    description: 'Your payment addresses for receiving crypto.',
    stored: ['Public wallet address (0x…)', 'Which address is marked as "primary"', 'Chain type (always "evm")'],
    notStored: ['Private key — never stored anywhere in our database.', 'Seed phrase / mnemonic — never stored anywhere in our database.', 'Any signing capability — we cannot sign transactions on your behalf.'],
    who: 'Only you — filtered by your unique privy_id on every query.',
    location: 'Supabase (PostgreSQL) — hosted on AWS via Supabase cloud.',
  },
  {
    table: 'clients', icon: Users,
    description: 'The people and companies you invoice.',
    stored: ['Client name', 'Client email address', 'Company name (optional)', 'Client wallet address (optional)', 'Notes (optional)'],
    notStored: [],
    who: 'Only you — filtered by your unique privy_id on every query.',
    location: 'Supabase (PostgreSQL) — hosted on AWS via Supabase cloud.',
  },
  {
    table: 'invoices', icon: FileText,
    description: 'Your payment requests and their current status.',
    stored: ['Invoice title and description', 'Amount in USD', 'Status (pending / paid / draft)', 'Due date (optional)', 'Date marked as paid (optional)', 'Invoice number', 'Which client it belongs to'],
    notStored: ['On-chain transaction hash — payment happens peer-to-peer, we never see it.', 'Crypto token or chain — chosen per invoice view, not stored.'],
    who: 'Only you — filtered by your unique privy_id on every query.',
    location: 'Supabase (PostgreSQL) — hosted on AWS via Supabase cloud.',
  },
];

const KEY_FACTS = [
  { icon: Key, title: 'Your private key', accent: '#6B7280', body: 'Generated inside a Privy Trusted Execution Environment (TEE) — a secure hardware enclave. It never leaves that enclave in plain text. VOID\'s code never touches it. When you click "View Private Key", it opens inside a Privy-hosted iframe on privy.io — our JavaScript cannot read what is inside that iframe.', verdict: 'We never see it. Privy never shares it. You can export it any time.', verdictColor: '#6EE7B7' },
  { icon: EyeOff, title: 'Your seed phrase', accent: '#6B7280', body: 'Never generated or stored by VOID. Privy manages the embedded wallet using a threshold key-sharing model (no single party holds the full key). If you use "View Private Key", Privy can derive a seed phrase for export purposes inside their secure iframe — but it is never sent to our servers.', verdict: 'We never see it. Never stored in our database.', verdictColor: '#6EE7B7' },
  { icon: Globe, title: 'Your public wallet address', accent: '#F5F5F5', body: 'This is the 0x… address you share with clients to receive payments. It is public by design — that\'s how blockchain works. We store it in our database linked to your privy_id so we can display it in invoices and the wallet section.', verdict: 'Stored in our database. Public information by design.', verdictColor: '#6B7280' },
  { icon: Database, title: 'Your invoice and client data', accent: '#F5F5F5', body: 'Stored in Supabase (PostgreSQL). Row Level Security (RLS) is enabled — every row has your privy_id and every query in the app filters by it. Even a raw database access would show a mix of all users\' rows with no way to identify who\'s who without the privy_id.', verdict: 'Stored in our database. Isolated to your account.', verdictColor: '#6B7280' },
  { icon: Globe, title: 'On-chain transactions', accent: '#6EE7B7', body: 'When your client pays you, they send USDC or USDT from their wallet directly to yours, peer-to-peer on the blockchain. This transaction is publicly visible on the blockchain — that is the nature of crypto and not something any platform can change. VOID is not involved in this transaction at all.', verdict: 'Public on the blockchain. VOID has no involvement.', verdictColor: '#6EE7B7' },
  { icon: Lock, title: 'Authentication', accent: '#6EE7B7', body: 'Login is handled entirely by Privy. We never receive or store your Google OAuth tokens or email verification codes. When you log in, Privy gives us a unique identifier (privy_id) — that\'s all we use to identify you. There are no passwords.', verdict: 'Auth by Privy. We receive only a privy_id.', verdictColor: '#6EE7B7' },
];

const INFRA = [
  { name: 'Authentication', provider: 'Privy', link: 'privy.io', detail: 'Handles login (email OTP, Google), embedded wallet creation, and key custody.' },
  { name: 'Database', provider: 'Supabase', link: 'supabase.com', detail: 'Stores profiles, wallets (address only), clients, and invoices. Hosted on AWS.' },
  { name: 'Wallet key custody', provider: 'Privy TEE', link: 'privy.io', detail: 'Private keys live in a Trusted Execution Environment — hardware-enforced isolation.' },
  { name: 'Frontend hosting', provider: 'Your device', link: '', detail: 'The React app runs in your browser. No server-side rendering, no request logging.' },
  { name: 'Payment processing', provider: 'None', link: '', detail: 'Payments are peer-to-peer on-chain. VOID is not in the payment path.' },
];

const DATA_FLOW = [
  { step: '01', event: 'You sign up / log in', flow: 'Browser → Privy (privy.io)', detail: 'Privy verifies your email OTP or Google account. Privy creates your embedded EVM wallet in a TEE. Privy returns a privy_id to our app. We create a row in the profiles table with that privy_id.' },
  { step: '02', event: 'Wallet address saved', flow: 'Privy → VOID → Supabase', detail: 'Your public wallet address (0x…) is read from Privy and saved to the crypto_wallets table. Only the address is saved. The private key stays in Privy\'s TEE.' },
  { step: '03', event: 'You create an invoice', flow: 'Browser → Supabase', detail: 'Invoice data (title, amount, client, due date) is written to the invoices table tagged with your privy_id. A QR code is generated locally in your browser using your wallet address. Nothing goes to a payment processor.' },
  { step: '04', event: 'Client pays you', flow: 'Client wallet → Blockchain → Your wallet', detail: 'The client scans the QR code and sends USDC/USDT from their wallet to yours, directly on-chain. VOID is not involved. The money does not pass through our servers.' },
  { step: '05', event: 'You view your private key', flow: 'Browser → Privy iframe (privy.io)', detail: 'A secure iframe hosted on privy.io loads. Your private key is displayed inside it. Our JavaScript cannot read iframe content from a different domain. We never receive the key.' },
];

export default function Transparency() {
  const navigate = useNavigate();
  const { user } = usePrivy();
  const isMobile = useIsMobile();

  const card: React.CSSProperties = { background: '#050505', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: isMobile ? '18px' : '24px' };
  const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div style={{
      minHeight: '100vh', background: '#000000', color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
      backgroundSize: '48px 48px', backgroundAttachment: 'fixed',
    }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)', height: '56px', display: 'flex', alignItems: 'center', padding: isMobile ? '0 18px' : '0 40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <VoidSymbol size={16} color="#F5F5F5" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', letterSpacing: '0.06em' }}>VOID</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ ...mono, fontSize: '10px', color: '#6EE7B7', background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.06em', fontWeight: 500 }}>
              FULL TRANSPARENCY
            </span>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="void-btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }}>
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="void-btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}>
                Get Started <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '40px 18px' : '60px 40px', display: 'flex', flexDirection: 'column', gap: isMobile ? '52px' : '80px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center' }} className="animate-fade-in">
          <img src="/assets/ash/ash-serious-seedphrase.png" width={isMobile ? 140 : 180} alt=""
            className="void-float"
            style={{ display: 'block', margin: '0 auto 20px' }}
            onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0A0A0A', border: '1px solid rgba(110,231,183,0.25)', borderRadius: '4px', padding: '6px 14px', marginBottom: '24px' }}>
            <Shield size={13} color="#6EE7B7" />
            <span style={{ ...mono, fontSize: '11px', color: '#6EE7B7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Data Transparency Report</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '30px' : '48px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: '20px' }}>
            Exactly what we store —<br />and exactly what we don't.
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#9CA3AF', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
            VOID is built on the principle that you should know precisely what data we hold, where it lives, who can access it, and how your wallet keys are protected. This page is the complete answer.
          </p>
        </section>

        {/* Summary */}
        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }} className="animate-stagger">
          {[
            { icon: EyeOff, title: 'Private keys', sub: 'Never stored by us', detail: 'Privy TEE only', color: '#6B7280' },
            { icon: Check,  title: 'Your data',    sub: 'Stored & isolated',   detail: 'Supabase · privy_id only', color: '#6EE7B7' },
            { icon: Globe,  title: 'Payments',     sub: 'Peer-to-peer',        detail: 'Blockchain · not us', color: '#6EE7B7' },
          ].map(({ icon: Icon, title, sub, detail, color }) => (
            <div key={title} style={{ ...card, textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon size={18} color={color} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>{title}</p>
              <p style={{ fontSize: '13px', fontWeight: 500, color, marginBottom: '4px' }}>{sub}</p>
              <p style={{ fontSize: '11px', color: '#6B7280', ...mono }}>{detail}</p>
            </div>
          ))}
        </section>

        {/* DB Tables */}
        <section>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="#6B7280" /> Our Database — Table by Table
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Every table and every column that exists. No hidden tables. No analytics databases. No shadow profiles.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DB_TABLES.map(({ table, icon: Icon, description, stored, notStored, who, location }) => (
              <div key={table} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="#6B7280" />
                  </div>
                  <div>
                    <code style={{ ...mono, fontSize: '13px', color: '#F5F5F5', background: '#000000', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {table}
                    </code>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{description}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (notStored.length > 0 ? '1fr 1fr' : '1fr'), gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ ...mono, fontSize: '10px', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <Check size={10} /> What IS stored
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {stored.map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#F5F5F5' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6EE7B7', flexShrink: 0, marginTop: '4px' }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  {notStored.length > 0 && (
                    <div>
                      <p style={{ ...mono, fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                        <X size={10} /> What is NOT stored
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {notStored.map(item => (
                          <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#444444', textDecoration: 'line-through' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6B7280', flexShrink: 0, marginTop: '4px' }} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {[{ label: 'Who can access', icon: Eye, text: who }, { label: 'Where it lives', icon: Server, text: location }].map(({ label, icon: I, text }) => (
                    <div key={label} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '12px' }}>
                      <p style={{ fontSize: '10px', color: '#6B7280', ...mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <I size={10} /> {label}
                      </p>
                      <p style={{ fontSize: '12px', color: '#F5F5F5' }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Facts */}
        <section>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={20} color="#6EE7B7" /> Key Facts About Your Wallet &amp; Security
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>The most important questions — answered plainly.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {KEY_FACTS.map(({ icon: Icon, title, accent, body, verdict, verdictColor }) => (
              <div key={title} style={card}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '36px', height: '36px', background: `${accent}10`, border: `1px solid ${accent}30`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px' }}>{title}</h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, marginBottom: '12px' }}>{body}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: `${verdictColor}10`, border: `1px solid ${verdictColor}30`, padding: '5px 12px', borderRadius: '4px' }}>
                      <Shield size={11} color={verdictColor} />
                      <span style={{ ...mono, fontSize: '11px', color: verdictColor, fontWeight: 500, letterSpacing: '0.04em' }}>{verdict}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Infrastructure */}
        <section>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={20} color="#6B7280" /> Infrastructure — Who We Use and Why
            </h2>
          </div>
          <div style={card}>
            {INFRA.map(({ name, provider, link, detail }, i) => (
              <div key={name} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '4px' : '20px', padding: '16px 0', borderBottom: i < INFRA.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ width: isMobile ? 'auto' : '160px', flexShrink: 0 }}>
                  <p style={{ ...mono, fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{name}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5' }}>{provider}</span>
                    {link && <span style={{ ...mono, fontSize: '11px', color: '#444444' }}>{link}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Flow */}
        <section>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowRight size={20} color="#6B7280" /> Data Flow — Step by Step
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DATA_FLOW.map(({ step, event, flow, detail }) => (
              <div key={step} style={{ ...card, display: 'flex', gap: '16px' }}>
                <div style={{ ...mono, width: '36px', height: '36px', background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>
                  {step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5' }}>{event}</p>
                    <code style={{ ...mono, fontSize: '11px', color: '#6B7280', background: '#000000', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '3px' }}>{flow}</code>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Commitment */}
        <section>
          <div style={{ ...card, textAlign: 'center', borderColor: 'rgba(110,231,183,0.2)', padding: isMobile ? '28px 18px' : '40px 24px' }}>
            <img src="/assets/ash/ash-welcoming-onboarding.png" width={isMobile ? 120 : 150} alt=""
              style={{ display: 'block', margin: '0 auto 16px' }}
              onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#F5F5F5', marginBottom: '12px' }}>Our Commitment</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.7 }}>
              We built this for freelancers and agency owners who need to trust the tools they use.
              We will never sell your data, add hidden analytics, or change what we store without updating this page first.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {user ? (
                <button onClick={() => navigate('/dashboard')} className="void-btn-primary" style={{ padding: '10px 24px' }}>
                  Back to Dashboard
                </button>
              ) : (
                <button onClick={() => navigate('/auth')} className="void-btn-primary" style={{ padding: '10px 24px' }}>
                  Get Started — It's Free <ArrowRight size={14} />
                </button>
              )}
              <button onClick={() => navigate('/')} className="void-btn-secondary" style={{ padding: '10px 24px' }}>
                Back to Home
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 40px', marginTop: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <VoidSymbol size={14} color="#333333" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#333333', letterSpacing: '0.06em' }}>VOID</span>
          </div>
          <p style={{ ...mono, fontSize: '11px', color: '#333333' }}>
            0% platform fee · No custody of funds · No private key access
          </p>
        </div>
      </footer>
    </div>
  );
}
