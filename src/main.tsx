import { createRoot } from 'react-dom/client';
import './index.css';
import EnvSetup from './components/EnvSetup';
import { getMissingEnvVars } from './lib/env';

const missingEnvVars = getMissingEnvVars();

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!);

  if (missingEnvVars.length > 0) {
    root.render(<EnvSetup missing={missingEnvVars} />);
    return;
  }

  const [{ default: App }, { PrivyProvider }] = await Promise.all([
    import('./App'),
    import('@privy-io/react-auth'),
  ]);

  root.render(
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID as string}
      config={{
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#F5F5F5',
        },
        // EVM only — avoids MetaMask / Solana injection conflicts
      }}
    >
      <App />
    </PrivyProvider>
  );
}

bootstrap();
