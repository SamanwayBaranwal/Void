import { useNavigate } from 'react-router-dom';
import {
  FileText, BarChart3, Lock, Puzzle, Send, DollarSign, ChevronRight,
  Twitter, Github, MessageCircle, Globe,
} from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';

const MONO = 'JetBrains Mono, monospace';

const NAV_LINKS = [
  { label: 'Features', target: 'features' },
  { label: 'How it works', target: 'how' },
  { label: 'Pricing', target: 'pricing' },
];

const PLANS = [
  {
    name: 'Monthly',
    price: '$3',
    period: '/month',
    tagline: 'Pay as you go.',
    features: ['Unlimited invoices', 'On-chain auto-verification', 'Real EVM wallet', 'Client management', 'Email + Google login'],
    highlight: false,
  },
  {
    name: 'Lifetime',
    price: '$20',
    period: 'one-time',
    tagline: 'Pay once. Yours forever.',
    features: ['Everything in Monthly', 'Lifetime access — no renewals', 'All future updates', 'Priority support', 'Founder badge'],
    highlight: true,
  },
];

const FEATURES = [
  { icon: FileText,  title: 'Crypto Invoicing',     desc: 'Create professional invoices in seconds. Get paid in crypto.' },
  { icon: BarChart3, title: 'Real-time Tracking',    desc: 'Track opens, payments, and status in real-time on-chain.' },
  { icon: Lock,      title: 'Secure & Trustless',    desc: 'Built on blockchain. Immutable, transparent, and censorship-resistant.' },
  { icon: Puzzle,    title: 'Seamless Integrations', desc: 'Connect your stack. Automate workflows. Save time.' },
];

const HOW_IT_WORKS = [
  { icon: FileText,   title: 'Create Invoice', desc: 'Add your client, items, and amount.' },
  { icon: Send,       title: 'Send',           desc: 'Share your invoice link or address.' },
  { icon: DollarSign, title: 'Get Paid',       desc: 'Client pays in crypto. On-chain, instant.' },
  { icon: BarChart3,  title: 'Track & Manage', desc: 'Track status and manage invoices.' },
];

const SOCIAL = [
  { Icon: Twitter,        label: 'Twitter' },
  { Icon: Github,         label: 'GitHub' },
  { Icon: MessageCircle,  label: 'Discord' },
  { Icon: Globe,          label: 'Mirror' },
];

const btn: React.CSSProperties = {
  outline: 'none', WebkitTapHighlightColor: 'transparent',
  border: 'none', cursor: 'pointer', fontFamily: MONO,
};

