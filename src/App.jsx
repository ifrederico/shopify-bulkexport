// src/App.jsx
import React from 'react';
import enTranslations from '@shopify/polaris/locales/en.json';
import {
  AppProvider,
  Page,
  Layout,
  Frame,
  Loading,
  Toast,
} from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

import ConnectForm from './components/ConnectForm';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [apiKey, setApiKey] = React.useState('');
  const [shopDomain, setShopDomain] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [toastActive, setToastActive] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectedDomain, setConnectedDomain] = React.useState('');

  // Connects to our backend, which in turn validates with Shopify
  const handleConnect = async () => {
    if (!apiKey || !shopDomain) {
      setFormError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      const response = await fetch('http://localhost:3000/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain, apiKey }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Connection failed');
      }
      // Successful connection
      setToastActive(true);
      setConnectedDomain(shopDomain);
      setIsConnected(true);
      setApiKey('');
      setShopDomain('');
    } catch (err) {
      setFormError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Disconnects by calling our backend
  const handleDisconnect = async () => {
    await fetch('http://localhost:3000/api/disconnect');
    setIsConnected(false);
    setConnectedDomain('');
    setToastActive(true);
  };

  return (
    <AppProvider i18n={enTranslations}>
      <Frame>
        {loading && <Loading />}
        <Page title="Shopify Store Connection">
          <Layout>
            <Layout.Section>
              {isConnected ? (
                <ConnectionStatus
                  connectedDomain={connectedDomain}
                  handleDisconnect={handleDisconnect}
                />
              ) : (
                <ConnectForm
                  shopDomain={shopDomain}
                  setShopDomain={setShopDomain}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  formError={formError}
                  setFormError={setFormError}
                  loading={loading}
                  handleConnect={handleConnect}
                />
              )}
            </Layout.Section>
          </Layout>
        </Page>
        {toastActive && (
          <Toast
            content={
              isConnected
                ? 'Successfully connected to Shopify'
                : 'Store disconnected'
            }
            onDismiss={() => setToastActive(false)}
          />
        )}
      </Frame>
    </AppProvider>
  );
}

export default App;