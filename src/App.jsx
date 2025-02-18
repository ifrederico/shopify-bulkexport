// src/App.jsx
import React, { useState } from 'react';
import enTranslations from '@shopify/polaris/locales/en.json';
import {
  AppProvider,
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Frame
} from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

function App() {
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');

  const handleInstall = () => {
    if (!shopDomain) {
      setError('Please enter your shop domain.');
      return;
    }
    // Reset any previous error
    setError('');
    
    // Replace with your actual server URL when deployed.
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    // Redirect the user to the OAuth initiation endpoint.
    window.location.href = `${serverUrl}/auth?shop=${shopDomain}`;
  };

  return (
    <AppProvider i18n={enTranslations}>
      <Frame>
        <Page title="Shopify Bulk Export">
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <FormLayout>
                  <TextField
                    label="Shop Domain"
                    placeholder="your-shop.myshopify.com"
                    value={shopDomain}
                    onChange={(value) => setShopDomain(value)}
                    autoComplete="off"
                  />
                  {error && (
                    <p style={{ color: 'red', margin: '0.5rem 0' }}>{error}</p>
                  )}
                  <Button primary onClick={handleInstall}>
                    Install App
                  </Button>
                </FormLayout>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    </AppProvider>
  );
}

export default App;