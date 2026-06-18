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
        loginMethods: ['email'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        appearance: {
          theme: '#000000',
          accentColor: '#6EE7B7',
          showWalletLoginFirst: false,
        },
        // EVM only — avoids MetaMask / Solana injection conflicts
      }}
    >
      <App />
    </PrivyProvider>
  );
}

bootstrap();
