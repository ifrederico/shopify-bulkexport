// server/server.js

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST, PORT } = process.env;
const app = express();

app.use(express.json());
app.use(cors());

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Only one ../ up from /server to reach /shopify-bulkexport
const distPath = path.join(__dirname, '../dist');

// Serve static assets from dist/
app.use(
  '/shopify-bulkexport/assets',
  express.static(path.join(distPath, 'assets'))
);

// Return a simple "status" page if the user hits /shopify-bulkexport with no shop/host
function getStatusPage() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Shopify Bulk Editor Server</title>
    <style>
      body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      .container { text-align: center; margin-top: 50px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Shopify Bulk Editor Server</h1>
      <p>Status: Running</p>
      <p>Please access this app through your Shopify admin panel.</p>
    </div>
  </body>
  </html>
  `;
}

// Basic HMAC validation
function verifyHmac(queryParams) {
  const { hmac, ...rest } = queryParams;
  const sortedParams = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('');
  const calculated = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');
  return calculated === hmac;
}

// Root endpoint
app.get('/shopify-bulkexport', (req, res) => {
  const { shop, host } = req.query;
  if (shop || host) {
    // Serve the React embedded app
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    // Show the simple status page
    res.send(getStatusPage());
  }
});

// Start OAuth
app.get('/shopify-bulkexport/auth', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).send('Missing ?shop param');
  }
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/shopify-bulkexport/auth/callback`;
  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&state=${state}` +
    `&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
});

// OAuth callback
app.get('/shopify-bulkexport/auth/callback', async (req, res) => {
  const { shop, hmac, code, state, timestamp } = req.query;
  if (!shop || !hmac || !code || !state || !timestamp) {
    return res.status(400).send('Missing required params');
  }
  if (!verifyHmac(req.query)) {
    return res.status(400).send('HMAC validation failed');
  }

  try {
    // Exchange code for a permanent token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenRes = await axios.post(tokenUrl, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });
    console.log(`Access token for ${shop}:`, tokenRes.data.access_token);

    // Redirect back so the user sees your embedded app
    res.redirect(`${HOST}/shopify-bulkexport?shop=${shop}`);
  } catch (error) {
    console.error('Error obtaining access token:', error.message);
    res.status(500).send('Error obtaining access token');
  }
});

// Catch-all for deeper routes
app.get('/shopify-bulkexport/*', (req, res) => {
  const { shop, host } = req.query;
  if (shop || host) {
    // Serve the built React app
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    // If no shop param, show the status page
    res.redirect('/shopify-bulkexport');
  }
});

// Start server
app.listen(PORT || 3000, () => {
  console.log(`Express server running on port ${PORT || 3000}`);
});