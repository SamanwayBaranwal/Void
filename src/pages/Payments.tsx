import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { useIsMobile } from '../lib/useIsMobile';
import { TableSkeleton } from '../components/Skeleton';
import { Search, X, SlidersHorizontal, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const TABS = ['all', 'incoming', 'outgoing'] as const;

export default function Payments() {
  const { user: privyUser } = usePrivy();
  const isMobile = useIsMobile();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch]     = useState('');

  useEffect(() => { if (privyUser) loadData(); }, [privyUser]);

  const loadData = async () => {
    if (!privyUser) return;
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('privy_id', privyUser.id)
      .eq('status', 'paid')
      .order('updated_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  // Every paid invoice counts as an incoming payment for now
  const transactions = invoices.map(inv => ({
    id: inv.id,
    hash: inv.tx_hash || `0x${inv.id.replace(/-/g, '').slice(0, 16)}…`,
    type: 'incoming' as const,
    from: inv.clients?.name || 'Unknown Client',
    to: 'You',
    amount: Number(inv.amount_usd),
    date: inv.updated_at || inv.created_at,
    invoiceNumber: inv.invoice_number || inv.id.slice(0, 8).toUpperCase(),
  }));

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase();
    const matchSearch = !q || tx.from.toLowerCase().includes(q) || tx.hash.toLowerCase().includes(q) || tx.invoiceNumber.toLowerCase().includes(q);
    const matchTab = activeTab === 'all' || tx.type === activeTab;
    return matchSearch && matchTab;
  });

  const totalIn  = transactions.filter(t => t.type === 'incoming').reduce((s, t) => s + t.amount, 0);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px',
    color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
    outline: 'none', boxSizing: 'border-box',
  };

  const TH: React.CSSProperties = {
    fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 600,
    color: '#3A3A3A', textTransform: 'uppercase', letterSpacing: '0.1em',
    padding: '10px 14px', textAlign: 'left', background: '#000000',
  };
  const TD: React.CSSProperties = {
    padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle',
  };

  return (
    <Layout>
      <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: '1200px' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Payments</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>{transactions.length} transactions</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Received', value: `$${fmt(totalIn)}`, sub: `${transactions.filter(t => t.type === 'incoming').length} incoming`, color: '#00FFB2' },
            { label: 'Total Sent',     value: '$0.00',             sub: '0 outgoing',                                                         color: '#6B7280' },
            { label: 'Net Balance',    value: `$${fmt(totalIn)}`, sub: 'revenue',                                                             color: '#F5F5F5' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#3A3A3A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 600 }}>{s.label}</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', color: s.color, fontWeight: 500, lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="no-scrollbar" style={{ display: 'flex', overflowX: 'auto', overflowY: 'hidden' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px',
                  fontSize: '13px', fontWeight: 500,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: activeTab === tab ? '#F5F5F5' : '#6B7280',
                  borderBottom: activeTab === tab ? '2px solid #F5F5F5' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'all 0.12s',
                  textTransform: 'capitalize',
                }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', flex: isMobile ? '1 1 100%' : 'none' }}>
            <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#444444' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search payments…"
                style={{ ...inputStyle, paddingLeft: '30px', width: isMobile ? '100%' : '200px' }} />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444444', padding: 0 }}>
                  <X size={11} />
                </button>
              )}
            </div>
            <button style={{ width: '32px', height: '32px', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <SlidersHorizontal size={13} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ marginTop: '16px' }}>
            <TableSkeleton rows={6} cols={isMobile ? 3 : 5} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }}>
            <img src="/assets/ash/ash-sitting-empty-state.png" width="240" alt="" style={{ display: 'block', margin: '0 auto 24px', opacity: 0.9 }} onError={e => (e.currentTarget.style.display = 'none')} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
              {search ? 'No matching transactions.' : 'No payments yet.'}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>
              {search ? 'Try a different search.' : 'Payments appear here once invoices are marked as paid.'}
            </p>
          </div>
        ) : (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }}>
            {isMobile ? (
              /* Mobile — vertical payment cards */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map(tx => (
                  <div key={tx.id} style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                        background: tx.type === 'incoming' ? 'rgba(0,255,178,0.06)' : 'rgba(255,77,77,0.06)',
                        color: tx.type === 'incoming' ? '#00FFB2' : '#FF4D4D',
                        border: `1px solid ${tx.type === 'incoming' ? 'rgba(0,255,178,0.15)' : 'rgba(255,77,77,0.15)'}`,
                      }}>
                        {tx.type === 'incoming' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        {tx.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                      </span>
                      <span style={{ fontSize: '15px', color: tx.type === 'incoming' ? '#00FFB2' : '#FF4D4D' }}>
                        {tx.type === 'incoming' ? '+' : '-'}${fmt(tx.amount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: '#C9CDD4', marginBottom: '2px' }}>{tx.from} · #{tx.invoiceNumber}</p>
                        <p style={{ fontSize: '10px', color: '#444444' }}>{tx.hash.length > 20 ? `${tx.hash.slice(0, 10)}…${tx.hash.slice(-6)}` : tx.hash}</p>
                      </div>
                      <span style={{ fontSize: '10px', color: '#444444', whiteSpace: 'nowrap', marginLeft: '8px' }}>{fmtDate(tx.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>TX Hash</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>From / To</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.018)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <td style={TD}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B7280' }}>
                        {tx.hash.length > 20 ? `${tx.hash.slice(0, 10)}…${tx.hash.slice(-6)}` : tx.hash}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 8px', borderRadius: '3px', fontSize: '10px',
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                        background: tx.type === 'incoming' ? 'rgba(0,255,178,0.06)' : 'rgba(255,77,77,0.06)',
                        color: tx.type === 'incoming' ? '#00FFB2' : '#FF4D4D',
                        border: `1px solid ${tx.type === 'incoming' ? 'rgba(0,255,178,0.15)' : 'rgba(255,77,77,0.15)'}`,
                      }}>
                        {tx.type === 'incoming' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        {tx.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                      </span>
                    </td>
                    <td style={TD}>
                      <div>
                        <p style={{ fontSize: '13px', color: '#C9CDD4', fontFamily: 'JetBrains Mono, monospace' }}>{tx.from}</p>
                        <p style={{ fontSize: '10px', color: '#444444', fontFamily: 'JetBrains Mono, monospace', marginTop: '1px' }}>#{tx.invoiceNumber}</p>
                      </div>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: tx.type === 'incoming' ? '#00FFB2' : '#FF4D4D' }}>
                        {tx.type === 'incoming' ? '+' : '-'}${fmt(tx.amount)}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#444444', whiteSpace: 'nowrap' }}>
                        {fmtDate(tx.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3A3A3A' }}>
                Showing {filtered.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
