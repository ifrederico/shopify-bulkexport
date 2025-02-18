// src/components/ConnectForm.jsx
import React from 'react';
import { Card, FormLayout, TextField, Button, Text } from '@shopify/polaris';

export default function ConnectForm({
  shopDomain,
  setShopDomain,
  apiKey,
  setApiKey,
  formError,
  setFormError,
  loading,
  handleConnect,
}) {
  return (
    <Card sectioned>
      <FormLayout>
        <TextField
          label="Shop Domain"
          value={shopDomain}
          onChange={(value) => {
            setShopDomain(value);
            setFormError('');
          }}
          placeholder="your-store.myshopify.com"
          autoComplete="off"
          helpText="Enter your myshopify.com domain"
        />
        <TextField
          label="Shopify API Key"
          value={apiKey}
          onChange={(value) => {
            setApiKey(value);
            setFormError('');
          }}
          autoComplete="off"
          type="password"
        />
        <div>
          <Button primary onClick={handleConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
          {formError && (
            <div style={{ marginTop: '0.5rem', color: 'var(--p-color-text-critical)' }}>
              <Text variant="bodySm" as="p" color="critical">
                {formError}
              </Text>
            </div>
          )}
        </div>
      </FormLayout>
    </Card>
  );
}