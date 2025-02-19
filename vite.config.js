import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Change from 3000 to 5173 (or another available port)
    open: true,
    strictPort: true,
    host: '0.0.0.0',
    cors: true,
    hmr: {
      clientPort: 443,
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '6030-2600-4041-797a-e600-9190-588d-da35-258b.ngrok-free.app' // Your Ngrok URL
    ]
  }
});