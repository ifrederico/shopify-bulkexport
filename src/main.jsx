// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import enTranslations from '@shopify/polaris/locales/en.json';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';

import App from './App';
import './index.css';

const urlParams = new URLSearchParams(window.location.search);
const shopParam = urlParams.get('shop');
const hostParam = urlParams.get('host');

if (!shopParam || !hostParam) {
  // Adjust "your-shop.myshopify.com" to your real dev store domain
  window.location.href = `/shopify-bulkexport/auth?shop=your-shop.myshopify.com`;
} else {
  const appBridgeConfig = {
    apiKey: import.meta.env.SHOPIFY_API_KEY, // from define() in vite.config.js
    host: hostParam,
    forceRedirect: true,
  };

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <PolarisProvider i18n={enTranslations}>
        <AppBridgeProvider config={appBridgeConfig}>
          <App />
        </AppBridgeProvider>
      </PolarisProvider>
    </React.StrictMode>
  );
}