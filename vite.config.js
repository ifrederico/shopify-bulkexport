// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  plugins: [react()],
  base: '/shopify-bulkexport/',
  server: {
    port: 5173,
  },
  define: {
    // Expose the SHOPIFY_API_KEY to client code
    'import.meta.env.SHOPIFY_API_KEY': JSON.stringify(process.env.SHOPIFY_API_KEY),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  }
});