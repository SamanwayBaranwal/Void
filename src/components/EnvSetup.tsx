type EnvSetupProps = {
  missing: { key: string; label: string }[];
};

export default function EnvSetup({ missing }: EnvSetupProps) {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-surface-800 bg-surface-900 p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-white mb-2">Environment setup required</h1>
        <p className="text-sm text-surface-400 mb-6">
          Create a <code className="text-brand-400">.env</code> file in the project root with the
          values below, then restart the dev server.
        </p>

        <ul className="space-y-3 mb-6">
          {missing.map(({ key, label }) => (
            <li key={key} className="text-sm">
              <span className="font-mono text-brand-400">{key}</span>
              <span className="text-surface-500"> — {label}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg bg-surface-950 border border-surface-800 p-4 text-xs font-mono text-surface-300 space-y-1">
          <p>VITE_SUPABASE_URL=https://xxxx.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
          <p>VITE_PRIVY_APP_ID=clxxxxxxxx</p>
        </div>

        <p className="mt-6 text-xs text-surface-500">
          Supabase: Project Settings → API. Privy: dashboard.privy.io → your app → App ID.
        </p>
      </div>
    </div>
  );
}