/** 3×3 pixel VOID symbol (the dot grid mark) */
function VoidDots({ dot = 6, gap = 4, color = '#FFFFFF', glow = true }: { dot?: number; gap?: number; color?: string; glow?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${dot}px)`, gap: `${gap}px`, flexShrink: 0 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{
          width: dot, height: dot, borderRadius: '1px', background: color,
          boxShadow: glow ? `0 0 6px ${color}88` : 'none',
        }} />
      ))}
    </div>
  );
}

/** Real VOID wordmark PNG, cropped to the letters (the source has heavy transparent
 *  padding) and rendered crisp/pixelated. `h` = visible height of the letters. */
function Wordmark({ h, glow = true }: { h: number; glow?: boolean }) {
  return (
    <div style={{
      height: h, width: h * 3.4,
      backgroundImage: 'url(/assets/logos/void-wordmark-white.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      filter: glow ? 'drop-shadow(0 0 10px rgba(255,255,255,0.18))' : 'none',
      flexShrink: 0,
    }} />
  );
}

/** L-shaped corner brackets on a bordered box */
function Corners({ size = 12, weight = 2, color = '#F5F5F5' }: { size?: number; weight?: number; color?: string }) {
  const base: React.CSSProperties = { position: 'absolute', width: size, height: size };
  return (
    <>
      <span style={{ ...base, top: -1, left: -1, borderTop: `${weight}px solid ${color}`, borderLeft: `${weight}px solid ${color}` }} />
      <span style={{ ...base, top: -1, right: -1, borderTop: `${weight}px solid ${color}`, borderRight: `${weight}px solid ${color}` }} />
      <span style={{ ...base, bottom: -1, left: -1, borderBottom: `${weight}px solid ${color}`, borderLeft: `${weight}px solid ${color}` }} />
      <span style={{ ...base, bottom: -1, right: -1, borderBottom: `${weight}px solid ${color}`, borderRight: `${weight}px solid ${color}` }} />
    </>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#F5F5F5',
      fontFamily: MONO,
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '66px', display: 'flex', alignItems: 'center', padding: isMobile ? '0 18px' : '0 48px',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* Logo — real pixel wordmark, cropped + crisp */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, cursor: 'pointer' }}>
            <VoidDots dot={8} gap={5} />
            <Wordmark h={26} />
          </div>

          {/* Center links — hidden on mobile */}
          <div style={{
            display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '38px',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          }}>
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.target)} style={{
                ...btn, background: 'none',
                color: '#9CA3AF', fontSize: '14px', fontWeight: 500,
                padding: '4px 0', letterSpacing: '0.02em',
                transition: 'color 0.2s, text-shadow 0.2s',
              }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.color = '#F5F5F5';
                  b.style.textShadow = '0 0 18px rgba(255,255,255,0.4)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.color = '#9CA3AF';
                  b.style.textShadow = 'none';
                }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                ...btn, background: 'none',
                color: '#9CA3AF', fontSize: '13px', fontWeight: 500,
                padding: '10px 14px', transition: 'color 0.2s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#F5F5F5')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF')}>
              Sign in
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                ...btn,
                background: 'linear-gradient(180deg, #FFFFFF 0%, #DEDEDE 100%)',
                color: '#080808', borderRadius: '6px',
                padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '7px',
                letterSpacing: '0.02em',
                boxShadow: '0 0 24px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 #FFFFFF',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = 'translateY(-1px)';
                b.style.boxShadow = '0 0 36px rgba(255,255,255,0.2), 0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 #FFFFFF';
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = 'translateY(0)';
                b.style.boxShadow = '0 0 24px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 #FFFFFF';
              }}>
              Launch App <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: isMobile ? 'auto' : '100vh', display: 'flex', alignItems: 'center',
        paddingTop: isMobile ? '96px' : '64px', paddingBottom: isMobile ? '40px' : 0,
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0 18px' : '0 48px', width: '100%',
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center',
        }}>

          {/* LEFT — text (one centered block) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: isMobile ? 'center' : 'stretch', textAlign: isMobile ? 'center' : 'left', minHeight: isMobile ? 'auto' : '560px' }}>
            {/* Tag pill */}
            <div style={{
              display: 'inline-flex', alignSelf: isMobile ? 'center' : 'flex-start', alignItems: 'center', gap: '9px',
              background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '5px', padding: '8px 16px', marginBottom: '22px', position: 'relative',
            }}>
              <Corners size={7} weight={1.5} color="rgba(255,255,255,0.55)" />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6EE7B7', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 10px #6EE7B7' }} />
              <span style={{ fontSize: '12px', color: '#C9CDD4', letterSpacing: '0.16em', fontWeight: 500 }}>
                THE INVOICE LAYER FOR WEB3
              </span>
            </div>

            {/* VOID wordmark — large, real pixel logo cropped + crisp */}
            <div style={{ marginBottom: '22px' }}>
              <Wordmark h={isMobile ? 78 : 120} />
            </div>

            {/* Tagline */}
            <p style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 600, color: '#F5F5F5', marginBottom: '14px', lineHeight: 1.25 }}>
              The invoice layer for Web3
            </p>

            {/* Description */}
            <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#9CA3AF', lineHeight: 1.8, marginBottom: '32px', maxWidth: '400px' }}>
              Create, send, and track crypto invoices.
              {isMobile ? ' ' : <br />}
              Built for freelancers, studios, and DAOs.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', marginBottom: '28px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  ...btn, background: '#F5F5F5', color: '#080808',
                  borderRadius: '4px', padding: '13px 26px', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.02em',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}>
                Launch App <ChevronRight size={15} />
              </button>
              <button
                onClick={() => navigate('/transparency')}
                style={{
                  ...btn, background: 'transparent', color: '#F5F5F5',
                  border: '1px solid rgba(255,255,255,0.14)', borderRadius: '4px',
                  padding: '13px 26px', fontSize: '13px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.02em',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = 'rgba(255,255,255,0.3)';
                  b.style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = 'rgba(255,255,255,0.14)';
                  b.style.background = 'transparent';
                }}>
                View Docs <FileText size={14} />
              </button>
            </div>

            {/* Powered by VOID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
              <VoidDots dot={4} gap={3} color="#666666" glow={false} />
              <span style={{ fontSize: '11px', color: '#4B5563', letterSpacing: '0.06em' }}>Powered by VOID</span>
            </div>
          </div>

          {/* RIGHT — Ash + invoice */}
          <div style={{ position: 'relative', minHeight: isMobile ? 'auto' : '620px' }}>

            {/* ── MOBILE: clean centered stack (mascot, then invoice — no overlap) ── */}
            {isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
                    width: '230px', height: '54px',
                    background: 'radial-gradient(ellipse at center, rgba(60,255,180,0.5) 0%, transparent 70%)',
                    filter: 'blur(16px)', borderRadius: '50%',
                  }} />
                  <img src="/assets/ash/ash-master-character.png" alt="Ash"
                    style={{ width: '230px', maxWidth: '64%', display: 'block', position: 'relative', zIndex: 1 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                </div>
                <img src="/assets/ash/void-invoice-mockup.png" alt="Invoice preview"
                  style={{ width: '240px', maxWidth: '80%', display: 'block', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}

            {/* ── DESKTOP: layered mascot + floating invoice over grid floor ── */}
            {!isMobile && <>

            {/* CSS perspective grid floor */}
            <div style={{
              position: 'absolute', bottom: 0, left: '-30px', right: '-30px',
              height: '280px', overflow: 'hidden', zIndex: 0,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.13) 1px,transparent 1px)',
                backgroundSize: '52px 52px',
                transform: 'perspective(480px) rotateX(74deg)',
                transformOrigin: 'center bottom',
                WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 60%)',
                maskImage: 'linear-gradient(to top, black 0%, transparent 60%)',
              }} />
            </div>

            {/* Glow under Ash's feet — flat grounded ellipse centered on the shoes */}
            <div style={{
              position: 'absolute', bottom: '78px', left: '55px',
              width: '330px', height: '70px', zIndex: 1,
              background: 'radial-gradient(ellipse at center, rgba(60,255,180,0.55) 0%, rgba(60,255,180,0.18) 40%, transparent 72%)',
              filter: 'blur(16px)', borderRadius: '50%',
            }} />

            {/* Ash character */}
            <img
              src="/assets/ash/ash-master-character.png"
              alt="Ash"
              style={{ position: 'absolute', bottom: '60px', left: '10px', width: '420px', maxWidth: '78%', display: 'block', zIndex: 2 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
            />

            {/* Invoice mockup */}
            <div style={{ position: 'absolute', bottom: '80px', right: '0', zIndex: 2 }}>
              <img
                src="/assets/ash/void-invoice-mockup.png"
                alt="Invoice preview"
                style={{ width: '255px', display: 'block', borderRadius: '6px' }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const card = document.createElement('div');
                  card.style.cssText = 'width:255px;background:#0A0A0A;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:18px;position:relative;box-shadow:0 24px 64px rgba(0,0,0,0.85);font-family:' + MONO + ';';
                  card.innerHTML = `
                    <span style="position:absolute;top:-1px;left:-1px;width:12px;height:12px;border-top:2px solid #F5F5F5;border-left:2px solid #F5F5F5;"></span>
                    <span style="position:absolute;top:-1px;right:-1px;width:12px;height:12px;border-top:2px solid #F5F5F5;border-right:2px solid #F5F5F5;"></span>
                    <span style="position:absolute;bottom:-1px;left:-1px;width:12px;height:12px;border-bottom:2px solid #F5F5F5;border-left:2px solid #F5F5F5;"></span>
                    <span style="position:absolute;bottom:-1px;right:-1px;width:12px;height:12px;border-bottom:2px solid #F5F5F5;border-right:2px solid #F5F5F5;"></span>
                    <div style="margin-bottom:7px;"><span style="font-size:10px;font-weight:600;color:#9CA3AF;letter-spacing:0.06em;">INVOICE #INV-2024-0017</span></div>
                    <div style="margin-bottom:14px;"><span style="background:rgba(110,231,183,0.1);color:#6EE7B7;border:1px solid rgba(110,231,183,0.25);padding:3px 8px;border-radius:3px;font-size:8px;font-weight:600;letter-spacing:0.08em;">● PAYMENT CONFIRMED</span></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
                      <div><div style="font-size:8px;color:#4B5563;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;">FROM</div><div style="font-size:12px;color:#F5F5F5;font-weight:500;margin-bottom:3px;">Void Studio</div><div style="font-size:9px;color:#6B7280;">0xA1b2...C9f8</div></div>
                      <div><div style="font-size:8px;color:#4B5563;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;">TO</div><div style="font-size:12px;color:#F5F5F5;font-weight:500;margin-bottom:3px;">Acme Labs</div><div style="font-size:9px;color:#6B7280;">0x73E9...F2a1</div></div>
                    </div>
                    <div style="border-top:1px dashed rgba(255,255,255,0.1);padding-top:12px;">
                      <div style="font-size:8px;color:#4B5563;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">TOTAL DUE</div>
                      <div style="font-size:26px;font-weight:500;color:#F5F5F5;line-height:1;letter-spacing:-0.02em;">0.140 ETH</div>
                      <div style="font-size:10px;color:#6B7280;margin-top:4px;">≈ $498.22 USD</div>
                    </div>`;
                  (e.currentTarget as HTMLImageElement).parentElement!.appendChild(card);
                }}
              />
            </div>

            </>}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: isMobile ? '0 18px 70px' : '0 48px 90px', scrollMarginTop: '90px' }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)', gap: '20px',
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              position: 'relative', background: '#050505',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
              padding: '28px 24px', transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => {
                const d = e.currentTarget as HTMLDivElement;
                d.style.borderColor = 'rgba(255,255,255,0.18)';
                d.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                const d = e.currentTarget as HTMLDivElement;
                d.style.borderColor = 'rgba(255,255,255,0.08)';
                d.style.transform = 'translateY(0)';
              }}>
              <Corners size={11} weight={1.5} color="rgba(255,255,255,0.55)" />
              <div style={{
                width: '44px', height: '44px', marginBottom: '20px',
                background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={19} color="#F5F5F5" strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#F5F5F5', marginBottom: '10px', letterSpacing: '0.01em' }}>{f.title}</p>
              <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: isMobile ? '20px 18px 70px' : '40px 48px 100px', scrollMarginTop: '90px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '72px' }}>
            <div style={{
              position: 'relative', padding: '12px 28px',
            }}>
              <Corners size={12} weight={2} color="#F5F5F5" />
              <span style={{ fontSize: '12px', color: '#D1D5DB', letterSpacing: '0.2em', fontWeight: 600 }}>
                HOW IT WORKS
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', position: 'relative' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} style={{ textAlign: 'center', padding: '0 20px', position: 'relative' }}>
                {i < 3 && (
                  <div style={{ position: 'absolute', top: '27px', left: '50%', right: '-50%', height: '1px', borderTop: '1px dashed rgba(255,255,255,0.12)', zIndex: 0 }} />
                )}
                <div style={{
                  width: '54px', height: '54px', background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', position: 'relative', zIndex: 1,
                }}>
                  <step.icon size={20} color="#F5F5F5" strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F5F5F5', marginBottom: '8px' }}>{step.title}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: isMobile ? '20px 18px 70px' : '20px 48px 100px', scrollMarginTop: '90px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Section label */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', padding: '12px 28px' }}>
              <Corners size={12} weight={2} color="#F5F5F5" />
              <span style={{ fontSize: '12px', color: '#D1D5DB', letterSpacing: '0.2em', fontWeight: 600 }}>PRICING</span>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#9CA3AF', marginBottom: '12px' }}>
            Simple pricing. Pay in crypto.
          </p>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#6B7280', marginBottom: '48px' }}>
            Settle with <span style={{ color: '#6EE7B7' }}>USDC</span> or <span style={{ color: '#6EE7B7' }}>USDT</span> on any supported chain — no cards, no banks.
          </p>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                position: 'relative', background: plan.highlight ? '#070707' : '#050505',
                border: `1px solid ${plan.highlight ? 'rgba(110,231,183,0.35)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px', padding: '32px 28px',
                boxShadow: plan.highlight ? '0 0 40px rgba(110,231,183,0.06)' : 'none',
              }}>
                <Corners size={13} weight={2} color={plan.highlight ? '#6EE7B7' : '#F5F5F5'} />
                {plan.highlight && (
                  <span style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: '#6EE7B7', color: '#000000', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', padding: '4px 12px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    BEST VALUE
                  </span>
                )}
                <p style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '46px', fontWeight: 800, color: '#F5F5F5', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '24px' }}>{plan.tagline}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: plan.highlight ? '#6EE7B7' : '#F5F5F5', fontSize: '13px', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '12px', color: '#C9CDD4' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/auth')}
                  style={{
                    ...btn, width: '100%',
                    background: plan.highlight ? '#6EE7B7' : '#F5F5F5',
                    color: '#000000', borderRadius: '6px', padding: '13px',
                    fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}>
                  Get {plan.name} <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#444444', marginTop: '24px' }}>
            All plans include unlimited invoices · No hidden fees · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: isMobile ? '0 18px 70px' : '0 48px 100px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            background: '#050505', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: isMobile ? '32px 24px' : '56px 64px', position: 'relative',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '24px' : '40px',
          }}>
            <Corners size={14} weight={2} color="#F5F5F5" />
            <div>
              <h2 style={{ fontSize: '27px', fontWeight: 700, color: '#F5F5F5', marginBottom: '14px', letterSpacing: '0.01em' }}>
                Ready to get paid on your terms?
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.75 }}>
                Join thousands of builders using VOID<br />to simplify crypto payments.
              </p>
            </div>
            <button
              onClick={() => navigate('/auth')}
              style={{
                ...btn, background: '#F5F5F5', color: '#080808',
                borderRadius: '4px', padding: '14px 30px', fontSize: '14px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap',
                letterSpacing: '0.02em', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}>
              Launch App <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '40px 18px 32px' : '52px 48px 36px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '40px', marginBottom: '44px', flexWrap: 'wrap' }}>

            {/* Brand */}
            <div style={{ maxWidth: '320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <VoidDots dot={8} gap={5} />
                <Wordmark h={24} glow={false} />
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.75 }}>
                The invoice layer for Web3.<br />Built for a borderless future.
              </p>
            </div>

            {/* Nav + socials */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '28px' }}>
                {NAV_LINKS.map(l => (
                  <button key={l.label} onClick={() => scrollTo(l.target)} style={{ ...btn, background: 'none', color: '#9CA3AF', fontSize: '13px', padding: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#F5F5F5')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF')}>
                    {l.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {SOCIAL.map(({ Icon, label }) => (
                  <a key={label} href="#" title={label} onClick={e => e.preventDefault()} style={{
                    width: '36px', height: '36px', background: '#0A0A0A',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                  }}
                    onMouseEnter={e => {
                      const a = e.currentTarget as HTMLAnchorElement;
                      a.style.borderColor = 'rgba(255,255,255,0.25)';
                      a.style.background = '#111111';
                    }}
                    onMouseLeave={e => {
                      const a = e.currentTarget as HTMLAnchorElement;
                      a.style.borderColor = 'rgba(255,255,255,0.08)';
                      a.style.background = '#0A0A0A';
                    }}>
                    <Icon size={16} color="#9CA3AF" strokeWidth={1.8} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '11px', color: '#444444' }}>© 2025 Void. All rights reserved.</p>
            <p style={{ fontSize: '11px', color: '#444444', letterSpacing: '0.04em' }}>Secure. Private. Onchain.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
