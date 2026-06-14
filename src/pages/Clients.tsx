import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { useIsMobile } from '../lib/useIsMobile';
import { TableSkeleton } from '../components/Skeleton';
import { Plus, Search, X } from 'lucide-react';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AVATAR_COLORS = ['#1A2A1A', '#1A1A2A', '#2A1A1A', '#1A2A2A', '#2A2A1A'];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: color, border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>{initials}</span>
    </div>
  );
}

export default function Clients() {
  const { user: privyUser } = usePrivy();
  const isMobile = useIsMobile();

  const [clients, setClients]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);

  // form
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [company, setCompany]   = useState('');
  const [wallet, setWallet]     = useState('');
  const [notes, setNotes]       = useState('');
  const [formError, setErr]     = useState('');

  useEffect(() => { if (privyUser) loadClients(); }, [privyUser]);

  const loadClients = async () => {
    if (!privyUser) return;
    const { data } = await supabase
      .from('clients')
      .select('*, invoices(id, amount_usd, status)')
      .eq('privy_id', privyUser.id)
      .order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!privyUser) return;
    try {
      const { error } = await supabase.from('clients').insert({
        privy_id: privyUser.id, name, email, company,
        wallet_address: wallet, notes,
      });
      if (error) {
        // Distinguish "backend unreachable" from real DB errors
        if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
          setErr('Cannot reach the database. Your Supabase project is paused or offline — resume it at supabase.com/dashboard.');
        } else {
          setErr(error.message);
        }
        return;
      }
      setName(''); setEmail(''); setCompany(''); setWallet(''); setNotes('');
      setShowForm(false);
      loadClients();
    } catch (err: any) {
      setErr(
        /failed to fetch|networkerror|load failed/i.test(err?.message || '')
          ? 'Cannot reach the database. Your Supabase project is paused or offline — resume it at supabase.com/dashboard.'
          : (err?.message || 'Something went wrong.')
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    loadClients();
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  const invoiceCount = (c: any) => (c.invoices || []).length;
  const totalPaid = (c: any) =>
    (c.invoices || []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount_usd), 0);

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
    padding: '13px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle',
  };

  return (
    <Layout>
      <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: '1200px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Clients</h1>
            <p style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>{clients.length} total</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#444444' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search clients…"
                style={{ ...inputStyle, paddingLeft: '30px', width: isMobile ? '100%' : '200px' }} />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444444', padding: 0 }}>
                  <X size={11} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '5px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              <Plus size={13} /> New Client
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={6} cols={isMobile ? 3 : 5} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
            <img src="/assets/ash/ash-sitting-empty-state.png" width="240" alt="" style={{ display: 'block', margin: '0 auto 24px', opacity: 0.9 }} onError={e => (e.currentTarget.style.display = 'none')} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
              {search ? 'No matching clients.' : 'No clients yet.'}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace', marginBottom: '20px' }}>
              {search ? 'Try a different search.' : 'Add your first client to get started.'}
            </p>
            {!search && (
              <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '4px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}>
                <Plus size={13} /> Add Client
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
            {isMobile ? (
              /* Mobile — vertical client cards */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map(client => {
                  const paid = totalPaid(client);
                  return (
                    <div key={client.id} style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar name={client.name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#F5F5F5', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280' }}>
                          {invoiceCount(client)} invoice{invoiceCount(client) !== 1 ? 's' : ''}
                          {client.wallet_address && ` · ${client.wallet_address.slice(0, 6)}…${client.wallet_address.slice(-4)}`}
                        </p>
                      </div>
                      <span style={{ fontSize: '13px', color: paid > 0 ? '#00FFB2' : '#3A3A3A', flexShrink: 0 }}>${fmt(paid)}</span>
                      <button onClick={() => handleDelete(client.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3A3A3A', padding: '4px', flexShrink: 0 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Client</th>
                  <th style={TH}>Address</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Invoices</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Total Paid</th>
                  <th style={{ ...TH, width: '40px' }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => {
                  const invCount = invoiceCount(client);
                  const paid = totalPaid(client);
                  return (
                    <tr key={client.id} style={{ cursor: 'default' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.018)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <td style={TD}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={client.name} />
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1px' }}>{client.name}</p>
                            {client.email && <p style={{ fontSize: '11px', color: '#444444', fontFamily: 'JetBrains Mono, monospace' }}>{client.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={TD}>
                        {client.wallet_address ? (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6B7280' }}>
                            {client.wallet_address.slice(0, 6)}...{client.wallet_address.slice(-4)}
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#2A2A2A' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#C9CDD4' }}>{invCount}</span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: paid > 0 ? '#00FFB2' : '#3A3A3A' }}>
                          ${fmt(paid)}
                        </span>
                      </td>
                      <td style={TD}>
                        <button
                          onClick={() => handleDelete(client.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A2A2A', padding: '4px', borderRadius: '3px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FF4D4D')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#2A2A2A')}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3A3A3A' }}>
                Showing {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Add Client Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
            <div style={{ width: '100%', maxWidth: '480px', background: '#050505', border: '1px solid #222222', borderRadius: '8px', padding: '24px', position: 'relative' }}>
              {[['top:-1px','left:-1px','borderTop','borderLeft'],['top:-1px','right:-1px','borderTop','borderRight'],['bottom:-1px','left:-1px','borderBottom','borderLeft'],['bottom:-1px','right:-1px','borderBottom','borderRight']].map(([tb, lr, b1, b2], idx) => (
                <span key={idx} style={{ position: 'absolute', width: '12px', height: '12px', [b1]: '2px solid #F5F5F5', [b2]: '2px solid #F5F5F5', [tb.split(':')[0]]: tb.split(':')[1], [lr.split(':')[0]]: lr.split(':')[1] } as React.CSSProperties} />
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F5F5F5', fontFamily: 'JetBrains Mono, monospace' }}>New Client</h3>
                <button onClick={() => setShowForm(false)} style={{ background: '#161616', border: '1px solid #222222', borderRadius: '5px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={13} color="#6B7280" />
                </button>
              </div>
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Jane Smith" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Email *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="jane@acme.com" required />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Company</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} placeholder="Acme Inc." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Wallet Address</label>
                  <input type="text" value={wallet} onChange={e => setWallet(e.target.value)} style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }} placeholder="0x…" spellCheck={false} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6B7280', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: '56px' }} placeholder="Any notes…" />
                </div>
                {formError && <div style={{ padding: '10px 12px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '5px', color: '#FF4D4D', fontSize: '12px' }}>{formError}</div>}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', background: '#F5F5F5', color: '#080808', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>Save Client</button>
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
