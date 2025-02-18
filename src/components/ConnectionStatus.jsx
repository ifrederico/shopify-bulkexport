// src/components/ConnectionStatus.jsx
import React from 'react';
import { Card, Banner, Button, Text } from '@shopify/polaris';

export default function ConnectionStatus({ connectedDomain, handleDisconnect }) {
  return (
    <Card sectioned>
      <div className="space-y-4">
        <Banner status="success">
          <Text variant="bodyMd" as="p">
            Connected to store:{' '}
            <Text variant="bodyMd" as="span" fontWeight="bold">
              {connectedDomain}
            </Text>
          </Text>
        </Banner>
        <div style={{ marginTop: '1rem' }}>
          <Button destructive onClick={handleDisconnect}>
            Disconnect Store
          </Button>
        </div>
      </div>
    </Card>
  );
}