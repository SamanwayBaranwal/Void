import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { useIsMobile } from '../lib/useIsMobile';
import { Skeleton, CardsSkeleton, TableSkeleton } from '../components/Skeleton';
import { Plus, TrendingUp, ChevronRight } from 'lucide-react';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const STATUS_DOT: Record<string, string> = {
  paid: '#00FFB2', pending: '#FBBF24', overdue: '#FF4D4D', cancelled: '#6B7280', draft: '#333333',
};

function RevenueChart({ invoices }: { invoices: any[] }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  });

  const totals = months.map(m => ({
    ...m,
    value: invoices
      .filter(inv => inv.status === 'paid' && inv.created_at?.slice(0, 7) === m.key)
      .reduce((s: number, inv: any) => s + Number(inv.amount_usd), 0),
  }));

  const maxVal = Math.max(...totals.map(t => t.value), 1);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '64px', marginBottom: '8px' }}>
        {totals.map((t, i) => {
          const h = Math.max((t.value / maxVal) * 56, t.value > 0 ? 4 : 2);
          return (
            <div key={t.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{
                width: '100%', height: `${h}px`, borderRadius: '3px 3px 0 0',
                background: i === totals.length - 1 ? '#F5F5F5' : '#222222',
                transition: 'height 0.3s',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {totals.map(t => (
          <div key={t.key} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '8px', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user: privyUser } = usePrivy();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (privyUser) loadData(); }, [privyUser]);

  const loadData = async () => {
    if (!privyUser) return;
    const [{ data: p }, { data: inv }] = await Promise.all([
      supabase.from('profiles').select('*').eq('privy_id', privyUser.id).maybeSingle(),
      supabase.from('invoices').select('*, clients(name)').eq('privy_id', privyUser.id).order('created_at', { ascending: false }),
    ]);
    setProfile(p);
    setInvoices(inv || []);
    setLoading(false);
  };

  const paid      = invoices.filter(i => i.status === 'paid');
  const pending   = invoices.filter(i => i.status === 'pending');
  const overdue   = invoices.filter(i => i.status === 'overdue');
  const revenue   = paid.reduce((s, i) => s + Number(i.amount_usd), 0);
  const outstanding = [...pending, ...overdue].reduce((s, i) => s + Number(i.amount_usd), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
  const lastMonth = prev.toISOString().slice(0, 7);
  const thisMonthCount = invoices.filter(i => i.created_at?.startsWith(thisMonth)).length;
  const lastMonthCount = invoices.filter(i => i.created_at?.startsWith(lastMonth)).length;
  const invTrend = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0;

  const name = profile?.display_name && profile.display_name !== 'My Account' ? profile.display_name.split(' ')[0] : 'there';

  const TH: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 600,
    color: '#3A3A3A', textTransform: 'uppercase', letterSpacing: '0.1em',
    padding: '10px 14px', textAlign: 'left',
  };
  const TD: React.CSSProperties = {
    padding: '11px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle',
  };

  if (loading) return (
    <Layout>
      <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: '1200px' }}>
        <Skeleton w={140} h={20} style={{ marginBottom: 8 }} />
        <Skeleton w={200} h={12} style={{ marginBottom: 24 }} />
        <div style={{ marginBottom: 20 }}>
          <CardsSkeleton count={isMobile ? 2 : 4} />
        </div>
        <TableSkeleton rows={6} cols={isMobile ? 3 : 5} />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: '1200px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Dashboard</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>Welcome back, {name} 🙌</p>
          </div>
          <button
            onClick={() => navigate('/invoices')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '5px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Plus size={13} /> Create Invoice
          </button>
        </div>

        {/* First-time setup — shown until the profile is completed */}
        {!profile?.business_name && (!profile?.display_name || profile.display_name === 'My Account') && (
          <div style={{
            position: 'relative', background: '#050505',
            border: '1px solid rgba(0,255,178,0.25)', borderRadius: '8px',
            padding: isMobile ? '18px' : '22px 24px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '20px',
            flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left',
            boxShadow: '0 0 40px rgba(0,255,178,0.05)',
          }}>
            <img src="/assets/ash/ash-welcoming-onboarding.png" alt="" width={isMobile ? 90 : 96}
              style={{ flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', color: '#00FFB2', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.14em', marginBottom: '6px' }}>● NEXT STEP</p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>Set up your profile</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.65, marginBottom: '14px' }}>
                Add your business name, email, and details so your invoices show <span style={{ color: '#F5F5F5' }}>your</span> info — not a placeholder. Takes 1 minute.
              </p>
              <button onClick={() => navigate('/profile')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#00FFB2', color: '#000000', border: 'none', borderRadius: '5px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Complete Profile <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {([
            { label: 'Total Invoices', value: invoices.length.toString(), sub: invTrend !== 0 ? `${invTrend > 0 ? '+' : ''}${invTrend}% from last month` : 'all time', accent: invTrend > 0 ? '#00FFB2' : invTrend < 0 ? '#FF4D4D' : '' },
            { label: 'Total Revenue',  value: `$${fmt(revenue)}`,         sub: `${paid.length} paid invoices`,    accent: '' },
            { label: 'Paid Invoices',  value: paid.length.toString(),     sub: invoices.length > 0 ? `${Math.round((paid.length / invoices.length) * 100)}% of total` : '0% of total', accent: '' },
            { label: 'Outstanding',    value: `$${fmt(outstanding)}`,     sub: `${pending.length + overdue.length} invoices`, accent: '' },
          ] as const).map((s, i) => (
            <div key={i} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#3A3A3A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>{s.label}</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', color: '#F5F5F5', fontWeight: 500, lineHeight: 1, marginBottom: '6px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: s.accent || '#6B7280', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' } as any}>
                {s.accent && <TrendingUp size={10} />}{s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Two-column main */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '16px' }}>

          {/* Recent Invoices */}
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>Recent Invoices</p>
            </div>

            {invoices.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <img src="/assets/ash/ash-sitting-empty-state.png" width="190" alt="" style={{ marginBottom: '16px', opacity: 0.7 }} onError={e => (e.currentTarget.style.display = 'none')} />
                <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>No invoices yet. Create your first!</p>
                <button onClick={() => navigate('/invoices')} style={{ background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '4px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={12} /> New Invoice
                </button>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#000000' }}>
                      <th style={TH}>Invoice</th>
                      <th style={TH}>Client</th>
                      <th style={TH}>Status</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 7).map(inv => (
                      <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} style={{ cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.018)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <td style={TD}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#C9CDD4' }}>
                            #{inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td style={TD}>
                          <span style={{ fontSize: '13px', color: '#C9CDD4', fontFamily: 'JetBrains Mono, monospace' }}>{inv.clients?.name || '—'}</span>
                        </td>
                        <td style={TD}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_DOT[inv.status] || '#333333', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: STATUS_DOT[inv.status] || '#6B7280', fontFamily: 'JetBrains Mono, monospace', textTransform: 'capitalize' }}>{inv.status}</span>
                          </span>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#F5F5F5' }}>${fmt(Number(inv.amount_usd))}</span>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#444444', whiteSpace: 'nowrap' }}>{fmtRelative(inv.updated_at || inv.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => navigate('/invoices')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
                    View all Invoices <ChevronRight size={12} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Revenue Overview */}
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>Revenue Overview</p>
              <span style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 7px', borderRadius: '3px' }}>This Month</span>
            </div>
            <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '26px', fontWeight: 500, color: '#F5F5F5', marginBottom: '2px', lineHeight: 1 }}>
                ${fmt(revenue)}
              </p>
              <p style={{ fontSize: '11px', color: '#00FFB2', fontFamily: 'JetBrains Mono, monospace', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={10} /> Total earned
              </p>

              <RevenueChart invoices={invoices} />

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F5')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
                  View Analytics <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
