import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { usePrivy, useWallets, useCreateWallet, getEmbeddedConnectedWallet } from '@privy-io/react-auth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Clients from './pages/Clients';
import Profile from './pages/Profile';
import InvoiceDetail from './pages/InvoiceDetail';
import WalletPage from './pages/Wallet';
import Transparency from './pages/Transparency';
import Pay from './pages/Pay';
import Payments from './pages/Payments';
import LoadingScreen from './components/LoadingScreen';

/**
 * Runs only when a user is authenticated.
 * Handles syncing profile to Supabase and auto-saving the Privy wallet address.
 * Kept as a separate component so useWallets() is only called after Privy is ready.
 */
function AuthenticatedSetup({ userId }: { userId: string }) {
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  // Sync Privy user → Supabase profiles on first login
  useEffect(() => {
    const sync = async () => {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', userId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('profiles').insert({
            privy_id: userId,
            display_name: 'My Account',
            email: '',
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Profile sync error:', err);
      }
    };
    sync();
  }, [userId]);

  // Create embedded wallet if user doesn't have one yet
  useEffect(() => {
    const embeddedWallet = getEmbeddedConnectedWallet(wallets);
    if (embeddedWallet) return; // already has one

    // Only attempt if wallets array has loaded (even if empty)
    if (wallets === undefined) return;

    const create = async () => {
      try {
        await createWallet();
      } catch {
        // May already exist or creation in progress — ignore
      }
    };
    create();
  }, [wallets]);

  // Auto-save the embedded wallet address to Supabase whenever it appears
  useEffect(() => {
    const embeddedWallet = getEmbeddedConnectedWallet(wallets);
    if (!embeddedWallet?.address) return;

    const save = async () => {
      try {
        const { registerWalletAddress } = await import('./lib/wallet');
        await registerWalletAddress(userId, embeddedWallet.address);
      } catch {
        // Already saved — silently ignore
      }
    };
    save();
  }, [userId, wallets]);

  return null;
}

function App() {
  const { user, ready } = usePrivy();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    setLoading(false);
  }, [ready]);

  // Hard fallback — never show spinner indefinitely
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      {/* Mount setup component only when authenticated */}
      {user && <AuthenticatedSetup userId={user.id} />}

      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/invoices" element={user ? <Invoices /> : <Navigate to="/" />} />
        <Route path="/invoices/:id" element={user ? <InvoiceDetail /> : <Navigate to="/" />} />
        <Route path="/clients" element={user ? <Clients /> : <Navigate to="/" />} />
        <Route path="/wallet" element={user ? <WalletPage /> : <Navigate to="/" />} />
        <Route path="/payments" element={user ? <Payments /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
        <Route path="/transparency" element={<Transparency />} />
        <Route path="/pay/:id" element={<Pay />} />
      </Routes>
    </Router>
  );
}

export default App;
