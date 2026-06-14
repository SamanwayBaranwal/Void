const PLACEHOLDER_VALUES = new Set([
  'your_supabase_url',
  'your_supabase_anon_key',
  'your_privy_app_id',
]);

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && !PLACEHOLDER_VALUES.has(value));
}

const REQUIRED_ENV_VARS = [
  { key: 'VITE_SUPABASE_URL', label: 'Supabase project URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase anon/public key' },
  { key: 'VITE_PRIVY_APP_ID', label: 'Privy app ID' },
] as const;

export function getMissingEnvVars(): { key: string; label: string }[] {
  return REQUIRED_ENV_VARS.filter(({ key }) => {
    const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
    return !isConfigured(value);
  });
}
