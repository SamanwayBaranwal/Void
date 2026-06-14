import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Privy's dashboard whitelists http://localhost:5176 for its login iframe.
  // strictPort ensures we never drift to another port (which breaks Privy login via CSP).
  server: {
    port: 5176,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
