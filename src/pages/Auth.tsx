import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Shield, Wallet, FileText } from 'lucide-react';

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

export default function Auth() {
  const { login, ready, authenticated } = usePrivy();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && authenticated) navigate('/dashboard');
  }, [ready, authenticated]);

  return (
    <div style={{ minHeight: '100vh', background: '#000000', backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '48px 48px', backgroundAttachment: 'fixed', display: 'flex', fontFamily: 'JetBrains Mono, monospace' }}>

      {/* Left panel */}
      <div style={{
        display: 'none',
        flex: 1,
        padding: '48px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        flexDirection: 'column',
        justifyContent: 'center',
      }} className="lg:flex lg:flex-col">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
          <VoidSymbol size={20} color="#F5F5F5" />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5', letterSpacing: '0.06em' }}>VOID</span>
        </div>

        <h1 style={{ fontSize: '40px', fontWeight: 600, color: '#F5F5F5', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '16px' }}>
          Invoicing for the<br />decentralized economy
        </h1>
        <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '40px', lineHeight: 1.6 }}>
          One login. Real EVM wallet. Professional invoices. No banks.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          {[
            { icon: Wallet,   text: 'Instant EVM wallet — created on sign up' },
            { icon: FileText, text: 'Create invoices with QR code payments' },
            { icon: Shield,   text: 'We never store your private keys' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '30px', height: '30px', flexShrink: 0,
                background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={14} color="#6B7280" />
              </div>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
            <span style={{ color: '#F5F5F5', fontWeight: 600 }}>Fully transparent.</span>{' '}
            We only store your public wallet address, invoices, and client list.
            Your private keys stay with Privy's secure infrastructure — not us.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }} className="lg:hidden">
            <VoidSymbol size={16} color="#F5F5F5" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', letterSpacing: '0.06em' }}>VOID</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img src="/assets/ash/ash-welcoming-onboarding.png" width="120" alt=""
              onError={e => e.currentTarget.style.display = 'none'} />
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 600, color: '#F5F5F5', marginBottom: '8px', letterSpacing: '-0.01em' }}>
            Get started
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', lineHeight: 1.6 }}>
            Sign in or create your account — a crypto wallet is created automatically.
          </p>

          <button
            onClick={() => login()}
            style={{
              width: '100%',
              padding: '14px',
              background: '#F5F5F5',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.15s',
              marginBottom: '16px',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <VoidSymbol size={14} color="#000000" />
            Continue with Email
          </button>

          <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6, textAlign: 'center' }}>
              A popup will appear — sign in with your <span style={{ color: '#F5F5F5', fontWeight: 500 }}>email</span>.
              Your EVM wallet is created in the background instantly.
            </p>
          </div>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
