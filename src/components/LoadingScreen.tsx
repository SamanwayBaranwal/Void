/**
 * Full-screen VOID loading screen — Ash mascot floating on the signature
 * black grid background. Used for app boot / route transitions.
 */
export default function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#000000',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
      backgroundSize: '48px 48px', backgroundAttachment: 'fixed',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <img
        src="/assets/ash/ash-running-loading.png"
        width="150" alt=""
        className="void-float"
        onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
      />
      <p style={{
        fontSize: '12px', color: '#6B7280', letterSpacing: '0.18em',
        textTransform: 'uppercase', fontWeight: 500,
      }}>{label}</p>
    </div>
  );
}
