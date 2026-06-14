import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { useIsMobile } from '../lib/useIsMobile';
import { TableSkeleton } from '../components/Skeleton';
import { Plus, Search, X, SlidersHorizontal } from 'lucide-react';

const STATUS_DOT: Record<string, string> = {
  paid: '#00FFB2', pending: '#FBBF24', overdue: '#FF4D4D', cancelled: '#6B7280', draft: '#333333',
};

const TABS = ['all', 'paid', 'pending', 'overdue', 'draft'] as const;

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Invoices() {
  const { user: privyUser } = usePrivy();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [invoices, setInvoices]   = useState<any[]>([]);
  const [clients, setClients]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showForm, setShowForm]   = useState(false);

  // form state
  const [selectedClient, setSelectedClient] = useState('');
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [amountUsd, setAmount]  = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [formError, setFormErr] = useState('');

  useEffect(() => { if (privyUser) loadData(); }, [privyUser]);

  const loadData = async () => {
    if (!privyUser) return;
    const [{ data: inv }, { data: cl }] = await Promise.all([
      supabase.from('invoices').select('*, clients(name)').eq('privy_id', privyUser.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('privy_id', privyUser.id),
    ]);
    setInvoices(inv || []);
    setClients(cl || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    if (!privyUser) return;
    const { error } = await supabase.from('invoices').insert({
      privy_id: privyUser.id,
      client_id: selectedClient || null,
      invoice_number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
      title, description,
      amount_usd: parseFloat(amountUsd),
      due_date: dueDate || null,
      status: 'pending',
    });
    if (error) { setFormErr(error.message); return; }
    setSelectedClient(''); setTitle(''); setDesc(''); setAmount(''); setDueDate('');
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    loadData();
  };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      inv.title.toLowerCase().includes(q) ||
      inv.clients?.name?.toLowerCase().includes(q) ||
      (inv.invoice_number || '').toLowerCase().includes(q);
    const matchTab = activeTab === 'all' || inv.status === activeTab;
    return matchSearch && matchTab;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px',
    color: '#F5F5F5', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
    boxSizing: 'border-box',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Invoices</h1>
            <p style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>{invoices.length} total</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '5px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Plus size={13} /> Create Invoice
          </button>
        </div>

        {/* Tabs + Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', overflowX: 'auto', maxWidth: '100%' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span style={{ marginLeft: '6px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: activeTab === tab ? '#6B7280' : '#333333' }}>
                  {tab === 'all' ? invoices.length : invoices.filter(i => i.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search + filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', flex: isMobile ? '1 1 100%' : 'none' }}>
            <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#444444' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search invoices…"
                style={{ ...inputStyle, paddingLeft: '30px', width: isMobile ? '100%' : '200px' }}
              />
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
            <img
              src={search || activeTab !== 'all' ? '/assets/ash/ash-sitting-empty-state.png' : '/assets/ash/ash-holding-invoice.png'}
              width="220" alt="" style={{ display: 'block', margin: '0 auto 24px', opacity: 0.9 }}
              onError={e => (e.currentTarget.style.display = 'none')} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
              {search || activeTab !== 'all' ? 'No matching invoices.' : 'No invoices yet.'}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '20px' }}>
              {search || activeTab !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first invoice and get paid onchain.'}
            </p>
            {!search && activeTab === 'all' && (
              <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '4px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                <Plus size={13} /> New Invoice
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }}>
            {isMobile ? (
              /* Mobile — vertical cards, no horizontal scroll */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map(inv => (
                  <div key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)}
                    style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#C9CDD4' }}>#{inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_DOT[inv.status] || '#333333' }} />
                        <span style={{ fontSize: '11px', color: STATUS_DOT[inv.status] || '#6B7280', textTransform: 'capitalize' }}>{inv.status}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '13px', color: '#F5F5F5', marginBottom: '3px' }}>{inv.clients?.name || <span style={{ color: '#444' }}>No client</span>}</p>
                        <p style={{ fontSize: '10px', color: '#444444' }}>{fmtDate(inv.created_at)}</p>
                      </div>
                      <span style={{ fontSize: '16px', color: '#F5F5F5', fontWeight: 500 }}>${fmt(Number(inv.amount_usd))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Invoice</th>
                  <th style={TH}>Client</th>
                  <th style={TH}>Status</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Issued</th>
                  <th style={{ ...TH, width: '40px' }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.018)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <td style={TD}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#C9CDD4' }}>
                        #{inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: '13px', color: '#C9CDD4', fontFamily: 'JetBrains Mono, monospace' }}>
                        {inv.clients?.name || <span style={{ color: '#333333' }}>No client</span>}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_DOT[inv.status] || '#333333', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', color: STATUS_DOT[inv.status] || '#6B7280', fontFamily: 'JetBrains Mono, monospace', textTransform: 'capitalize' }}>{inv.status}</span>
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#F5F5F5' }}>
                        ${fmt(Number(inv.amount_usd))}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#444444', whiteSpace: 'nowrap' }}>
                        {fmtDate(inv.created_at)}
                      </span>
                    </td>
                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handleDelete(inv.id, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A2A2A', padding: '4px', borderRadius: '3px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#FF4D4D')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#2A2A2A')}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3A3A3A' }}>
                Showing 1 to {Math.min(filtered.length, filtered.length)} of {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
            <div style={{ width: '100%', maxWidth: '500px', background: '#050505', border: '1px solid #222222', borderRadius: '8px', padding: '24px', position: 'relative' }}>
              {/* Corners */}
              {[['top:-1px','left:-1px','borderTop','borderLeft'],['top:-1px','right:-1px','borderTop','borderRight'],['bottom:-1px','left:-1px','borderBottom','borderLeft'],['bottom:-1px','right:-1px','borderBottom','borderRight']].map(([tb, lr, b1, b2], idx) => (
                <span key={idx} style={{ position: 'absolute', width: '12px', height: '12px', [b1]: '2px solid #F5F5F5', [b2]: '2px solid #F5F5F5', [tb.split(':')[0]]: tb.split(':')[1], [lr.split(':')[0]]: lr.split(':')[1] } as React.CSSProperties} />
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>New Invoice</h3>
                <button onClick={() => setShowForm(false)} style={{ background: '#161616', border: '1px solid #222222', borderRadius: '5px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={13} color="#6B7280" />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Client</label>
                  <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }}>
                    <option value="">No client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Invoice Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Web Design Services" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Amount (USD) *</label>
                    <input type="number" step="0.01" min="0.01" value={amountUsd} onChange={e => setAmount(e.target.value)}
                      style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }} placeholder="0.00" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Description</label>
                  <textarea value={description} onChange={e => setDesc(e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }} placeholder="What's this invoice for?" />
                </div>
                {formError && (
                  <div style={{ padding: '10px 12px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '5px', color: '#FF4D4D', fontSize: '12px' }}>{formError}</div>
                )}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>Create Invoice</button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#F5F5F5', border: '1px solid #222222', borderRadius: '5px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
