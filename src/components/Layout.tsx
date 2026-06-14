import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import {
  LayoutDashboard, FileText, ArrowLeftRight, Users, Wallet,
  Package, BarChart3, Settings, Puzzle, CreditCard, LogOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../lib/useIsMobile';

function VoidSymbol({ size = 12, color = '#F5F5F5' }: { size?: number; color?: string }) {
  const d = Math.floor(size / 4), g = Math.floor(size / 6);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3,${d}px)`, gap: `${g}px`, flexShrink: 0 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ width: d, height: d, background: color, borderRadius: '1px' }} />
      ))}
    </div>
  );
}

const MAIN_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/invoices',  icon: FileText,         label: 'Invoices'  },
  { path: '/payments',  icon: ArrowLeftRight,    label: 'Payments'  },
  { path: '/wallet',    icon: Wallet,            label: 'Wallet'    },
  { path: '/clients',   icon: Users,             label: 'Clients'   },
  { path: '/products',  icon: Package,           label: 'Products', soon: true },
  { path: '/analytics', icon: BarChart3,         label: 'Analytics', soon: true },
];

const SETTINGS_NAV = [
  { path: '/profile',      icon: Settings,   label: 'Settings'      },
  { path: '/integrations', icon: Puzzle,     label: 'Integrations', soon: true },
  { path: '/billing',      icon: CreditCard, label: 'Billing',      soon: true },
];

// Phone app-style bottom tab bar — the 5 most-used destinations
const BOTTOM_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home'     },
  { path: '/invoices',  icon: FileText,         label: 'Invoices' },
  { path: '/wallet',    icon: Wallet,            label: 'Wallet'   },
  { path: '/clients',   icon: Users,             label: 'Clients'  },
  { path: '/profile',   icon: Settings,          label: 'Settings' },
];

type NavItemType = { path: string; icon: React.ComponentType<any>; label: string; soon?: boolean };

function NavBtn({ item, active }: { item: NavItemType; active: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { if (!item.soon) navigate(item.path); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '7px 10px 7px 8px',
        borderRadius: '5px', width: '100%', textAlign: 'left',
        background: active ? 'rgba(245,245,245,0.04)' : 'none',
        border: 'none',
        borderLeft: active ? '2px solid #F5F5F5' : '2px solid transparent',
        cursor: item.soon ? 'default' : 'pointer',
        color: active ? '#F5F5F5' : '#6B7280',
        fontSize: '12px', fontWeight: active ? 600 : 400,
        fontFamily: 'JetBrains Mono, monospace',
        transition: 'all 0.12s',
        opacity: item.soon ? 0.38 : 1,
      }}
      onMouseEnter={e => { if (!active && !item.soon) (e.currentTarget.style.color = '#C9CDD4'); }}
      onMouseLeave={e => { if (!active) (e.currentTarget.style.color = '#6B7280'); }}
    >
      <item.icon size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.soon && (
        <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#333333', letterSpacing: '0.06em' }}>SOON</span>
      )}
    </button>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user: privyUser } = usePrivy();
  const [displayName, setDisplayName] = useState('Account');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!privyUser) return;
    supabase.from('profiles').select('display_name').eq('privy_id', privyUser.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name && data.display_name !== 'My Account') setDisplayName(data.display_name); });
  }, [privyUser]);

  const isActive = (path: string) =>
    path === '/invoices' ? location.pathname.startsWith('/invoices') : location.pathname === path;

  return (
    <div style={{
      minHeight: '100vh', background: '#000000',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
      backgroundSize: '48px 48px', backgroundAttachment: 'fixed',
      fontFamily: 'JetBrains Mono, monospace',
    }}>

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header className="no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, height: '54px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }} onClick={() => navigate('/dashboard')}>
            <VoidSymbol size={16} color="#F5F5F5" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#F5F5F5', letterSpacing: '0.14em' }}>VOID</span>
          </div>
          <button onClick={async () => { await logout(); navigate('/'); }} aria-label="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '6px', display: 'flex' }}>
            <LogOut size={18} />
          </button>
        </header>
      )}

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside className="no-print" style={{
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          width: '230px', height: '100vh',
          position: 'fixed', left: 0, top: 0, zIndex: 60,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Logo */}
          <div onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer',
            padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <VoidSymbol size={16} color="#F5F5F5" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#F5F5F5', letterSpacing: '0.14em' }}>VOID</span>
          </div>

          {/* Navigation */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 6px', overflowY: 'auto' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {MAIN_NAV.map(item => <NavBtn key={item.path} item={item} active={isActive(item.path)} />)}
            </nav>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 4px' }} />
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {SETTINGS_NAV.map(item => <NavBtn key={item.path} item={item} active={isActive(item.path)} />)}
            </nav>
          </div>

          {/* User card */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                <img src="/assets/ash/ash-neutral.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ fontSize: '10px', color: '#6B7280' }}>Studio Plan</p>
              </div>
            </div>
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', width: '100%',
                padding: '5px 4px', borderRadius: '4px', background: 'none', border: 'none', cursor: 'pointer',
                color: '#3A3A3A', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FF4D4D')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3A3A3A')}>
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* ── Mobile bottom tab bar (phone-app style) ── */}
      {isMobile && (
        <nav className="no-print" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, height: '64px',
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {BOTTOM_NAV.map(item => {
            const active = isActive(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{
                  flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  color: active ? '#F5F5F5' : '#6B7280', padding: '8px 0',
                }}>
                <item.icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}>{item.label}</span>
                {active && <span style={{ position: 'absolute', top: 0, width: '28px', height: '2px', background: '#F5F5F5', borderRadius: '0 0 2px 2px' }} />}
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Main ── */}
      <div className="app-main" style={{
        marginLeft: isMobile ? 0 : '230px',
        paddingTop: isMobile ? '54px' : 0,
        paddingBottom: isMobile ? '72px' : 0,
        minHeight: '100vh',
      }}>
        <main>{children}</main>
      </div>
    </div>
  );
}
