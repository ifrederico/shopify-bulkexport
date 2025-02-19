// src/App.jsx
import React from 'react';
import { Page, Layout, Card, Text, Heading } from '@shopify/polaris';

export default function App() {
  return (
    <Page title="Welcome">
      <Layout>
        <Layout.Section>
          <Card sectioned>
          <Text variant="headingMd" as="h1">Online store dashboard</Text>
            <Text variant="bodyMd" as="p">
              You installed our Shopify Bulk Export app.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}